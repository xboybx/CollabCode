"use client";

import React, { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useSession } from "next-auth/react";

interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
}

interface RoomChatProps {
    chatWidth: number;
    startResizing: (e: React.MouseEvent) => void;
    onClose: () => void;
    socket: any;     // Accepting the TCP Pipe!
    roomId: string;  // Accepting the Room Bucket!
    messages: ChatMessage[];
    setMessages: any;
    isOpen: boolean; // Controls the slide animation
}

export default function RoomChat({ socket, messages }: RoomChatProps) {
    const { data: session } = useSession();
    const userName = session?.user?.name || "Developer";
    console.log("Rendering RoomChat with messages:", messages);
    console.log("Current socket ID:", socket?.id);


    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-transparent">
            {messages.map((msg, idx) => {
                const isMe = msg.senderId === socket?.id;
                return (
                    <div key={idx} className={`flex flex-col gap-1.5 ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 mr-1">
                            {isMe ? "You" : msg.senderName}
                        </span>
                        <div className={`px-4 py-2.5 text-sm backdrop-blur-md shadow-sm ${isMe ? 'bg-primary/30 border border-primary/40 text-blue-50 rounded-2xl rounded-tr-sm shadow-[0_4px_20px_rgba(99,102,241,0.25)]' : 'bg-white/10 border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm'}`}>
                            {msg.message}
                        </div>
                    </div>
                );
            })}
        </div>
    )

}
