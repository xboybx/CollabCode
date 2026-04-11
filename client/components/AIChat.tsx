/**
 * AIChat Component
 * 
 * Displays the AI conversation history and thinking state.
 * Recent Updates:
 * - Added a minimal "black and white" gradient thinking loader.
 * - Implemented an introductory welcome card for empty chat states.
 */
"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Terminal, Code2 } from "lucide-react";
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
    socket?: Socket | null;
    isThinking?: boolean;
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

export default function AIChat({ aiMessages = [], isThinking = false }: AIChatProps) {
    const { data: session } = useSession();
    const userName = session?.user?.name || "Developer";


    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-transparent h-full">
            {aiMessages.length === 0 && !isThinking && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-indigo-500/50 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
                            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            AI Chat Assistant
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-[240px] mx-auto">
                            Ask anything about the code you want. You can generate snippets and paste them directly into your editor.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl text-left">
                            <Code2 size={16} className="text-primary" />
                            <span className="text-[12px] text-gray-300 font-medium">Generate code snippets</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl text-left">
                            <Terminal size={16} className="text-primary" />
                            <span className="text-[12px] text-gray-300 font-medium">Debug and explain logic</span>
                        </div>
                    </div>
                </div>
            )}

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
            
            {isThinking && (
                <div className="flex flex-col gap-1.5 items-start animate-in fade-in slide-in-from-left-2 duration-500 mt-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 mr-1">
                        CodeGPT
                    </span>
                    <div className="ml-1">
                        <span className="text-sm font-semibold bg-gradient-to-r from-white via-gray-300 to-black bg-clip-text text-transparent animate-pulse tracking-tight italic">
                            Thinking...
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}