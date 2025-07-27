import React from 'react'
import assets, { imagesDummyData } from '../assets/assets'

const RightSidebar = ({ selectedUser }) => {
  return selectedUser && (
<div
  className={`relative bg-[#8185b2]/10 text-white w-full h-full overflow-y-auto pb-20 ${
    selectedUser ? "max-md:hidden" : ""
  }`}
  >
    <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
      <img
        src={selectedUser?.profilePic || assets.avatar_icon}
        alt="avatar"
        className='w-20 aspect-[1/1] rounded-full'
      />
      <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
        <span className='w-2 h-2 rounded-full bg-green-500'></span>
        {selectedUser.fullName}
      </h1>
      <p className='px-10 mx-auto'>{selectedUser.bio}</p>
    </div>
  
    <hr className='border-[#ffffff50] my-4' />
  
    <div className='px-4 flex-1 overflow-y-auto'>
      <p className='text-sm text-gray-300 mb-2'>Media</p>
      <div className='max-h-[300px] overflow-y-auto grid grid-cols-2 gap-3'>
        {imagesDummyData.map((url, index) => (
          <div key={index} onClick={() => window.open(url)} className='cursor-pointer'>
            <img src={url} alt={`media-${index}`} className='rounded-md w-full' />
          </div>
        ))}
      </div>
    </div>
    <button className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer'>
      Logout
    </button>
  </div>
  )
}

export default RightSidebar
