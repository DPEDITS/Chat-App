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

  // ------------------- Users & Messages -------------------
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
    if (!selectedUser) return;
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) setMessages((prev) => [...prev, data.newMessage]);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ------------------- Video Call -------------------
  useEffect(() => {
    if (!authUser || !socket) return;

    const initPeer = () => {
      const peer = new Peer(authUser._id, {
        host: "chat-app-nmyd.onrender.com",
        port: 443,
        path: "/peerjs",
        secure: true,
      });

      peerRef.current = peer;

      peer.on("open", (id) => {
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
            toast.success("Call connected!");
          });
        } catch {
          toast.error("Unable to access camera or microphone");
        }
      });
    };

    initPeer();

    socket.on("callEnded", () => {
      endCall();
      toast("Call ended by other user");
    });

    socket.on("updatePeerIds", (peerMap) => {
      setUsers((prev) => prev.map((u) => ({ ...u, peerId: peerMap[u._id] || null })));
    });

    return () => {
      socket.off("callEnded");
      socket.off("updatePeerIds");
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [authUser, socket]);

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
    } catch {
      toast.error("Failed to start call");
    }
  };

  const endCall = () => {
    setInCall(false);
    if (selectedUser) socket.emit("callEnded", { to: selectedUser._id });
    if (currentCallRef.current) currentCallRef.current.close();
    currentCallRef.current = null;

    [localVideoRef.current, remoteVideoRef.current].forEach((vid) => {
      if (vid?.srcObject) vid.srcObject.getTracks().forEach((t) => t.stop());
    });
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
