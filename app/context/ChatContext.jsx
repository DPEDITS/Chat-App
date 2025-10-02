import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import Peer from "peerjs";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket, axios, authUser } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inCall, setInCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const currentCallRef = useRef(null);

  const [peerId, setPeerId] = useState(null);

  // ------------------- Users -------------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) setUsers(data.users);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Update peerIds from server
  useEffect(() => {
    if (!socket) return;
    socket.on("updatePeerIds", (peerMap) => {
      setUsers((prev) =>
        prev.map((u) => ({ ...u, peerId: peerMap[u._id] || null }))
      );
    });
    return () => socket.off("updatePeerIds");
  }, [socket]);

  // ------------------- Initialize Peer (without auto camera) -------------------
  useEffect(() => {
    if (!authUser) return;
    const peer = new Peer(authUser._id, {
      host: "chat-app-nmyd.onrender.com",
      port: 443,
      path: "/peerjs",
      secure: true,
    });
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      socket.emit("updatePeerId", { userId: authUser._id, peerId: id });
    });

    peer.on("call", async (call) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        call.answer(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }

        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          currentCallRef.current = call;
          setInCall(true);
        });
      } catch (err) {
        toast.error("Camera/mic access denied");
      }
    });

    return () => peer.destroy();
  }, [authUser, socket]);

  // ------------------- Start Call -------------------
  const startCall = async () => {
    if (!selectedUser?.peerId) return toast.error("User is not ready for call");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }

      const call = peerRef.current.call(selectedUser.peerId, stream);
      call.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        currentCallRef.current = call;
        setInCall(true);
      });

      call.on("close", () => endCall());
    } catch (err) {
      toast.error("Failed to start call");
    }
  };

  const endCall = () => {
    setInCall(false);
    if (selectedUser) socket.emit("callEnded", { to: selectedUser._id });
    if (currentCallRef.current) currentCallRef.current.close();
    if (localVideoRef.current?.srcObject) localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    if (remoteVideoRef.current?.srcObject) remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    currentCallRef.current = null;
  };

  return (
    <ChatContext.Provider value={{
      messages,
      users,
      selectedUser,
      setSelectedUser,
      startCall,
      endCall,
      inCall,
      localVideoRef,
      remoteVideoRef,
      getUsers,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
