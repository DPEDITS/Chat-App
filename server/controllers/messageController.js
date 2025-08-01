import Message from "../models/Message.js";
import User from "../models/User.js";

//Get all users except login user
export const getUsersForSidebar=async(req,res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers=await User.find({_id:{$ne:userId}}).select("-password");
        //Count no of messages not seen
        const unseenMessages={}
        const promises=filteredUsers.map(async(user)=>{
            const messages=await Message.find({senderId:user._id, recieverId:userId, seen:false});
            if(messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true, users:filteredUsers, unseenMessages});
    } catch (error) {
        console.log("Error in getUsersForSidebar:", error.message);
        res.json({success:false, message:error.message});
        
    }
}

//Get all messages for the selected user
