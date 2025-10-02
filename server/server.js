import express from "express";
import "dotenv/config";
import cors from "cors";
import http, { get } from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import {Server} from "socket.io";
//Create Express App and HTTP Server
const app=express();
const server=http.createServer(app);
//Initialize Socket.io Server
export const io = new Server(server, {
    cors: {origin: "*"}
});
//Store Online Users
export const userSocketMap={};//{userId:socketId}
//Socket.io Connection Handler
io.on("connection",(socket)=>{
    const userId=socket.handshake.query.userId;
    console.log("User Connected:", userId);
    if(userId) userSocketMap[userId] = socket.id;
    //Emit all online users to all connected Clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    //Handle User Disconnection
    socket.on("disconnect",()=>{console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })

});
//Middleware Setup
app.use(express.json({limit: "4mb"}));
app.use(cors());
//Routes Setup
app.use("/api/status",(req,res)=>res.send("Server is running"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);
//Connect To MONGODB
await connectDB();
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Server is running on PORT:" + PORT));

//Exporting server for vercel
export default server;