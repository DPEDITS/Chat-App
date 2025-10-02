import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
// server.js (PeerJS section)
import { ExpressPeerServer } from "peer";


// ------------------- Express & HTTP -------------------
const app = express();
const server = http.createServer(app);

// ------------------- Middleware -------------------
const FRONTEND_URL = process.env.FRONTEND_URL || "*"; // e.g., https://quick-chat-nolx.onrender.com
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "4mb" }));

// ------------------- Routes -------------------
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ------------------- MongoDB -------------------
await connectDB();

// ------------------- Socket.io -------------------
// server.js

export const io = new Server(server, {
    cors: {
      origin: "https://quick-chat-nolx.onrender.com", // e.g., https://quick-chat-nolx.onrender.com
      credentials: true,
    },
  });
  
  export const userSocketMap = {}; // userId -> socketId
  export const userPeerMap = {};   // userId -> peerId
  
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected:", userId);
  
    if (userId) userSocketMap[userId] = socket.id;
  
    // ------------------- ADD THIS -------------------
    socket.on("updatePeerId", ({ userId, peerId }) => {
      userPeerMap[userId] = peerId;
      // Send updated peer map to all clients
      io.emit("updatePeerIds", userPeerMap);
    });
    // ------------------------------------------------
  
    // Broadcast online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  
    // Handle calls
    socket.on("callUser", ({ to, fromPeerId }) => {
      const targetSocketId = userSocketMap[to];
      if (targetSocketId) {
        io.to(targetSocketId).emit("incomingCall", { fromPeerId });
      }
    });
  
    socket.on("callEnded", ({ to }) => {
      const targetSocketId = userSocketMap[to];
      if (targetSocketId) io.to(targetSocketId).emit("callEnded");
    });
  
    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      delete userSocketMap[userId];
      delete userPeerMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
  

// ------------------- PeerJS -------------------

const peerServer = ExpressPeerServer(server, {
  path: "/peerjs",
  debug: true,
});

app.use("/peerjs", peerServer);


// ------------------- Start server -------------------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));

export default server;
