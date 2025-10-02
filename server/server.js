import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";

// ------------------- Express + HTTP -------------------
const app = express();
const server = http.createServer(app);

// ------------------- Middleware -------------------
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "4mb" }));

// ------------------- Routes -------------------
app.use("/api/status", (req, res) => res.send("Server running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ------------------- MongoDB -------------------
await connectDB();

// ------------------- Socket.io -------------------
export const io = new Server(server, {
  cors: { origin: "*", credentials: true },
});

export const userSocketMap = {}; // userId -> socketId
export const userPeerMap = {};   // userId -> peerId

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Update peerId from client
  socket.on("updatePeerId", ({ userId, peerId }) => {
    userPeerMap[userId] = peerId;
    io.emit("updatePeerIds", userPeerMap);
  });

  // Handle call initiation
  socket.on("callUser", ({ to, fromPeerId }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) io.to(targetSocketId).emit("incomingCall", { fromPeerId });
  });

  // Handle call end
  socket.on("callEnded", ({ to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) io.to(targetSocketId).emit("callEnded");
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    delete userPeerMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ------------------- PeerJS -------------------
const peerServer = ExpressPeerServer(server, {
  path: "/", // make frontend path "/" to prevent double /peerjs
  debug: true,
});

app.use("/peerjs", peerServer);

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));

export default server;
