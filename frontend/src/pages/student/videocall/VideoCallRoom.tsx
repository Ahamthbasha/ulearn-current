import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { type RootState } from "../../../redux/store";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";
import {
  type JoinRoomPayload,
  type UserJoinedPayload,
  type OfferPayload,
  type AnswerPayload,
  type CandidatePayload,
} from "../interface/studentInterface";

declare module "socket.io-client" {
  interface Socket {
    data?: {
      email: string;
      role: "student" | "instructor";
      roomId?: string;
    };
  }
}

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const VideoCallRoom: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
  const [remoteUserRole, setRemoteUserRole] = useState<
    "student" | "mentor" | null
  >(null);

  const userState = useSelector((state: RootState) => state.user);
  const instructorState = useSelector((state: RootState) => state.instructor);
  const user =
    userState.email && userState.role
      ? userState
      : instructorState.email && instructorState.role
      ? instructorState
      : null;

  useEffect(() => {
    if (!user || !user.email || !user.role) {
      console.error("User not authenticated:", { userState, instructorState });
      setError("Please log in to join the video call.");
      return;
    }

    const socket = io(SERVER_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socketRef.current.data = {
      email: user.email,
      role: user.role as "student" | "instructor",
    };

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
      setError("Failed to connect to signaling server.");
    });

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("send-candidate", {
          candidate: event.candidate,
          roomId: bookingId,
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(console.error);
      }
    };

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoOn,
          audio: micOn,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(console.error);
        }

        if (peerConnectionRef.current && localStreamRef.current) {
          const safeStream = localStreamRef.current;
          safeStream
            .getTracks()
            .forEach((track) =>
              peerConnectionRef.current!.addTrack(track, safeStream)
            );
        }

        socketRef.current?.emit("join-room", {
          roomId: bookingId,
          email: user.email,
          role: user.role,
        } as JoinRoomPayload);
        setJoined(true);
      } catch (err) {
        console.error("Media error:", err);
        setError("Please allow camera & mic access.");
      }
    };

    initMedia();

    socketRef.current.on(
      "user-joined",
      ({ email, name, role }: UserJoinedPayload) => {
        if (email !== user.email) {
          setRemoteUserName(name || email); // Use name if available, fallback to email
          setRemoteUserRole(role === "student" ? "student" : "mentor"); // Map role to display
        }
        if (user.role === "instructor") {
          handleStartCall();
        }
      }
    );

    socketRef.current.on(
      "receive-offer",
      async ({ offer, from }: OfferPayload) => {
        try {
          await peerConnectionRef.current!.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peerConnectionRef.current!.createAnswer();
          await peerConnectionRef.current!.setLocalDescription(answer);
          socketRef.current?.emit("send-answer", {
            answer,
            roomId: bookingId,
          });
          if (!remoteUserName) {
            setRemoteUserName(from); // Use 'from' as name (set by backend)
            setRemoteUserRole("mentor"); // Fallback, improve with role from backend if possible
          }
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      }
    );

    socketRef.current.on(
      "receive-answer",
      async ({ answer, from }: AnswerPayload) => {
        try {
          await peerConnectionRef.current?.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          if (!remoteUserName) {
            setRemoteUserName(from); // Use 'from' as name (set by backend)
            setRemoteUserRole("student"); //Fallback, improve with role from backend if possible
          }
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    );

    socketRef.current.on(
      "receive-candidate",
      async ({ candidate, from }: CandidatePayload) => {
        try {
          await peerConnectionRef.current?.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          if (!remoteUserName) {
            setRemoteUserName(from); // Use 'from' as name (set by backend)
            setRemoteUserRole("student"); // Fallback, improve with role from backend if possible
          }
        } catch (err) {
          console.error("ICE candidate error:", err);
        }
      }
    );

    socketRef.current.on("call:end", ({ from }: { from: string }) => {
      console.log(`Call ended by ${from}`);
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      setRemoteUserName(null); // Clear remote user name
      setRemoteUserRole(null); // Clear remote user role
    });

    return () => {
      socketRef.current?.disconnect();
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [bookingId, user]);

  const handleStartCall = async () => {
    if (!peerConnectionRef.current || !socketRef.current) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit("send-offer", {
        offer,
        roomId: bookingId,
      });
    } catch (err) {
      console.error("Start call error:", err);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };

  const endCall = () => {
    socketRef.current?.emit("call:end", { roomId: bookingId });
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
    setJoined(false);
    setRemoteUserName(null); // Clear remote user name
    setRemoteUserRole(null); // Clear remote user role
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-6">Video Call Room</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
        {/* Local Video */}
        <div className="w-full md:w-1/2">
          <h3 className="text-lg mb-2">You</h3>
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 bg-black rounded-lg shadow-lg"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
              {user?.name || user?.email || "You"}{" "}
              {user?.role === "student" ? "(Student)" : "(Mentor)"}
            </div>
          </div>
        </div>

        {/* Remote Video */}
        <div className="w-full md:w-1/2">
          <h3 className="text-lg mb-2">Remote</h3>
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg shadow-lg"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
              {remoteUserName || "Waiting for remote user..."}{" "}
              {remoteUserRole ? `(${remoteUserRole})` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg flex gap-6">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            micOn
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          } text-white transition-colors`}
        >
          {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            videoOn
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          } text-white transition-colors`}
        >
          {videoOn ? <FaVideo /> : <FaVideoSlash />}
        </button>
        <button
          onClick={endCall}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
        >
          <FaPhoneSlash />
        </button>
      </div>

      {user?.role === "instructor" && (
        <button
          onClick={handleStartCall}
          disabled={!joined}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Start Call
        </button>
      )}
    </div>
  );
};

export default VideoCallRoom;

// import React, { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useSelector } from "react-redux";
// import { type RootState } from "../../../redux/store";
// import {
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaVideo,
//   FaVideoSlash,
//   FaPhoneSlash,
//   FaExpand,
//   FaCog,
//   FaUsers,
// } from "react-icons/fa";

// // Type augmentation for Socket.io-client (if you use .data)
// declare module "socket.io-client" {
//   interface Socket {
//     data?: {
//       email: string;
//       role: "student" | "instructor";
//       roomId?: string;
//     };
//   }
// }

// interface JoinRoomPayload {
//   roomId: string;
//   email: string;
//   role: "student" | "instructor";
// }

// interface UserJoinedPayload {
//   email: string;
//   role: "student" | "instructor";
//   userId: string;
//   name?: string;
// }

// interface OfferPayload {
//   offer: RTCSessionDescriptionInit;
//   from: string;
// }

// interface AnswerPayload {
//   answer: RTCSessionDescriptionInit;
//   from: string;
// }

// interface CandidatePayload {
//   candidate: RTCIceCandidateInit;
//   from: string;
// }

// const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// // --- Enhanced Meet-style Video Tile Component ---
// const VideoTile = ({
//   videoRef,
//   name,
//   role,
//   isLocal = false,
//   videoOn = true,
//   micOn = true,
//   isMainView = false,
// }: {
//   videoRef: React.RefObject<HTMLVideoElement | null>;
//   name: string;
//   role: string | null;
//   isLocal?: boolean;
//   videoOn?: boolean;
//   micOn?: boolean;
//   isMainView?: boolean;
// }) => {
//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   return (
//     <div
//       className={`
//         relative rounded-xl overflow-hidden bg-gray-900 shadow-2xl transition-all duration-300
//         ${isMainView
//           ? "w-full h-full min-h-[400px] lg:min-h-[500px]"
//           : "w-full h-full min-h-[200px] sm:min-h-[250px] md:min-h-[300px]"
//         }
//         ${!videoOn ? "bg-gradient-to-br from-gray-800 to-gray-900" : ""}
//       `}
//     >
//       {videoOn ? (
//         <video
//           ref={videoRef}
//           autoPlay
//           {...(isLocal ? { muted: true } : {})}
//           playsInline
//           className="w-full h-full object-cover"
//           style={{ background: "#1f2937" }}
//         />
//       ) : (
//         <div className="w-full h-full flex items-center justify-center">
//           <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-lg">
//             {getInitials(name || "U")}
//           </div>
//         </div>
//       )}

//       {/* User info overlay */}
//       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 md:p-4">
//         <div className="flex items-center justify-between text-white">
//           <div className="flex items-center gap-2 min-w-0">
//             <span className="font-semibold text-sm md:text-base truncate">
//               {name || (isLocal ? "You" : "Unknown")}
//             </span>
//             {role && (
//               <span className="px-2 py-1 rounded-full bg-white/20 text-xs font-medium whitespace-nowrap">
//                 {role === "student" ? "Student" : role === "mentor" ? "Mentor" : role}
//               </span>
//             )}
//           </div>

//           {/* Media status indicators */}
//           <div className="flex gap-2 items-center">
//             {typeof micOn === "boolean" && (
//               <div className={`p-1.5 rounded-full ${micOn ? "bg-green-500/80" : "bg-red-500/80"}`}>
//                 {micOn ? (
//                   <FaMicrophone className="text-white text-xs" />
//                 ) : (
//                   <FaMicrophoneSlash className="text-white text-xs" />
//                 )}
//               </div>
//             )}
//             {typeof videoOn === "boolean" && (
//               <div className={`p-1.5 rounded-full ${videoOn ? "bg-green-500/80" : "bg-red-500/80"}`}>
//                 {videoOn ? (
//                   <FaVideo className="text-white text-xs" />
//                 ) : (
//                   <FaVideoSlash className="text-white text-xs" />
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Local video indicator */}
//       {isLocal && (
//         <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded">
//           You
//         </div>
//       )}
//     </div>
//   );
// };

// // --- Main Component ---
// const VideoCallRoom: React.FC = () => {
//   const { bookingId } = useParams<{ bookingId: string }>();
//   const navigate = useNavigate();
//   const localVideoRef = useRef<HTMLVideoElement | null>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
//   const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
//   const socketRef = useRef<Socket | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const [error, setError] = useState<string | null>(null);
//   const [joined, setJoined] = useState(false);
//   const [micOn, setMicOn] = useState(true);
//   const [videoOn, setVideoOn] = useState(true);
//   const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
//   const [remoteUserRole, setRemoteUserRole] = useState<"student" | "mentor" | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
//   const [callStarted, setCallStarted] = useState(false);

//   const userState = useSelector((state: RootState) => state.user);
//   const instructorState = useSelector((state: RootState) => state.instructor);
//   const user =
//     userState.email && userState.role
//       ? userState
//       : instructorState.email && instructorState.role
//       ? instructorState
//       : null;

//   useEffect(() => {
//     if (!user || !user.email || !user.role) {
//       setError("Please log in to join the video call.");
//       return;
//     }

//     const socket = io(SERVER_URL, { withCredentials: true });
//     socketRef.current = socket;

//     socketRef.current.data = {
//       email: user.email,
//       role: user.role as "student" | "instructor",
//     };

//     socket.on("connect", () => {
//       setConnectionStatus("Connected");
//     });

//     socket.on("connect_error", (_err) => {
//       setError("Failed to connect to signaling server.");
//       setConnectionStatus("Connection failed");
//     });

//     peerConnectionRef.current = new RTCPeerConnection({
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//       ],
//     });

//     peerConnectionRef.current.onconnectionstatechange = () => {
//       const state = peerConnectionRef.current?.connectionState;
//       setConnectionStatus(state === "connected" ? "Connected" : "Connecting...");
//     };

//     peerConnectionRef.current.onicecandidate = (event) => {
//       if (event.candidate && socketRef.current) {
//         socketRef.current.emit("send-candidate", {
//           candidate: event.candidate,
//           roomId: bookingId,
//         });
//       }
//     };

//     peerConnectionRef.current.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//         remoteVideoRef.current.play().catch(() => {});
//         setCallStarted(true);
//       }
//     };

//     const initMedia = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             facingMode: "user"
//           },
//           audio: {
//             echoCancellation: true,
//             noiseSuppression: true,
//             autoGainControl: true,
//           },
//         });
//         localStreamRef.current = stream;

//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//           localVideoRef.current.play().catch(() => {});
//         }

//         if (peerConnectionRef.current && localStreamRef.current) {
//           const safeStream = localStreamRef.current;
//           safeStream.getTracks().forEach((track) =>
//             peerConnectionRef.current!.addTrack(track, safeStream)
//           );
//         }

//         socketRef.current?.emit("join-room", {
//           roomId: bookingId,
//           email: user.email,
//           role: user.role,
//         } as JoinRoomPayload);
//         setJoined(true);
//       } catch (err) {
//         setError("Please allow camera & microphone access to join the call.");
//       }
//     };

//     initMedia();

//     socketRef.current.on("user-joined", ({ email, name, role }: UserJoinedPayload) => {
//       if (email !== user.email) {
//         setRemoteUserName(name || email);
//         setRemoteUserRole(role === "student" ? "student" : "mentor");
//         setConnectionStatus("User joined");
//       }
//       if (user.role === "instructor") {
//         handleStartCall();
//       }
//     });

//     socketRef.current.on(
//       "receive-offer",
//       async ({ offer, from }: OfferPayload) => {
//         try {
//           await peerConnectionRef.current!.setRemoteDescription(
//             new RTCSessionDescription(offer)
//           );
//           const answer = await peerConnectionRef.current!.createAnswer();
//           await peerConnectionRef.current!.setLocalDescription(answer);
//           socketRef.current?.emit("send-answer", {
//             answer,
//             roomId: bookingId,
//           });
//           if (!remoteUserName) {
//             setRemoteUserName(from);
//           }
//         } catch {
//           // ignore
//         }
//       }
//     );

//     socketRef.current.on(
//       "receive-answer",
//       async ({ answer, from }: AnswerPayload) => {
//         try {
//           await peerConnectionRef.current?.setRemoteDescription(
//             new RTCSessionDescription(answer)
//           );
//           if (!remoteUserName) {
//             setRemoteUserName(from);
//           }
//         } catch {
//           // ignore
//         }
//       }
//     );

//     socketRef.current.on(
//       "receive-candidate",
//       async ({ candidate, from }: CandidatePayload) => {
//         try {
//           await peerConnectionRef.current?.addIceCandidate(
//             new RTCIceCandidate(candidate)
//           );
//           if (!remoteUserName) {
//             setRemoteUserName(from);
//           }
//         } catch {
//           // ignore
//         }
//       }
//     );

//     socketRef.current.on("call:end", (_data: { from: string }) => {
//       peerConnectionRef.current?.close();
//       peerConnectionRef.current = null;
//       remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
//       localStreamRef.current?.getTracks().forEach((track) => track.stop());
//       setRemoteUserName(null);
//       setRemoteUserRole(null);
//       setCallStarted(false);
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       peerConnectionRef.current?.close();
//       peerConnectionRef.current = null;
//       localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     };
//     // eslint-disable-next-line
//   }, [bookingId, user]);

//   const handleStartCall = async () => {
//     if (!peerConnectionRef.current || !socketRef.current) return;
//     try {
//       const offer = await peerConnectionRef.current.createOffer();
//       await peerConnectionRef.current.setLocalDescription(offer);
//       socketRef.current.emit("send-offer", {
//         offer,
//         roomId: bookingId,
//       });
//       setCallStarted(true);
//     } catch {}
//   };

//   const toggleMic = () => {
//     if (localStreamRef.current) {
//       const audioTracks = localStreamRef.current.getAudioTracks();
//       if (audioTracks.length > 0) {
//         audioTracks[0].enabled = !micOn;
//         setMicOn(!micOn);
//       }
//     }
//   };

//   const toggleVideo = () => {
//     if (localStreamRef.current) {
//       const videoTracks = localStreamRef.current.getVideoTracks();
//       if (videoTracks.length > 0) {
//         videoTracks[0].enabled = !videoOn;
//         setVideoOn(!videoOn);
//       }
//     }
//   };

//   const endCall = () => {
//     socketRef.current?.emit("call:end", { roomId: bookingId });
//     peerConnectionRef.current?.close();
//     peerConnectionRef.current = null;
//     localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
//     setJoined(false);
//     setRemoteUserName(null);
//     setRemoteUserRole(null);
//     setCallStarted(false);

//     // Navigate back to previous page
//     navigate(-1);
//   };

//   return (
//     <div className="h-screen w-full bg-gray-900 flex flex-col relative overflow-hidden">
//       {/* Header */}
//       <div className="relative z-10 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <h1 className="text-xl font-semibold text-white">
//               Video Call
//             </h1>
//             <div className="flex items-center gap-2 text-sm text-gray-300">
//               <div className={`w-2 h-2 rounded-full ${connectionStatus === "Connected" ? "bg-green-500" : "bg-yellow-500"}`} />
//               {connectionStatus}
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
//               <FaUsers className="text-lg" />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
//               <FaCog className="text-lg" />
//             </button>
//             <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
//               <FaExpand className="text-lg" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && (
//         <div className="relative z-10 mx-4 mt-4 p-4 bg-red-900/80 border border-red-700 rounded-lg text-red-200 text-center font-medium">
//           {error}
//         </div>
//       )}

//       {/* Main video area */}
//       <div className="flex-1 relative p-4 md:p-6">
//         <div className="h-full w-full">
//           {remoteUserName && callStarted ? (
//             // Two-participant layout
//             <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4">
//               {/* Main video (remote user) */}
//               <div className="lg:col-span-3 h-full min-h-[300px] lg:min-h-0">
//                 <VideoTile
//                   videoRef={remoteVideoRef}
//                   name={remoteUserName}
//                   role={remoteUserRole}
//                   videoOn={true}
//                   micOn={undefined}
//                   isMainView={true}
//                 />
//               </div>

//               {/* Sidebar with local video */}
//               <div className="lg:col-span-1 h-full min-h-[200px] lg:min-h-0">
//                 <VideoTile
//                   videoRef={localVideoRef}
//                   name={user?.name || user?.email || "You"}
//                   role={user?.role === "student" ? "student" : "mentor"}
//                   isLocal
//                   videoOn={videoOn}
//                   micOn={micOn}
//                 />
//               </div>
//             </div>
//           ) : (
//             // Single participant layout (waiting for others)
//             <div className="h-full flex flex-col items-center justify-center gap-6">
//               <div className="w-full max-w-lg aspect-video">
//                 <VideoTile
//                   videoRef={localVideoRef}
//                   name={user?.name || user?.email || "You"}
//                   role={user?.role === "student" ? "student" : "mentor"}
//                   isLocal
//                   videoOn={videoOn}
//                   micOn={micOn}
//                   isMainView={true}
//                 />
//               </div>

//               <div className="text-center">
//                 <p className="text-xl text-gray-300 mb-2">
//                   {joined ? "Waiting for others to join..." : "Joining call..."}
//                 </p>
//                 <p className="text-gray-500">
//                   Room ID: {bookingId}
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Bottom controls */}
//       <div className="relative z-20 pb-6 pt-2">
//         <div className="flex justify-center">
//           <div className="flex items-center gap-4 px-6 py-4 bg-gray-800/90 backdrop-blur-sm rounded-full shadow-2xl border border-gray-700/50">
//             <button
//               onClick={toggleMic}
//               className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-200 hover:scale-105
//                 ${micOn
//                   ? "bg-gray-700 text-white hover:bg-gray-600"
//                   : "bg-red-600 text-white hover:bg-red-700"
//                 }`}
//               title={micOn ? "Mute microphone" : "Unmute microphone"}
//             >
//               {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
//             </button>

//             <button
//               onClick={toggleVideo}
//               className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-200 hover:scale-105
//                 ${videoOn
//                   ? "bg-gray-700 text-white hover:bg-gray-600"
//                   : "bg-red-600 text-white hover:bg-red-700"
//                 }`}
//               title={videoOn ? "Turn off camera" : "Turn on camera"}
//             >
//               {videoOn ? <FaVideo /> : <FaVideoSlash />}
//             </button>

//             <button
//               onClick={endCall}
//               className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-lg transition-all duration-200 hover:scale-105 shadow-lg"
//               title="End call"
//             >
//               <FaPhoneSlash />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Instructor start call button */}
//       {user?.role === "instructor" && !callStarted && joined && (
//         <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30">
//           <button
//             onClick={handleStartCall}
//             className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-xl transition-all duration-200 hover:scale-105"
//           >
//             Start Call
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VideoCallRoom;

// import React, { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import { useSelector } from "react-redux";
// import { type RootState } from "../../../redux/store";
// import {
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaVideo,
//   FaVideoSlash,
//   FaPhoneSlash,
// } from "react-icons/fa";

// declare module "socket.io-client" {
//   interface Socket {
//     data?: {
//       email: string;
//       role: "student" | "instructor";
//       roomId?: string;
//     };
//   }
// }

// interface JoinRoomPayload {
//   roomId: string;
//   email: string;
//   role: "student" | "instructor";
// }

// interface UserJoinedPayload {
//   email: string;
//   role: "student" | "instructor";
//   userId: string;
//   name?: string;
// }

// interface OfferPayload {
//   offer: RTCSessionDescriptionInit;
//   from: string;
// }

// interface AnswerPayload {
//   answer: RTCSessionDescriptionInit;
//   from: string;
// }

// interface CandidatePayload {
//   candidate: RTCIceCandidateInit;
//   from: string;
// }

// const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// const VideoCallRoom: React.FC = () => {
//   const { bookingId } = useParams<{ bookingId: string }>();
//   const navigate = useNavigate();
//   const localVideoRef = useRef<HTMLVideoElement | null>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
//   const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
//   const socketRef = useRef<Socket | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const [error, setError] = useState<string | null>(null);
//   const [_joined,setJoined] = useState(false);
//   const [micOn, setMicOn] = useState(true);
//   const [videoOn, setVideoOn] = useState(true);
//   const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
//   const [remoteUserRole, setRemoteUserRole] = useState<"student" | "mentor" | null>(null);

//   const userState = useSelector((state: RootState) => state.user);
//   const instructorState = useSelector((state: RootState) => state.instructor);
//   const user =
//     userState.email && userState.role
//       ? userState
//       : instructorState.email && instructorState.role
//       ? instructorState
//       : null;

//   useEffect(() => {
//     if (!user || !user.email || !user.role) {
//       console.error("User not authenticated:", { userState, instructorState });
//       setError("Please log in to join the video call.");
//       return;
//     }

//     const socket = io(SERVER_URL, {
//       withCredentials: true,
//     });
//     socketRef.current = socket;

//     socketRef.current.data = {
//       email: user.email,
//       role: user.role as "student" | "instructor",
//     };

//     socket.on("connect_error", (err) => {
//       console.error("Socket.IO connection error:", err.message);
//       setError("Failed to connect to signaling server.");
//     });

//     peerConnectionRef.current = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });

//     peerConnectionRef.current.onicecandidate = (event) => {
//       if (event.candidate && socketRef.current) {
//         socketRef.current.emit("send-candidate", {
//           candidate: event.candidate,
//           roomId: bookingId,
//         });
//       }
//     };

//     peerConnectionRef.current.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//         remoteVideoRef.current.play().catch(console.error);
//       }
//     };

//     const initMedia = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: videoOn,
//           audio: micOn,
//         });
//         localStreamRef.current = stream;

//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//           localVideoRef.current.play().catch(console.error);
//         }

//         if (peerConnectionRef.current && localStreamRef.current) {
//           const safeStream = localStreamRef.current;
//           safeStream.getTracks().forEach((track) =>
//             peerConnectionRef.current!.addTrack(track, safeStream)
//           );
//         }

//         socketRef.current?.emit("join-room", {
//           roomId: bookingId,
//           email: user.email,
//           role: user.role,
//         } as JoinRoomPayload);
//         setJoined(true);
//       } catch (err) {
//         console.error("Media error:", err);
//         setError("Please allow camera & mic access.");
//       }
//     };

//     initMedia();

//     socketRef.current.on("user-joined", ({ email, name, role }: UserJoinedPayload) => {
//       if (email !== user.email) {
//         setRemoteUserName(name || email); // Use name if available, fallback to email
//         setRemoteUserRole(role === "student" ? "student" : "mentor"); // Map role to display
//       }
//       if (user.role === "instructor") {
//         handleStartCall();
//       }
//     });

//     socketRef.current.on("receive-offer", async ({ offer, from }: OfferPayload) => {
//       try {
//         await peerConnectionRef.current!.setRemoteDescription(
//           new RTCSessionDescription(offer)
//         );
//         const answer = await peerConnectionRef.current!.createAnswer();
//         await peerConnectionRef.current!.setLocalDescription(answer);
//         socketRef.current?.emit("send-answer", {
//           answer,
//           roomId: bookingId,
//         });
//         if (!remoteUserName) {
//           setRemoteUserName(from); // Use 'from' as name (set by backend)
//           setRemoteUserRole("mentor"); // Fallback, improve with role from backend if possible
//         }
//       } catch (err) {
//         console.error("Error handling offer:", err);
//       }
//     });

//     socketRef.current.on("receive-answer", async ({ answer, from }: AnswerPayload) => {
//       try {
//         await peerConnectionRef.current?.setRemoteDescription(
//           new RTCSessionDescription(answer)
//         );
//         if (!remoteUserName) {
//           setRemoteUserName(from); // Use 'from' as name (set by backend)
//           setRemoteUserRole("mentor"); // Fallback, improve with role from backend if possible
//         }
//       } catch (err) {
//         console.error("Error setting remote description:", err);
//       }
//     });

//     socketRef.current.on("receive-candidate", async ({ candidate, from }: CandidatePayload) => {
//       try {
//         await peerConnectionRef.current?.addIceCandidate(
//           new RTCIceCandidate(candidate)
//         );
//         if (!remoteUserName) {
//           setRemoteUserName(from); // Use 'from' as name (set by backend)
//           setRemoteUserRole("student"); // Fallback, improve with role from backend if possible
//         }
//       } catch (err) {
//         console.error("ICE candidate error:", err);
//       }
//     });

//     socketRef.current.on("call:end", ({ from }: { from: string }) => {
//       console.log(`Call ended by ${from}`);
//       peerConnectionRef.current?.close();
//       peerConnectionRef.current = null;
//       remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
//       localStreamRef.current?.getTracks().forEach((track) => track.stop());
//       setRemoteUserName(null); // Clear remote user name
//       setRemoteUserRole(null); // Clear remote user role
//     });

//     return () => {
//       socketRef.current?.disconnect();
//       peerConnectionRef.current?.close();
//       peerConnectionRef.current = null;
//       localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     };
//   }, [bookingId, user]);

//   const handleStartCall = async () => {
//     if (!peerConnectionRef.current || !socketRef.current) return;

//     try {
//       const offer = await peerConnectionRef.current.createOffer();
//       await peerConnectionRef.current.setLocalDescription(offer);
//       socketRef.current.emit("send-offer", {
//         offer,
//         roomId: bookingId,
//       });
//     } catch (err) {
//       console.error("Start call error:", err);
//     }
//   };

//   const toggleMic = () => {
//     if (localStreamRef.current) {
//       const audioTracks = localStreamRef.current.getAudioTracks();
//       if (audioTracks.length > 0) {
//         audioTracks[0].enabled = !micOn;
//         setMicOn(!micOn);
//       }
//     }
//   };

//   const toggleVideo = () => {
//     if (localStreamRef.current) {
//       const videoTracks = localStreamRef.current.getVideoTracks();
//       if (videoTracks.length > 0) {
//         videoTracks[0].enabled = !videoOn;
//         setVideoOn(!videoOn);
//       }
//     }
//   };

//   const endCall = () => {
//     socketRef.current?.emit("call:end", { roomId: bookingId });
//     peerConnectionRef.current?.close();
//     peerConnectionRef.current = null;
//     localStreamRef.current?.getTracks().forEach((track) => track.stop());
//     remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);
//     setJoined(false);
//     setRemoteUserName(null); // Clear remote user name
//     setRemoteUserRole(null); // Clear remote user role
//     navigate(-1); // Navigate to the previous page
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
//       <h2 className="text-2xl font-bold mb-6">Video Call Room</h2>
//       {error && <div className="text-red-500 mb-4">{error}</div>}

//       <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
//         {/* Local Video */}
//         <div className="w-full md:w-1/2">
//           <h3 className="text-lg mb-2">You</h3>
//           <div className="relative">
//             <video
//               ref={localVideoRef}
//               autoPlay
//               muted
//               playsInline
//               className="w-full h-64 bg-black rounded-lg shadow-lg"
//             />
//             <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
//               {user?.name || user?.email || "You"} {user?.role === "student" ? "(Student)" : "(Mentor)"}
//             </div>
//           </div>
//         </div>

//         {/* Remote Video */}
//         <div className="w-full md:w-1/2">
//           <h3 className="text-lg mb-2">Remote</h3>
//           <div className="relative">
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               className="w-full h-64 bg-black rounded-lg shadow-lg"
//             />
//             <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
//               {remoteUserName || "Waiting for remote user..."} {remoteUserRole ? `(${remoteUserRole})` : ""}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Control Bar */}
//       <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg flex gap-6">
//         <button
//           onClick={toggleMic}
//           className={`w-12 h-12 rounded-full flex items-center justify-center ${
//             micOn ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
//           } text-white transition-colors`}
//         >
//           {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
//         </button>
//         <button
//           onClick={toggleVideo}
//           className={`w-12 h-12 rounded-full flex items-center justify-center ${
//             videoOn ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
//           } text-white transition-colors`}
//         >
//           {videoOn ? <FaVideo /> : <FaVideoSlash />}
//         </button>
//         <button
//           onClick={endCall}
//           className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
//         >
//           <FaPhoneSlash />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VideoCallRoom;
