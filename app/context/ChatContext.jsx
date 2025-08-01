import { createContext } from "react";

export const ChatContext = createContext();
export const ChatProvider=({children})=>{
    const[messages,setMessages]=useState([]);
    const[users,setUsers]=useState([]);
    const[selectedUser,setSelectedUser]=useState(null);
    const value={

    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}