import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { MdVideoCall } from "react-icons/md";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    startCall,
    endCall,
    inCall,
    localVideoRef,
    remoteVideoRef,
  } = useContext(ChatContext);

  const { authUser } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (selectedUser?._id) getMessages(selectedUser._id);
  }, [selectedUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) return toast.error("Select an image file");
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Show placeholder if no user is selected or authUser not loaded
  if (!authUser?._id || !selectedUser?._id)
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} alt="" className="max-w-16" />
        <p className="text-lg text-white font-medium">Chat Anytime, Anywhere</p>
      </div>
    );

  return (
    <div className="h-full relative backdrop-blur-lg overflow-scroll">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser?.fullName}
          {selectedUser?.peerId && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
        <MdVideoCall
          className="text-white text-2xl cursor-pointer max-md:hidden"
          onClick={startCall}
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-end gap-2 ${
              msg.senderId === authUser?._id ? "justify-end" : "flex-row-reverse"
            }`}
          >
            {msg.image ? (
              <img
                src={msg.image}
                alt=""
                className="max-w-[230px] border border-gray-700 rounded-lg mb-8"
              />
            ) : (
              <p
                className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                  msg.senderId === authUser?._id ? "rounded-br-none" : "rounded-bl-none"
                }`}
              >
                {msg.text}
              </p>
            )}
            <div className="text-center text-xs">
              <img
                src={
                  msg.senderId === authUser?._id
                    ? authUser?.profilePic || assets.avatar_icon
                    : selectedUser?.profilePic || assets.avatar_icon
                }
                alt=""
                className="w-7 rounded-full"
              />
              <p className="text-gray-400">{formatMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      {/* Footer */}
      <form
        onSubmit={handleSendMessage}
        className="absolute bottom-2 left-0 right-0 px-3 flex gap-2 items-center"
      >
        <input
          type="file"
          id="send-image"
          className="hidden"
          onChange={handleSendImage}
        />
        <label htmlFor="send-image">
          <img src={assets.gallery_icon} alt="" className="cursor-pointer max-w-7" />
        </label>
        <input
          type="text"
          placeholder="Type a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded-lg bg-white/10 text-white outline-none"
        />
        <button type="submit">
          <img src={assets.send_icon} alt="" className="max-w-7" />
        </button>
      </form>

      {/* Video Call */}
      {inCall && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/70 flex flex-col items-center justify-center gap-3">
          {localVideoRef.current && <video ref={localVideoRef} autoPlay muted className="w-40 rounded-md" />}
          {remoteVideoRef.current && <video ref={remoteVideoRef} autoPlay className="w-80 rounded-md" />}
          <button
            className="p-2 bg-red-600 rounded-md text-white"
            onClick={endCall}
          >
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
