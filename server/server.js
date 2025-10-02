import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express App and HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io Server
export const io = new Server(server, {
  cors: { origin: "*" },
});

// Store Online Users
export const userSocketMap = {}; // {userId: socketId}

// Socket.io Connection Handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit all online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ---------------- Video Call Signaling ----------------
  // Offer from caller
  socket.on("offer", ({ to, offer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("offer", { offer, from: userId });
    }
  });

  // Answer from callee
  socket.on("answer", ({ to, answer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("answer", { answer });
    }
  });

  // ICE candidates
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  // Handle User Disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware Setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes Setup
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect To MongoDB
await connectDB();

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));

// Exporting server for Vercel
export default server;
