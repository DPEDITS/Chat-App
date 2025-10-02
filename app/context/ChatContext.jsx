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

  const [peerId, setPeerId] = useState(null); // store own peer id

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

    const initPeer = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});

      const peer = new Peer(authUser._id, {
        host: window.location.hostname,
        port: window.location.port,
        path: "/peerjs",
        secure: window.location.protocol === "https:",
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
        console.log("Peer ready with ID:", id);
      });

      // Incoming PeerJS calls
      peer.on("call", async (call) => {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});

        call.answer(localStream);
        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
          currentCallRef.current = call;
          setInCall(true);
          toast.success("Incoming call connected!");
        });
      });
    };

    initPeer();

    // Socket events
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
    if (!selectedUser || !peerRef.current) return toast.error("Select a user to call");

    if (!selectedUser.peerId) return toast.error("User is not ready for call");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    localVideoRef.current.muted = true;
    localVideoRef.current.play().catch(() => {});

    const call = peerRef.current.call(selectedUser.peerId, stream);
    call.on("stream", (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
      currentCallRef.current = call;
      setInCall(true);
    });

    call.on("close", () => endCall());
  };

  const endCall = () => {
    setInCall(false);

    if (selectedUser) socket.emit("callEnded", { to: selectedUser._id });

    if (currentCallRef.current) currentCallRef.current.close();
    currentCallRef.current = null;

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
