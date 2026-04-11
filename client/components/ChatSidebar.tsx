/**
 * ChatSidebar Component
 * 
 * Manages the state for Room and AI chats.
 * Recent Updates:
 * - Added `isAiThinking` state to track AI response status.
 * - Integrated thinking loader state into the AI chat submission flow.
 */
"use client";

import React, { act, useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import RoomChat from "./RoomChat";
import AIChat from "./AIChat";
import { Socket } from "socket.io-client";

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
}

interface SideChatPanelProps {
  chatWidth: number;
  startResizing: (e: React.MouseEvent) => void;
  onClose: () => void;
  socket: Socket | null; // Use the imported Socket type, allow null
  roomId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>; // Correct type for set state
  isOpen: boolean;
}




const ChatSidebar = ({ chatWidth, startResizing, onClose, socket, roomId, messages, setMessages, isOpen }: SideChatPanelProps) => {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Developer";
  const [activeTab, setActiveTab] = useState<"room" | "ai">("room");
  const [currentText, setCurrentText] = useState("");
  const [aiCurrentText, setAICurrentText] = useState("");
  const [aiTabmessages, setAiTabMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);



  const sendMessage = () => {
    if (!currentText.trim() || !socket) return;

    // Build the message object
    const newMsg: ChatMessage = {
      senderId: socket.id, // We can be sure socket is not null here because of the check above
      senderName: userName,
      message: currentText,
    };

    // 1. Add it to our own screen immediately
    setMessages((prev) => [...prev, newMsg]);

    // 2. Scream it down the pipe to the backend!
    socket.emit("send-chat-message", { roomId, message: currentText, senderName: userName });

    // Clear the input
    setCurrentText("");
  };


  const handleAiChatSubmit = async () => {
    if (!aiCurrentText.trim() || !socket) return;


    //build user message object to add to the AI Chat tab immediately
    const newMsg: ChatMessage = {
      senderId: socket?.id || 'user',
      senderName: userName,
      message: aiCurrentText,
    };

    //push the user message to the AIMessages Array
    setAiTabMessages((prev) => [...prev, newMsg]);
    const messageToSend = aiCurrentText;
    // Clear the input
    setAICurrentText("");
    setIsAiThinking(true);

    try {

      const response = await fetch("/api/aiResponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      })

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('AI Response API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        throw new Error(`AI response API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received AI response:", data);

      //build AI response message object to add to the AI Chat tab immediately
      const aiResponseMsg: ChatMessage = {
        senderId: "ai", // Special ID for AI messages
        senderName: "CodeGPT",
        message: data.response,
      };

      //push the AI response message to the AIMessages Array
      setAiTabMessages((prev) => [...prev, aiResponseMsg]);




    } finally {
      setIsAiThinking(false);
    }

  }

  return (
    <div
      className="h-full flex flex-col bg-[#0b0d19]/60 backdrop-blur-2xl shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.7)] z-20 relative border-l border-white/5 "
      style={{
        width: `${chatWidth}px`,
        marginRight: isOpen ? '0px' : `-${chatWidth}px`,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div onMouseDown={startResizing} className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary z-50 transition-colors" />

      {/* Header */}
      <div className="h-14 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-sm font-bold text-white drop-shadow-md">
          <button className={`flex items-center gap-2 pb-1 transition-colors ${activeTab === 'room' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`} onClick={() => {
            setActiveTab("room")
            console.log("Room Chat Tab Clicked")
          }}>
            <MessageSquare size={16} className="text-primary" />
            <h2>Room Chat</h2>
          </button>
          <br></br>
          <button className={`flex items-center gap-1 pb-1 transition-colors ${activeTab === 'ai' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`} onClick={() => {
            setActiveTab("ai")
            console.log("AI Chat Tab Clicked")
          }}>
            <Sparkles size={16} className="text-primary" />
            <h2>AI Chat</h2>
          </button>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-transparent hover:border-white/10">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "ai" ? (<AIChat aiMessages={aiTabmessages} isThinking={isAiThinking} socket={socket} />) : (<RoomChat setMessages={setMessages} messages={messages} socket={socket} />)}
      </div>



      {/* Input Field */}
      <div className="p-5 bg-black/20 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={activeTab === "ai" ? aiCurrentText : currentText}
            onChange={(e) => { activeTab === "ai" ? setAICurrentText(e.target.value) : setCurrentText(e.target.value) }
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                activeTab === "ai" ? handleAiChatSubmit() : sendMessage();
              }
            }
            }
            placeholder="Message the team..."
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all text-white placeholder-gray-500 shadow-inner"
          />
          <button onClick={activeTab === "ai" ? handleAiChatSubmit : sendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-primary to-indigo-500 hover:brightness-110 rounded-lg text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatSidebar