import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import Peer from "peerjs";
import { userPeerMap } from "../server"; // optional if you want live peerIds

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
    } catch (error) {
      toast.error(error.message);
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
          host: "quick-chat-nolx.onrender.com",
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
          socket.emit("updatePeerId", { userId: authUser._id, peerId: id });
        });

        peer.on("call", async (call) => {
          call.answer(stream);
          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            currentCallRef.current = call;
            setInCall(true);
            toast.success("Call connected!");
          });
        });
      } catch (err) {
        toast.error("Camera/microphone access failed");
      }
    };

    initPeer();

    socket.on("callEnded", () => endCall());
    return () => {
      socket.off("callEnded");
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [authUser, socket]);

  // ------------------- Start / End Call -------------------
  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user");
    if (!peerRef.current) return toast.error("Peer not ready");
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

      call.on("close", endCall);
    } catch (err) {
      toast.error("Call failed");
    }
  };

  const endCall = () => {
    setInCall(false);
    if (selectedUser) socket.emit("callEnded", { to: selectedUser._id });
    if (currentCallRef.current) currentCallRef.current.close();
    currentCallRef.current = null;
    if (localVideoRef.current?.srcObject)
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
  };

  // ------------------- Update Users with PeerID -------------------
  useEffect(() => {
    if (!users.length) return;
    const updatedUsers = users.map((u) => ({
      ...u,
      peerId: u._id in userPeerMap ? userPeerMap[u._id] : null,
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
    startCall,
    endCall,
    inCall,
    localVideoRef,
    remoteVideoRef,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
