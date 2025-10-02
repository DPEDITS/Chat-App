import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import Peer from "peerjs";
import { io } from "socket.io-client";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { authUser, axios } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [inCall, setInCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const currentCallRef = useRef(null);
  const socketRef = useRef(null);

  // ------------------- Initialize Socket -------------------
  useEffect(() => {
    if (!authUser) return;

    const socket = io("https://chat-app-nmyd.onrender.com", {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected:", socket.id));

    socket.on("updatePeerIds", (peerMap) => {
      setUsers((prev) =>
        prev.map((u) => ({ ...u, peerId: peerMap[u._id] || null }))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [authUser]);

  // ------------------- Users & Messages -------------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
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
      if (!selectedUser) return toast.error("Select a user first");
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) setMessages((prev) => [...prev, data.newMessage]);
      else toast.error(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ------------------- PeerJS -------------------
  useEffect(() => {
    if (!authUser || !socketRef.current) return;

    const peer = new Peer(authUser._id, {
      host: "chat-app-nmyd.onrender.com",
      port: 443,
      path: "/", // avoid double /peerjs
      secure: true,
    });
    peerRef.current = peer;

    peer.on("open", (id) => {
      socketRef.current.emit("updatePeerId", { userId: authUser._id, peerId: id });
    });

    peer.on("call", async (call) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }

        call.answer(stream);
        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          currentCallRef.current = call;
          setInCall(true);
          toast.success("Call connected!");
        });
      } catch (err) {
        toast.error("Cannot access camera/mic");
      }
    });

    socketRef.current.on("callEnded", () => {
      endCall();
      toast("Call ended by other user");
    });

    return () => {
      peer.destroy();
      socketRef.current.off("callEnded");
    };
  }, [authUser]);

  // ------------------- Start / End Call -------------------
  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user to call");
    if (!peerRef.current) return toast.error("Peer not initialized");
    if (!selectedUser.peerId) return toast.error("User is not ready for call");

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
    if (selectedUser) socketRef.current.emit("callEnded", { to: selectedUser._id });

    if (currentCallRef.current) currentCallRef.current.close();
    currentCallRef.current = null;

    if (localVideoRef.current?.srcObject)
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
  };

  // ------------------- Context Value -------------------
  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
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
