import { Unlock, Clock, Calendar, Lock, FileText } from 'lucide-react';
import { Capsule } from '@secret-capsule/types';

interface CapsuleCardProps {
    capsule: Capsule;
    onClick: () => void;
}

export default function CapsuleCard({ capsule, onClick }: CapsuleCardProps) {
    const isLocked = capsule.unlockAt ? new Date(capsule.unlockAt) > new Date() : false;
    const date = new Date(capsule.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const auraColors: Record<string, string> = {
        purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
        cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
        gold: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
        red: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
        green: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
        indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        pink: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
        slate: 'bg-slate-800/10 text-slate-800 border-slate-800/20',
    };

    const auraClass = auraColors[capsule.aura || 'purple'] || auraColors.purple;

    // Check if password protected
    let isPasswordProtected = true;
    try {
        if (capsule.encryptedContent.startsWith('{')) {
            const blob = JSON.parse(capsule.encryptedContent);
            if (blob.v === 2 && blob.p === 0) isPasswordProtected = false;
        }
    } catch { }

    return (
        <div
            onClick={onClick}
            className="capsule-card group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`badge-aura ${auraClass} flex items-center gap-1.5`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
                    {capsule.aura || 'Classic'}
                </div>
                {isLocked ? (
                    <div className="text-slate-400 bg-slate-100 p-2 rounded-full">
                        <Clock className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="text-primary-vibrant bg-primary-soft/10 p-2 rounded-full group-hover:bg-primary-soft/20 transition-colors">
                        {isPasswordProtected ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-primary-vibrant transition-colors">
                {capsule.encryptedTitle ? "Secret Memory" : "Untitled Capsule"}
            </h3>

            <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-body leading-relaxed">
                {isPasswordProtected
                    ? (isLocked ? `This capsule is locked until ${new Date(capsule.unlockAt!).toLocaleDateString()}.` : "This capsule is secured with a password.")
                    : "This is an open note."}
            </p>

            <div className="flex items-center justify-between text-xs font-medium text-slate-400 border-t border-slate-100 pt-4 mt-auto">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {date}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    {Math.round(capsule.size / 1024)} KB
                </div>
            </div>
        </div>
    );
}
