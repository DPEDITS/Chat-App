import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// -------------------- EXPRESS APP & HTTP SERVER --------------------
const app = express();
const server = http.createServer(app);

// -------------------- SOCKET.IO SETUP --------------------
export const io = new Server(server, {
  cors: { origin: "*" }, // Allow all origins (adjust for production)
});

// Store online users: { userId: socketId }
export const userSocketMap = {};

// -------------------- SOCKET.IO CONNECTION --------------------
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ----- VIDEO CALL SIGNALING -----
  socket.on("offer", ({ to, offer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("offer", { offer, from: userId });
    }
  });

  socket.on("answer", ({ to, answer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// -------------------- MIDDLEWARE --------------------
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// -------------------- ROUTES --------------------
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// -------------------- DATABASE CONNECTION --------------------
await connectDB();

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));

// -------------------- EXPORT FOR DEPLOY --------------------
export default server;
