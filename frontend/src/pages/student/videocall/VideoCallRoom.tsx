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

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "https://ulearnbackend-op7t.onrender.com";

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

