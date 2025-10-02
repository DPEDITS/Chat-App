import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { io } from "socket.io-client";
import Peer from "peerjs";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { authUser, axios } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inCall, setInCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const currentCallRef = useRef(null);

  const socketRef = useRef(null);

  // ------------------- Socket.io -------------------
  useEffect(() => {
    if (!authUser) return;

    const socket = io("https://chat-app-nmyd.onrender.com", {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("updatePeerIds", (peerMap) => {
      console.log("Updated peer map:", peerMap);
    });

    socket.on("incomingCall", async ({ fromPeerId }) => {
      if (!peerRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});

      const call = peerRef.current.call(fromPeerId, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        setInCall(true);
      });
      currentCallRef.current = call;
    });

    socket.on("callEnded", () => endCall());

    return () => socket.disconnect();
  }, [authUser]);

  // ------------------- PeerJS -------------------
  useEffect(() => {
    if (!authUser) return;

    const peer = new Peer(authUser._id, {
      host: "chat-app-nmyd.onrender.com",
      path: "/",
      port: 443,
      secure: true,
    });
    peerRef.current = peer;

    peer.on("open", (id) => {
      socketRef.current.emit("updatePeerId", { userId: authUser._id, peerId: id });
    });

    peer.on("call", async (call) => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});

      call.answer(stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        setInCall(true);
      });
      currentCallRef.current = call;
    });

    return () => {
      peer.destroy();
    };
  }, [authUser]);

  // ------------------- Call Handlers -------------------
  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user to call");
    if (!peerRef.current) return toast.error("Peer not initialized");

    const peerId = selectedUser.peerId;
    if (!peerId) return toast.error("User is not ready for call");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    localVideoRef.current.muted = true;
    localVideoRef.current.play().catch(() => {});

    const call = peerRef.current.call(peerId, stream);
    call.on("stream", (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
      setInCall(true);
    });
    call.on("close", () => endCall());
    currentCallRef.current = call;
  };

  const endCall = () => {
    setInCall(false);
    if (currentCallRef.current) currentCallRef.current.close();
    if (localVideoRef.current?.srcObject)
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    currentCallRef.current = null;
    if (selectedUser) socketRef.current.emit("callEnded", { to: selectedUser._id });
  };

  return (
    <ChatContext.Provider
      value={{
        users,
        selectedUser,
        setSelectedUser,
        messages,
        inCall,
        startCall,
        endCall,
        localVideoRef,
        remoteVideoRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
