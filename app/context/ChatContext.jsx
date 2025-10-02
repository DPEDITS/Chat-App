import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import Peer from "peerjs";
import { userPeerMap } from "../server"; // if needed for user-peer mapping

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

  const [peerId, setPeerId] = useState(null);

  // ------------------- Users & Messages -------------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) setUsers(data.users);
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
    if (!selectedUser) return toast.error("Select a user first");
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) setMessages((prev) => [...prev, data.newMessage]);
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
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }

        const peer = new Peer(authUser._id, {
          host: "chat-app-nmyd.onrender.com", // your backend domain
          port: 443,
          path: "/peerjs",
          secure: true,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });

        peerRef.current = peer;

        peer.on("open", (id) => {
          setPeerId(id);
          socket.emit("updatePeerId", { userId: authUser._id, peerId: id });
        });

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
        toast.error("Cannot access camera/microphone");
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
    if (selectedUser) socket.emit("callEnded", { to: selectedUser._id });
    if (currentCallRef.current) currentCallRef.current.close();
    currentCallRef.current = null;

    [localVideoRef, remoteVideoRef].forEach(ref => {
      if (ref.current?.srcObject)
        ref.current.srcObject.getTracks().forEach(track => track.stop());
    });
  };

  // ------------------- Update users with peerIds -------------------
  useEffect(() => {
    const updatedUsers = users.map(u => ({
      ...u,
      peerId: u._id ? userPeerMap[u._id] || null : null,
    }));
    setUsers(updatedUsers);
  }, [users, socket]);

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
