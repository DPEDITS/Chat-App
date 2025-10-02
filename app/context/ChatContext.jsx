import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import Peer from "peerjs";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket, axios, authUser, onlineUsers } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inCall, setInCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const currentCallRef = useRef(null);

  // Update users with peerId
  useEffect(() => {
    const updatedUsers = users.map(u => ({ ...u, peerId: u.peerId || null }));
    setUsers(updatedUsers);
  }, [users, onlineUsers]);

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) setUsers(data.users);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) setMessages(data.messages);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) setMessages(prev => [...prev, data.newMessage]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ------------------- Video Call -------------------
  useEffect(() => {
    if (!authUser || !socket) return;

    const initPeer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = new Peer(authUser._id, {
          host: window.location.hostname,
          port: window.location.protocol === "https:" ? 443 : 80,
          path: "/peerjs",
          secure: window.location.protocol === "https:",
          config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
        });
        peerRef.current = peer;

        peer.on("open", (id) => socket.emit("updatePeerId", { userId: authUser._id, peerId: id }));

        peer.on("call", (call) => {
          call.answer(stream);
          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            currentCallRef.current = call;
            setInCall(true);
            toast.success("Call connected!");
          });
        });
      } catch (err) {
        toast.error("Camera/microphone access denied");
      }
    };

    initPeer();

    socket.on("callEnded", () => {
      endCall();
      toast("Call ended by other user");
    });

    return () => {
      socket.off("callEnded");
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [authUser, socket]);

  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user to call");
    if (!peerRef.current) return toast.error("Peer not initialized");
    if (!selectedUser.peerId) return toast.error("User not ready for call");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

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
    currentCallRef.current = null;

    [localVideoRef, remoteVideoRef].forEach(ref => {
      if (ref.current?.srcObject) ref.current.srcObject.getTracks().forEach(t => t.stop());
    });
  };

  return (
    <ChatContext.Provider value={{
      messages, users, selectedUser, setSelectedUser,
      getUsers, getMessages, sendMessage,
      inCall, startCall, endCall,
      localVideoRef, remoteVideoRef
    }}>
      {children}
    </ChatContext.Provider>
  );
};
