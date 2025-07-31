import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
//Signup a New User
export const signup = async(req,res)=>{
    const {fullName, email, password, bio}= req.body;
    try {
        if(!fullName || !email || !password || !bio){
            return req.json({success:false, message:"All fields are required"});
        }
        const User= await User.findOne({email});
        if(User){
            return res.json({success:false, message:"User already exists"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        const newUser= await User.create({
            fullName,
            email,
            password:hashedPassword,
            bio
        })
        const token= generateToken(newUser._id);
        res.json({success:true, message:"User created successfully", token, userData:newUser});
    } catch (error) {
        console.log("Error in Signup:", error.message);
        res.json({success:false, message:error.message});
    }
}

//Controller to login a user
export const login=async(req,res)=>{
    try {
        const {email,password}=req.body;
        const userData= await User.findOne({email});
        const isPasswordCorrect=await bcrypt.compare(password, userData.password);
        if(!isPasswordCorrect){
            return res.json({success:false, message:"Invalid Credentials"});
        }
        const token= generateToken(userData._id);
        res.json({success:true, message:"Login successful", token, userData});
    } catch (error) {
        console.log("Error in Login:", error.message);
        res.json({success:false, message:error.message});
        
    }
}