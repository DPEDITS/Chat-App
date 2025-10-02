import { createContext, useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import Peer from "peerjs";
import { io } from "socket.io-client";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { authUser } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [inCall, setInCall] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const currentCallRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [userPeerMap, setUserPeerMap] = useState({});

  // ------------------- Socket Init -------------------
  useEffect(() => {
    if (!authUser) return;

    const newSocket = io("https://chat-app-nmyd.onrender.com", {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("updatePeerIds", (map) => setUserPeerMap(map));

    return () => {
      newSocket.disconnect();
    };
  }, [authUser]);

  // ------------------- PeerJS Init -------------------
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
          host: "chat-app-nmyd.onrender.com",
          port: 443,
          path: "/peerjs", // ✅ same as backend
          secure: true,
        });

        peerRef.current = peer;

        peer.on("open", (id) => {
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
        toast.error("Cannot access camera/mic");
      }
    };

    initPeer();

    socket.on("callEnded", () => endCall());

    return () => {
      socket.off("callEnded");
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [authUser, socket]);

  // ------------------- Video Call -------------------
  const startCall = async () => {
    if (!selectedUser) return toast.error("Select a user to call");

    const peerId = userPeerMap[selectedUser._id];
    if (!peerId) return toast.error("User is not ready for call");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }

      const call = peerRef.current.call(peerId, stream);
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

    if (localVideoRef.current?.srcObject)
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    if (remoteVideoRef.current?.srcObject)
      remoteVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
  };

  const value = {
    messages,
    users,
    selectedUser,
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
