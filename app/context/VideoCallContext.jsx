import React, { createContext, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

export const VideoCallContext = createContext();

export const VideoCallProvider = ({ children, authUserId }) => {
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const streamRef = useRef(null);

  const socket = useRef();

  const initSocket = () => {
    if (!socket.current) {
      socket.current = io("https://chat-app-nmyd.onrender.com", { query: { userId: authUserId } });

      // Incoming call
      socket.current.on("callUser", ({ from, signal }) => {
        setReceivingCall(true);
        setCallerSignal({ from, signal });
      });

      socket.current.on("callAccepted", (signal) => {
        setCallAccepted(true);
        connectionRef.current.signal(signal);
      });

      socket.current.on("callEnded", () => {
        endCall();
      });
    }
  };

  const startCall = async (userToCall) => {
    initSocket();

    // Ask for camera & mic only when starting the call
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (myVideo.current) myVideo.current.srcObject = stream;

    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.current.emit("callUser", { userToCall, from: authUserId, signalData: data });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) userVideo.current.srcObject = stream;
    });

    connectionRef.current = peer;
  };

  const answerCall = async () => {
    setCallAccepted(true);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    if (myVideo.current) myVideo.current.srcObject = stream;

    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.current.emit("answerCall", { to: callerSignal.from, signal: data });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal.signal);
    connectionRef.current = peer;
  };

  const endCall = () => {
    setCallEnded(true);
    setCallAccepted(false);
    setReceivingCall(false);

    // Stop camera & mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (connectionRef.current) connectionRef.current.destroy();
    connectionRef.current = null;

    // Notify the other user
    if (callerSignal?.from) {
      socket.current.emit("endCall", { to: callerSignal.from });
    }
  };

  return (
    <VideoCallContext.Provider value={{
      myVideo,
      userVideo,
      receivingCall,
      callAccepted,
      startCall,
      answerCall,
      endCall,
      callerSignal
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};
