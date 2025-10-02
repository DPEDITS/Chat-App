import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";

// Express app & HTTP server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// MongoDB connection
await connectDB();

// Socket.io setup
export const io = new Server(server, {
  cors: { origin: "*" }
});
export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);
  if (userId) userSocketMap[userId] = socket.id;

  // Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Call signaling
  socket.on("callUser", ({ to, fromPeerId }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incomingCall", { from: fromPeerId });
    }
  });

  socket.on("callEnded", ({ to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) io.to(targetSocketId).emit("callEnded");
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// PeerJS server
const peerServer = ExpressPeerServer(server, { path: "/peerjs", debug: true });
app.use("/peerjs", peerServer);

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));

export default server;
