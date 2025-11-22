import { X, Trash2 } from 'lucide-react';

interface CapsuleViewerProps {
    data: { title: string; content: string };
    onClose: () => void;
    onDelete: () => void;
}

export default function CapsuleViewer({ data, onClose, onDelete }: CapsuleViewerProps) {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="glass-panel w-full max-w-4xl h-[80vh] flex flex-col relative border-neon-cyan/30 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-3xl font-display font-bold text-white neon-text">{data.title}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Capsule"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-2" />
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="prose prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-200 font-light">
                            {data.content}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 text-center text-xs text-gray-500 font-mono">
                    SECURE DECRYPTED VIEW • DO NOT LEAVE UNATTENDED
                </div>
            </div>
        </div>
    );
}
