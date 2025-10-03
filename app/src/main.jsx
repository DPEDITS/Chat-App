import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../context/AuthContext.jsx';
import { ChatProvider } from '../context/ChatContext.jsx';
import { VideoCallProvider } from '../context/VideoCallContext.jsx';
import { useContext } from 'react';

// Polyfill for global (needed for simple-peer)
if (typeof global === "undefined") {
  window.global = window;
}

// Correct wrapper using a component
const VideoCallWrapper = ({ children }) => {
  const { authUser } = useContext(AuthContext);

  if (!authUser) return children;

  return (
    <VideoCallProvider authUserId={authUser._id}>
      {children}
    </VideoCallProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ChatProvider>
        <VideoCallWrapper>
          <App />
        </VideoCallWrapper>
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
);
