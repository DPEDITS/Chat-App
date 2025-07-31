import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
//Create Express App and HTTP Server
const app=express();
const server=http.createServer(app);
//Middleware Setup
app.use(express.json({limit: "4mb"}));
app.use(cors());
app.use("/api/status",(req,res)=>res.send("Server is running"));
const PORT= process.env.PORT || 5000;
server.listen(PORT,()=>console.log("Sever is running on PORT:"+PORT));