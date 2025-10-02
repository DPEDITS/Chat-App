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
  const [unseenMessages, setUnseenMessages] = useState({});
  const [inCall, setInCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const currentCallRef = useRef(null);

  // ------------------- USER & MESSAGES -------------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) setMessages(data.messages);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) setMessages((prev) => [...prev, data.newMessage]);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- VIDEO CALL -------------------
  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user to call");
    setInCall(true);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    // Initialize Peer with STUN/TURN config
    const peer = new Peer(authUser._id, {
      host: window.location.hostname,
      port: window.location.port,
      path: "/peerjs",
      secure: window.location.protocol === "https:",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          // Add TURN server if needed for strict NAT/firewall
          // { urls: "turn:your-turn-server-ip:3478", username: "user", credential: "pass" }
        ],
      },
    });
    peerRef.current = peer;

    // Listen for incoming calls
    peer.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        currentCallRef.current = call;
      });
    });

    // Emit call to selected user
    peer.on("open", (id) => {
      socket.emit("callUser", { to: selectedUser._id, fromPeerId: id });
    });

    // Incoming call from other user
    socket.on("incomingCall", ({ from }) => {
      const call = peer.call(from, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
        currentCallRef.current = call;
      });
    });

    // Call ended by other user
    socket.on("callEnded", () => {
      endCall();
      toast("Call ended by other user");
    });
  };

  const endCall = () => {
    setInCall(false);

    if (selectedUser) socket.emit("callEnded", { to: selectedUser._id });

    if (currentCallRef.current) currentCallRef.current.close();
    currentCallRef.current = null;

    if (peerRef.current) peerRef.current.destroy();
    peerRef.current = null;

    if (localVideoRef.current?.srcObject)
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
  };

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    startCall,
    endCall,
    inCall,
    localVideoRef,
    remoteVideoRef,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
