"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import React from "react";
import Editor from "@monaco-editor/react";
import { MessageSquarePlus, Video, Play, LogOut, Home, Wand2, Languages, Book, Users, FileCode2, ChevronRight, Menu } from "lucide-react";

import ChatSidebar from "@/components/ChatSidebar";
import VideoBubble from "@/components/VideoBubble";
import * as Y from "yjs";


interface ChatMessage {
    senderId: string;
    senderName: string;
    message: string;
}


export default function RoomEditor() {
    const [socketRef, setSocketRef] = useState<any>(null);
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string; // Grabs the ID straight from the URL!

    const [messages, setMessages] = useState<ChatMessage[]>([]);//These are the chat messages the sender sends and the reciver recieves and these are send to chat via props
    const [hasNewMessage, setHasNewMessage] = useState(false);//to have a notification that we have a new message

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [language, setLanguage] = useState("javascript");

    const [chatWidth, setChatWidth] = useState(380);
    const [editorRef, setEditorRef] = useState<any>(null);

    //resizing call back of chat width
    const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
        const startWidth = chatWidth;
        const startPosition = mouseDownEvent.clientX;

        const onMouseMove = (mouseMoveEvent: MouseEvent) => {
            const newWidth = startWidth + startPosition - mouseMoveEvent.clientX;
            setChatWidth(Math.max(250, Math.min(800, newWidth)));
        };

        const onMouseUp = () => {
            document.body.style.cursor = 'default';
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.body.style.cursor = 'col-resize';
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [chatWidth]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    //socket io initial connection and message recieving
    useEffect(() => {
        if (!roomId) return;

        const socket = io(backendUrl);
        //connection established and raw tcp pipe is open
        // Inside the useEffect, the moment we create the socket, we drop a copy of it into our socket refernce to make use by chat or bvideo this same socket pipeline.
        setSocketRef(socket);

        socket.on("connect", () => {
            console.log("The socket connention is sucesss and the id came from backend:", socket.id);
            socket.emit("join-room", roomId)
            console.log(`sent the room id to backend to add the sockets in it: ${roomId}`);

        });

        //This use Effect listens for messages from others and shows in the messagebox

        socket.on("receive-chat-message", (IncommingMessages: ChatMessage) => {
            //set the imcomming message to the message array to render on the screen
            setMessages(prev => [...prev, IncommingMessages])

            // Turn on the red dot if the sender wasn't us!
            if (IncommingMessages.senderId !== socket.id) {
                setHasNewMessage(true);
            }
        })

        socket.on("disconnect", () => {
            console.log("Disconnected from server.");
        });

        return () => {
            socket.off("receive-chat-message");
            socket.disconnect();
        };
        /* 
        React makes a blood oath: "I promise I will not run the code inside return () => {...}
         until the exact millisecond the user closes their browser tab,
          or leaves this specific webpage."
        */
    }, [backendUrl, roomId]);

    //The Yjs code for sync cursor with code editor ref
    useEffect(() => {
        //only Run if socketpipe and the editor is exists
        if (!socketRef || !editorRef) return;
        // 1. Create a raw Yjs Brain
        const ydoc = new Y.Doc();
        // 2. Extract a specific textbook from the brain to track text
        const ytext = ydoc.getText("monaco");
        const { MonacoBinding } = require("y-monaco");

        // 3. The Anchor: Chain the textbook mathematically to the Editor Body
        const binding = new MonacoBinding(
            ytext,
            editorRef.getModel(),
            new Set([editorRef])
        );
        // 4. Local Sender: When YOU physically type a key, Yjs calculates the Math Delta
        //what happens when i type
        ydoc.on("update", (updateData: Uint8Array, origin: any) => {
            // ONLY scream it to the network if YOU typed it! Prevents infinite echoes!
            if (origin !== "server") {
                const serialziedPacket = Array.from(updateData);
                socketRef.emit("send-crdt-packet", { roomId, packet: serialziedPacket });
            }
        });

        // 5. Remote Receiver: When your FRIEND types a key, the backend bounces their Math Delta to us!
        //what happens when others in the room edit the code
        socketRef.on("receive-crdt-packet", (incomingPacket: number[]) => {
            // Convert it back from standard numbers into pure Binary
            const rawBinary = new Uint8Array(incomingPacket);
            // Inject their binary math right into our Yjs Brain (flagged as "server" so it doesn't echo back!)
            Y.applyUpdate(ydoc, rawBinary, "server");
        });

        return () => {
            socketRef.off("receive-crdt-packet");
            binding.destroy();
            ydoc.destroy();
        }

    }, [socketRef, editorRef, roomId])



    return (
        <div className="h-screen w-screen flex bg-[#0d0e15] text-text-main overflow-hidden relative selection:bg-[#b1ff00]/30">
            <div className="flex-1 flex flex-col h-full min-w-[300px]">

                {/* 1. GLASSMORPHISM TOP APP BAR (Mac Style) */}
                <div className="h-11 bg-[#0a0a0f]/90 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-6 h-full">
                        {/* Mac Window Controls */}
                        <div className="flex items-center gap-2 mr-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/90 border border-red-500/50 shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/90 border border-yellow-500/50 shadow-sm"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/90 border border-green-500/50 shadow-sm"></div>
                        </div>

                        {/* Tab-styled Room indicator */}
                        <div className="flex items-center gap-2 bg-[#1a1c29]/90 border-t border-x border-[#1a1c29] rounded-t-lg px-4 py-2 mt-2 h-[calc(100%-8px)] shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
                            <FileCode2 size={13} className="text-[#b1ff00]" />
                            <span className="text-xs text-gray-300 font-medium tracking-wide">Room: {roomId.substring(0, 8)}</span>
                            <div className="w-2 h-2 ml-2 rounded-full bg-white/20 hover:bg-white/50 cursor-pointer transition-colors" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* "Invite" style Share button */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Room Link copied! Send it to your friend to join.");
                            }}
                            className="flex items-center gap-1.5 bg-[#b1ff00] hover:bg-[#c4ff33] text-black px-4 py-1.5 rounded text-[11px] font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(177,255,0,0.2)]"
                            title="Copy Room Link to Clipboard"
                        >
                            <Users size={12} strokeWidth={3} />
                            Invite
                        </button>

                        <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
                            {/* Chat Toggle */}
                            <button
                                onClick={() => {
                                    setIsChatOpen(!isChatOpen);
                                    if (!isChatOpen) setHasNewMessage(false);
                                }}
                                className={`relative p-1.5 rounded transition-all ${isChatOpen ? "text-[#b1ff00] bg-white/10 shadow-[0_0_10px_rgba(177,255,0,0.1)]" : "text-gray-400 hover:text-white"}`}
                            >
                                <MessageSquarePlus size={15} />
                                {hasNewMessage && !isChatOpen && (
                                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0a0a0f]" />
                                )}
                            </button>
                            {/* Video Toggle */}
                            <button
                                onClick={() => setIsVideoOpen(!isVideoOpen)}
                                className={`relative p-1.5 rounded transition-all ${isVideoOpen ? "text-[#b1ff00] bg-white/10 shadow-[0_0_10px_rgba(177,255,0,0.1)]" : "text-gray-400 hover:text-white"}`}
                            >
                                <Video size={15} />
                            </button>
                        </div>

                        {/* Settings User / Logout */}
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-6 h-6 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 flex items-center justify-center text-[10px] font-bold hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all"
                            title="Sign Out"
                        >
                            {session?.user?.name?.charAt(0) || "U"}
                        </button>
                    </div>
                </div>

                {/* 2. SECONDARY TOOLBAR */}
                <div className="h-12 bg-[#12141f]/70 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 shrink-0 z-10">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-md mx-2 transition-colors border border-white/5 hover:border-white/10"
                            title="Return to Dashboard"
                        >
                            <Home size={14} />
                        </button>

                        <div className="w-px h-5 bg-white/10 mx-1" />

                        {/* Language Selection moved to the Left */}
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="appearance-none px-4 py-1.5 ml-1 rounded-full bg-[#1e2030] outline outline-1 outline-white/10 text-[10px] font-bold tracking-widest uppercase text-[#b1ff00] focus:outline-none focus:outline-[#b1ff00]/50 cursor-pointer hover:bg-white/10 transition-all shadow-inner"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                        {/* The shiny new Run Code button placed firmly on the Right */}
                        <button className="flex items-center gap-1.5 bg-[#b1ff00]/10 hover:bg-[#b1ff00]/20 border border-[#b1ff00]/50 text-[#b1ff00] px-5 py-1.5 rounded-md text-[11px] font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(177,255,0,0.1)] hover:shadow-[0_0_20px_rgba(177,255,0,0.2)]">
                            <Play size={13} fill="currentColor" />
                            Run Code
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative w-full pt-1 bg-[#1a1c29]/30">
                    {/* Fake Editor Breadcrumb */}
                    <div className="flex items-center gap-2 px-6 py-2 pb-0 text-[11px] font-mono text-gray-500">
                        <div className="flex items-center gap-1 hover:text-gray-300 cursor-pointer transition-colors">
                            <Menu size={10} className="mr-1" />
                            <span className="text-primary truncate max-w-[100px]">{roomId}</span>
                        </div>
                        <ChevronRight size={10} />
                        <div className="flex items-center gap-1.5 text-gray-300 cursor-pointer hover:text-white transition-colors">
                            <FileCode2 size={11} className="text-[#b1ff00]" />
                            <span>main.{language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "python" ? "py" : "js"}</span>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full mt-2">
                        <Editor
                            height="100%"
                            language={language}
                            theme="vs-dark"

                            onMount={(editor => setEditorRef(editor))}
                            options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 8 }, smoothScrolling: true, cursorBlinking: "smooth" }}
                        />
                    </div>
                </div>
            </div>
            {isChatOpen && <ChatSidebar socket={socketRef} roomId={roomId} chatWidth={chatWidth} startResizing={startResizing} onClose={() => setIsChatOpen(false)} messages={messages} setMessages={setMessages} />}
            {isVideoOpen && <VideoBubble onClose={() => setIsVideoOpen(false)} />}
        </div>
    );
}
