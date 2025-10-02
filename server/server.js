import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";

// ------------------ EXPRESS APP ------------------
const app = express();
const server = http.createServer(app);

// ------------------ SOCKET.IO ------------------
export const io = new Server(server, {
  cors: { origin: "*" },
});

// ------------------ PEERJS SERVER ------------------
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/peerjs",
});
app.use("/peerjs", peerServer);

// ------------------ ONLINE USERS MAP ------------------
export const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Chat signaling handled by your front-end PeerJS, no need for manual ICE/offer/answer here
  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ------------------ MIDDLEWARE ------------------
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ------------------ ROUTES ------------------
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ------------------ DATABASE ------------------
await connectDB();

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));

export default server;
