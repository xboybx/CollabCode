/**
 * RoomChat Component
 * 
 * Handles real-time messaging between collaborators in a room.
 * Recent Updates:
 * - Added a Collaborative Chat welcome card for new/empty conversations.
 * - Included feature highlights and helpful instructions for users.
 */
"use client";

import React, { useState } from "react";
import { MessageSquare, X, Send, Users, ShieldCheck, Zap } from "lucide-react";
import { useSession } from "next-auth/react";

interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
}

interface RoomChatProps {
    socket: any;
    messages: ChatMessage[];
    setMessages: any;
}

export default function RoomChat({ socket, messages }: RoomChatProps) {
    const { data: session } = useSession();
    const userName = session?.user?.name || "Developer";



    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-transparent h-full">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-indigo-500/50 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                            <Users className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            Collaborative Chat
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-[240px] mx-auto">
                            Chat with your collaborators here in real-time. Share code snippets and brainstorm ideas together!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl text-left">
                            <ShieldCheck size={16} className="text-primary" />
                            <span className="text-[12px] text-gray-300 font-medium">Secure End-to-End</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl text-left">
                            <Zap size={16} className="text-primary" />
                            <span className="text-[12px] text-gray-300 font-medium">Real-time sync</span>
                        </div>
                    </div>
                </div>
            )}

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
