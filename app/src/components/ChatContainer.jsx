import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { MdVideoCall } from "react-icons/md";
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const { 
    messages, selectedUser, setSelectedUser, sendMessage, getMessages,
    startCall, endCall, inCall, localVideoRef, remoteVideoRef 
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  useEffect(() => { if (selectedUser) getMessages(selectedUser._id); }, [selectedUser]);
  useEffect(() => { scrollEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return toast.error("Select an image file");
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  return selectedUser ? (
    <div className='h-full relative backdrop-blur-lg overflow-scroll'>
      {/* Header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer' />

        {selectedUser && <MdVideoCall className="text-white text-2xl cursor-pointer max-md:hidden" onClick={startCall}/>}
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>

      {/* Messages */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((message, index) => (
          <div key={index} className={`flex items-end gap-2 ${message.senderId === authUser._id ? 'justify-end' : 'flex-row-reverse'}`}>
            {message.image ? (
              <img src={message.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg mb-8' />
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${message.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                {message.text}
              </p>
            )}
            <div className='text-center text-xs'>
              <img src={message.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
              <p className='text-gray-400'>{formatMessageTime(message.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd} />
      </div>

      {/* Chat Input */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input
            type='text'
            placeholder='Send a message...'
            className='flex-1 text-sm p-3 border-none outline-none text-white placeholder-gray-400'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage(e)}
          />
          <input type="file" id="image" accept='image/png,image/jpeg' hidden onChange={handleSendImage} />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <img src={assets.send_button} alt='' className='w-7 cursor-pointer' onClick={handleSendMessage} />
      </div>

      {/* Video Call */}
      {inCall && (
        <div className="absolute bottom-20 right-5 bg-black p-2 rounded-lg flex gap-2 z-50">
          <video ref={localVideoRef} autoPlay muted className="w-40 h-40 rounded-lg" />
          <video ref={remoteVideoRef} autoPlay className="w-80 h-80 rounded-lg" />
          <button className="bg-red-600 text-white p-2 rounded" onClick={endCall}>End Call</button>
        </div>
      )}
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="" className='max-w-16' />
      <p className='text-lg text-white font-medium'>Chat Anytime, Anywhere</p>
    </div>
  );
};

export default ChatContainer;
