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

  // ---------------- CHAT FUNCTIONS ----------------
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

  // ---------------- MESSAGES SUBSCRIPTION ----------------
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: prev[newMessage.senderId] ? prev[newMessage.senderId] + 1 : 1,
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, selectedUser]);

  // ---------------- VIDEO CALL ----------------
  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user to call");
    setInCall(true);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    const peer = new Peer(authUser._id, {
      host: window.location.hostname,
      port: window.location.port,
      path: "/peerjs",
      secure: window.location.protocol === "https:",
    });
    peerRef.current = peer;

    // Answer incoming calls
    peer.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    });

    // Initiate call
    peer.on("open", (id) => {
      socket.emit("callUser", { userId: selectedUser._id, from: id });
    });

    socket.on("callAccepted", ({ from }) => {
      const call = peer.call(from, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    });

    // Listen for call end from other user
    socket.on("callEnded", () => {
      endCall(false);
      toast("Call ended by the other user");
    });
  };

  const endCall = (notifyOther = true) => {
    setInCall(false);

    if (peerRef.current) peerRef.current.destroy();
    peerRef.current = null;

    if (localVideoRef.current?.srcObject)
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    localVideoRef.current.srcObject = null;

    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    remoteVideoRef.current.srcObject = null;

    if (notifyOther && selectedUser) {
      socket.emit("callEnded", { to: selectedUser._id });
    }
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
    // Video Call
    startCall,
    endCall,
    inCall,
    localVideoRef,
    remoteVideoRef,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
