import React from "react";
import { Terminal as TerminalIcon, XCircle, Loader2 } from "lucide-react";

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    output: string | null;
    isExecuting: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose, output, isExecuting }) => {
    if (!isOpen) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
            {/* Terminal Header */}
            <div className="h-8 bg-[#12141f] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <TerminalIcon size={12} className="text-[#b1ff00]" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                        Terminal Output
                    </span>
                    {isExecuting && (
                        <div className="flex items-center gap-2 ml-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#b1ff00] animate-pulse" />
                            <span className="text-[9px] text-[#b1ff00]/60 animate-pulse uppercase">Running...</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors p-1"
                    title="Close Terminal"
                >
                    <XCircle size={14} />
                </button>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto no-scrollbar selection:bg-[#b1ff00]/20 custom-scrollbar">
                {output ? (
                    <pre className="whitespace-pre-wrap break-all text-gray-300 leading-relaxed font-mono">
                        {output}
                    </pre>
                ) : (
                    <span className="text-gray-600 italic">No output yet. Click 'Run Code' to execute.</span>
                )}
            </div>
        </div>
    );
};

export default Terminal;
