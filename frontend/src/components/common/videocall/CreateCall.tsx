import React, { useState, useRef, useEffect } from "react";
import { useSocket } from "../../../redux/SocketProvider";
import {
  MdCallEnd,
  MdMic,
  MdMicOff,
  MdVideocam,
  MdVideocamOff,
  MdCall,
  MdSignalCellularAlt,
} from "react-icons/md";
import type { CallAnswerPayload, IceCandidatePayload, IncomingCallPayload } from "../../../types/interfaces/ICommon";

interface VideoCallModalProps {
  to: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const configuration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.stunprotocol.org" },
    {
      urls: "turn:your-turn-server.com",
      username: "your-username",
      credential: "your-password",
    },
  ],
};

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  to,
  isOpen,
  onClose,
}) => {
  const socket = useSocket();
  const [callState, setCallState] = useState({
    isCalling: false,
    isIncomingCall: false,
    isMuted: false,
    isVideoOff: false,
    callStatus: "Idle",
    callDuration: 0,
    mediaReady: false, // Add this to track if media is ready
  });

  // State to store incoming call offer
  const [incomingOffer, setIncomingOffer] =
    useState<RTCSessionDescriptionInit | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize local media stream when modal opens
  const initializeLocalMedia = async () => {
    try {
      console.log("Initializing local media...");
      
      // Request permissions first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      // Set local video stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("Local video stream set successfully");
      }

      setCallState((prev) => ({
        ...prev,
        mediaReady: true,
        callStatus: "Ready to call",
      }));

    } catch (error) {
      console.error("Error accessing media devices:", error);
      
      // Handle specific errors
      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            alert("Please allow camera and microphone access to make video calls.");
            break;
          case "NotFoundError":
            alert("No camera or microphone found on this device.");
            break;
          case "NotReadableError":
            alert("Camera or microphone is already in use by another application.");
            break;
          default:
            alert("Error accessing camera/microphone: " + error.message);
        }
      }
      
      // Close modal if media access fails
      onClose();
    }
  };

  // Reset all call-related states and close connections
  const resetCallState = () => {
    // Stop local media tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video sources
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset state
    setCallState({
      isCalling: false,
      isIncomingCall: false,
      isMuted: false,
      isVideoOff: false,
      callStatus: "Idle",
      callDuration: 0,
      mediaReady: false,
    });

    // Clear incoming offer
    setIncomingOffer(null);
  };

  // Initialize local media when modal opens
  useEffect(() => {
    if (isOpen && !localStreamRef.current) {
      initializeLocalMedia();
    }
    
    // Cleanup when modal closes
    return () => {
      if (!isOpen) {
        resetCallState();
      }
    };
  }, [isOpen]);

  // Initialize WebRTC peer connection
  const initializePeerConnection = () => {
    const peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidate generation
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice:candidate", {
          to,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("Received remote stream");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      switch (peerConnection.connectionState) {
        case "connected":
          setCallState((prev) => ({ ...prev, callStatus: "Connected" }));
          startCallTimer();
          break;
        case "disconnected":
        case "failed":
          resetCallState();
          onClose();
          break;
      }
    };

    return peerConnection;
  };

  // Start call timer
  const startCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);
  };

  // Format call duration to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Incoming call handler
    const handleIncomingCall = (payload: IncomingCallPayload) => {
      console.log("Incoming call payload:", payload);
      setCallState((prev) => ({
        ...prev,
        isIncomingCall: true,
        callStatus: "Incoming Call",
      }));
      // Store the incoming offer
      setIncomingOffer(payload.offer);
    };

    // ICE candidate handler
    const handleIceCandidate = (payload: IceCandidatePayload) => {
      if (peerConnectionRef.current && payload.candidate) {
        peerConnectionRef.current
          .addIceCandidate(new RTCIceCandidate(payload.candidate))
          .catch((e) => console.error("Error adding ICE candidate", e));
      }
    };

    // Call answer handler
    const handleCallAnswer = (payload: CallAnswerPayload) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current
          .setRemoteDescription(new RTCSessionDescription(payload.answer))
          .catch((e) => console.error("Error setting remote description", e));
      }
    };

    // Call ended handler
    const handleCallEnded = () => {
      resetCallState();
      onClose();
    };

    // Call rejected handler
    const handleCallRejected = () => {
      setCallState((prev) => ({ ...prev, callStatus: "Call rejected" }));
      setTimeout(() => {
        resetCallState();
        onClose();
      }, 2000);
    };

    // Attach socket listeners
    socket.on("incoming:call", handleIncomingCall);
    socket.on("ice:candidate", handleIceCandidate);
    socket.on("incoming:answer", handleCallAnswer);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:rejected", handleCallRejected);

    // Cleanup listeners
    return () => {
      socket.off("incoming:call", handleIncomingCall);
      socket.off("ice:candidate", handleIceCandidate);
      socket.off("incoming:answer", handleCallAnswer);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:rejected", handleCallRejected);
    };
  }, [socket, isOpen, to, onClose]);

  // Start video call
  const startVideoCall = async () => {
    if (!socket || !to || !localStreamRef.current) {
      console.log("Missing requirements for call:", { socket: !!socket, to, hasStream: !!localStreamRef.current });
      return;
    }

    try {
      console.log("Starting video call to:", to);

      // Initialize peer connection
      peerConnectionRef.current = initializePeerConnection();

      // Add local tracks to peer connection
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("Adding track:", track.kind);
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });

      // Create and set local description
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // Send offer to recipient
      socket.emit("outgoing:call", {
        to,
        fromOffer: offer,
      });

      setCallState((prev) => ({
        ...prev,
        isCalling: true,
        callStatus: "Calling...",
      }));

    } catch (error) {
      console.error("Error starting video call:", error);
      setCallState((prev) => ({ ...prev, callStatus: "Call failed" }));
    }
  };

  // Accept incoming video call
  const acceptVideoCall = async () => {
    if (!socket || !to || !incomingOffer || !localStreamRef.current) return;

    try {
      console.log("Accepting video call from:", to);

      // Initialize peer connection
      peerConnectionRef.current = initializePeerConnection();

      // Add local tracks to peer connection
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });

      // Set remote description
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(incomingOffer)
      );

      // Create and set local description (answer)
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      // Send answer to caller
      socket.emit("call:accepted", {
        to,
        answer,
      });

      setCallState((prev) => ({
        ...prev,
        isIncomingCall: false,
        isCalling: true,
        callStatus: "Connected",
      }));

      startCallTimer();
    } catch (error) {
      console.error("Error accepting video call:", error);
      resetCallState();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (socket && to) {
      socket.emit("call:rejected", { to });
    }
    resetCallState();
    onClose();
  };

  // End call
  const handleEndCall = () => {
    if (socket && to) {
      socket.emit("end:call", { to });
    }
    resetCallState();
    onClose();
  };

  // Toggle audio mute
  const toggleMute = () => {
    const newMuteState = !callState.isMuted;
    setCallState((prev) => ({ ...prev, isMuted: newMuteState }));

    // Toggle the audio tracks
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !newMuteState;
    });
  };

  // Toggle video
  const toggleVideo = () => {
    const newVideoState = !callState.isVideoOff;
    setCallState((prev) => ({ ...prev, isVideoOff: newVideoState }));

    // Toggle the video tracks
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !newVideoState;
    });
  };

  if (!isOpen) return null;

  // Render method
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-50">
      <div
        className="bg-gray-900 rounded-xl shadow-2xl p-4 w-full max-w-4xl aspect-video relative overflow-hidden border border-gray-700"
        style={{
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        {/* Call status badge */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-80 text-white text-sm px-3 py-1 rounded-full z-30 flex items-center space-x-2">
          <span>{callState.callStatus}</span>
          {(callState.callStatus === "Connected" ||
            callState.callStatus === "Calling...") && (
            <span className="flex items-center space-x-1">
              <span>•</span>
              <span>{formatDuration(callState.callDuration)}</span>
            </span>
          )}
        </div>

        {/* Connection quality indicator */}
        <div className="absolute top-4 right-40 bg-gray-800 bg-opacity-80 text-white text-sm px-2 py-1 rounded-full z-30 flex items-center">
          <MdSignalCellularAlt className="text-green-500" />
        </div>

        {/* Status indicators */}
        {callState.isIncomingCall && (
          <div
            className="absolute top-16 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-semibold p-4 rounded-lg shadow-lg z-30"
            style={{
              animation: "pulse 2s infinite ease-in-out",
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="animate-phone-ring">📞</div>
              <div>Incoming Call...</div>
            </div>
          </div>
        )}

        {/* Remote video container */}
        <div className="w-full h-full relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full rounded-lg object-cover"
          />
          {/* Show placeholder when no remote stream */}
          {!remoteVideoRef.current?.srcObject && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">👤</div>
                <div>Waiting for connection...</div>
              </div>
            </div>
          )}
        </div>

        {/* Local video */}
        <div className="absolute top-4 right-4 w-32 h-32">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full rounded-lg object-cover border-2 ${
              callState.isVideoOff
                ? "border-red-500 bg-gray-800"
                : "border-blue-500"
            }`}
          />

          <div className="absolute bottom-1 right-1 bg-gray-900 bg-opacity-70 text-white px-2 py-0.5 rounded text-xs">
            You
          </div>

          {/* Media status indicators */}
          <div className="absolute bottom-1 left-1 flex space-x-1">
            {/* Mic status indicator */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                callState.isMuted ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {callState.isMuted ? (
                <MdMicOff className="text-white text-xs" />
              ) : (
                <MdMic className="text-white text-xs" />
              )}
            </div>

            {/* Video status indicator */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                callState.isVideoOff ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {callState.isVideoOff ? (
                <MdVideocamOff className="text-white text-xs" />
              ) : (
                <MdVideocam className="text-white text-xs" />
              )}
            </div>
          </div>
        </div>

        {/* Call control buttons */}
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 md:space-x-4 bg-gray-900 bg-opacity-80 p-2 md:p-3 rounded-full shadow-lg"
          style={{
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* End Call Button */}
          <button
            className="bg-red-500 text-white p-2 md:p-3 rounded-full hover:bg-red-600 transition-colors transform hover:scale-110 active:scale-95"
            onClick={handleEndCall}
            aria-label="End Call"
          >
            <MdCallEnd className="h-5 w-5" />
          </button>

          {/* Mute Toggle Button */}
          <button
            className={`p-2 md:p-3 rounded-full transition-colors transform hover:scale-110 active:scale-95 ${
              callState.isMuted
                ? "bg-gray-600 text-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            onClick={toggleMute}
            disabled={!callState.mediaReady}
            aria-label={callState.isMuted ? "Unmute" : "Mute"}
          >
            {callState.isMuted ? (
              <MdMicOff className="h-5 w-5" />
            ) : (
              <MdMic className="h-5 w-5" />
            )}
          </button>

          {/* Video Toggle Button */}
          <button
            className={`p-2 md:p-3 rounded-full transition-colors transform hover:scale-110 active:scale-95 ${
              callState.isVideoOff
                ? "bg-gray-600 text-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            onClick={toggleVideo}
            disabled={!callState.mediaReady}
            aria-label={
              callState.isVideoOff ? "Turn Video On" : "Turn Video Off"
            }
          >
            {callState.isVideoOff ? (
              <MdVideocamOff className="h-5 w-5" />
            ) : (
              <MdVideocam className="h-5 w-5" />
            )}
          </button>

          {/* Call Action Buttons */}
          {callState.isIncomingCall ? (
            <>
              {/* Accept Call Button */}
              <button
                className="bg-green-500 text-white p-2 md:p-3 rounded-full hover:bg-green-600 transition-colors transform hover:scale-110 active:scale-95"
                onClick={acceptVideoCall}
                disabled={!callState.mediaReady}
                aria-label="Accept Call"
              >
                <MdCall className="h-5 w-5" />
              </button>
              {/* Reject Call Button */}
              <button
                className="bg-red-500 text-white p-2 md:p-3 rounded-full hover:bg-red-600 transition-colors transform hover:scale-110 active:scale-95"
                onClick={rejectCall}
                aria-label="Reject Call"
              >
                <MdCallEnd className="h-5 w-5" />
              </button>
            </>
          ) : (
            /* Start Call Button */
            <button
              className="bg-green-500 text-white p-2 md:p-3 rounded-full hover:bg-green-600 transition-colors transform hover:scale-110 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
              onClick={startVideoCall}
              disabled={callState.isCalling || !callState.mediaReady}
              aria-label="Start Call"
            >
              <MdCall className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        @keyframes phoneRing {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(-10deg); }
          20% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          40% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        
        .animate-phone-ring {
          animation: phoneRing 1.5s infinite ease-in-out;
          display: inline-block;
          transform-origin: 50% 50%;
        }
      `}</style>
    </div>
  );
};

export default VideoCallModal;