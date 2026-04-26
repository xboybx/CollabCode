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
import { MessageSquare, X, Send, Sparkles, Terminal, Code2, Copy, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

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

// Custom Code component for react-markdown with proper typing for v10
const CodeBlock = ({ node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        const text = String(children).replace(/\n$/, '');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return match ? (
        <div className="relative my-4 group max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e]/50 shadow-2xl">
            {/* Language Tag & Copy Button */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language}</span>
                </div>
                <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-green-500" />
                            <span className="text-[10px] font-medium text-green-500">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span className="text-[10px] font-medium">Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '1.25rem',
                        fontSize: '0.875rem',
                        background: 'transparent',
                        lineHeight: '1.6',
                    }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        </div>
    ) : (
        <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[0.8em] break-all border border-white/5" {...props}>
            {children}
        </code>
    );
};

export default function AIChat({ aiMessages = [], isThinking = false }: AIChatProps) {
    const { data: session } = useSession();
    const userName = session?.user?.name || "Developer";


    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-transparent h-full">
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
                    <div key={idx} className={`flex flex-col gap-2 ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 mr-1">
                            {isMe ? "You" : msg.senderName}
                        </span>
                        <div className={`px-4 py-3 text-[14px] leading-relaxed backdrop-blur-md shadow-lg max-w-full overflow-hidden break-words transition-all duration-300 ${isMe ? 'bg-primary/30 border border-primary/40 text-blue-50 rounded-2xl rounded-tr-sm shadow-[0_4px_20px_rgba(99,102,241,0.2)]' : 'bg-white/10 border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm'}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: CodeBlock,
                                    p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
                                    ul: ({children}) => <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>,
                                    li: ({children}) => <li>{children}</li>,
                                    h1: ({children}) => <h1 className="text-lg font-bold mb-3 border-b border-white/10 pb-1">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-sm font-bold mb-1 uppercase tracking-wider text-gray-400">{children}</h3>,
                                    blockquote: ({children}) => <blockquote className="border-l-4 border-primary/50 pl-4 italic my-3 text-gray-400">{children}</blockquote>,
                                    a: ({children, href}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">{children}</a>,
                                    table: ({children}) => (
                                        <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                                            <table className="w-full text-left text-sm border-collapse bg-white/5">
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    th: ({children}) => <th className="p-2 border border-white/10 bg-white/10 font-bold">{children}</th>,
                                    td: ({children}) => <td className="p-2 border border-white/10">{children}</td>,
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