import { X, Trash2, ShieldCheck, Calendar } from 'lucide-react';

interface CapsuleViewerProps {
    data: { title: string; content: string; createdAt?: string; unlockAt?: string };
    onClose: () => void;
    onDelete: () => void;
}

export default function CapsuleViewer({ data, onClose, onDelete }: CapsuleViewerProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-4xl h-[85vh] flex flex-col relative animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-200/50 bg-white/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-soft/10 rounded-xl text-primary-vibrant">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{data.title}</h2>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Decrypted View
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    VERIFIED SECURE
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onDelete}
                            className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
                            title="Delete Capsule"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-px bg-slate-200" />
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white/30">
                    <div className="prose prose-slate max-w-none prose-lg">
                        <div className="whitespace-pre-wrap font-body text-slate-700 leading-relaxed">
                            {data.content}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200/50 bg-slate-50/50 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
                    End of Encrypted Message • Do Not Share
                </div>
            </div>
        </div>
    );
}
