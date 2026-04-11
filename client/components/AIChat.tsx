"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import { CodeProps } from 'react-markdown/lib/ast-to-react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
}

interface AIChatProps {
    aiMessages: ChatMessage[];
    socket: Socket | null;
}

// Custom Code component for react-markdown with proper typing
const CodeBlock: React.FC<CodeProps> = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
        <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            {...props}
        >
            {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

export default function AIChat({ aiMessages = [] }: AIChatProps) {
    const { data: session } = useSession();
    const userName = session?.user?.name || "Developer";


    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-transparent">
            {aiMessages.map((msg, idx) => {
                const isMe = msg.senderName === userName;
                return (
                    <div key={idx} className={`flex flex-col gap-1.5 ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 mr-1">
                            {isMe ? "You" : msg.senderName}
                        </span>
                        <div className={`px-4 py-2.5 text-sm backdrop-blur-md shadow-sm ${isMe ? 'bg-primary/30 border border-primary/40 text-blue-50 rounded-2xl rounded-tr-sm shadow-[0_4px_20px_rgba(99,102,241,0.25)]' : 'bg-white/10 border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm'}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: CodeBlock, // Use the typed component
                                }}
                            >
                                {msg.message}
                            </ReactMarkdown>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}