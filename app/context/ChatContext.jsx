import React, { createContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";

export const ChatContext = createContext();

export const ChatProvider = ({ children, authUser }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [peerMap, setPeerMap] = useState({});
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();

  useEffect(() => {
    // ------------------- Socket.io -------------------
    socketRef.current = io("https://chat-app-nmyd.onrender.com", {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });

    socketRef.current.on("getOnlineUsers", setOnlineUsers);
    socketRef.current.on("updatePeerIds", setPeerMap);

    // ------------------- PeerJS -------------------
    peerRef.current = new Peer(authUser._id, {
      host: "chat-app-nmyd.onrender.com",
      port: 443,
      path: "/",
      secure: true,
    });

    peerRef.current.on("open", (id) => {
      socketRef.current.emit("updatePeerId", { userId: authUser._id, peerId: id });
    });

    peerRef.current.on("call", async (call) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
        call.answer(stream);
        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
          setRemoteStream(remoteStream);
        });
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    });

    return () => {
      socketRef.current.disconnect();
      peerRef.current.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const callUser = async (userId) => {
    const peerId = peerMap[userId];
    if (!peerId) return alert("User not ready for call");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play();

      const call = peerRef.current.call(peerId, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play();
        setRemoteStream(remoteStream);
      });

      call.on("close", () => {
        if (remoteVideoRef.current.srcObject)
          remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        setRemoteStream(null);
      });
    } catch (err) {
      console.error("Error calling user:", err);
    }
  };

  const endCall = (userId) => {
    socketRef.current.emit("callEnded", { to: userId });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    setRemoteStream(null);
  };

  return (
    <ChatContext.Provider
      value={{
        onlineUsers,
        peerMap,
        callUser,
        endCall,
        localVideoRef,
        remoteVideoRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
