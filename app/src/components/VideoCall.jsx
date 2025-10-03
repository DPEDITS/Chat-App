import { useContext } from "react";
import { VideoCallContext } from "../../context/VideoCallContext";

const VideoCall = ({ endCall }) => {
  const { myVideo, userVideo, receivingCall, callAccepted, callerSignal, answerCall } =
    useContext(VideoCallContext);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="flex gap-3">
        <video ref={myVideo} autoPlay muted className="w-64 h-48 bg-gray-800 rounded" />
        {callAccepted && <video ref={userVideo} autoPlay className="w-64 h-48 bg-gray-800 rounded" />}
      </div>

      {receivingCall && !callAccepted && (
        <button
          onClick={() => answerCall(callerSignal)}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Answer Call
        </button>
      )}

      <button onClick={endCall} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
        End Call
      </button>
    </div>
  );
};

export default VideoCall;
