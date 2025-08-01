import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
//Create Express App and HTTP Server
const app=express();
const server=http.createServer(app);
//Middleware Setup
app.use(express.json({limit: "4mb"}));
app.use(cors());
//Routes Setup
app.use("/api/status",(req,res)=>res.send("Server is running"));
app.use("/api/auth",userRouter);
//Connect To MONGODB
await connectDB();
const PORT= process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Sever is running on PORT:"+PORT));