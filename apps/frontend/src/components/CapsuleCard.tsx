import { Capsule } from '@secret-capsule/types';
import { Lock, Calendar, HardDrive, Clock } from 'lucide-react';

interface CapsuleCardProps {
    capsule: Capsule;
    onClick: () => void;
}

export default function CapsuleCard({ capsule, onClick }: CapsuleCardProps) {
    const date = new Date(capsule.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const isLocked = capsule.unlockAt && new Date(capsule.unlockAt) > new Date();
    const unlockDateStr = capsule.unlockAt ? new Date(capsule.unlockAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : '';

    // Estimate size (very rough)
    const size = (capsule.encryptedContent.length + capsule.encryptedTitle.length) * 0.75; // Base64 overhead removal
    const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${Math.round(size)} B`;

    // Aura Colors
    const aura = capsule.aura || 'purple';
    const auraColors: Record<string, { border: string, text: string, bg: string, shadow: string }> = {
        purple: { border: 'group-hover:border-[#b026ff]/50', text: 'group-hover:text-[#b026ff]', bg: 'from-[#b026ff]/10', shadow: 'hover:shadow-[0_0_20px_rgba(176,38,255,0.2)]' },
        cyan: { border: 'group-hover:border-[#00f3ff]/50', text: 'group-hover:text-[#00f3ff]', bg: 'from-[#00f3ff]/10', shadow: 'hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]' },
        gold: { border: 'group-hover:border-[#ffd700]/50', text: 'group-hover:text-[#ffd700]', bg: 'from-[#ffd700]/10', shadow: 'hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]' },
        red: { border: 'group-hover:border-[#ff0055]/50', text: 'group-hover:text-[#ff0055]', bg: 'from-[#ff0055]/10', shadow: 'hover:shadow-[0_0_20px_rgba(255,0,85,0.2)]' },
        green: { border: 'group-hover:border-[#00ff9d]/50', text: 'group-hover:text-[#00ff9d]', bg: 'from-[#00ff9d]/10', shadow: 'hover:shadow-[0_0_20px_rgba(0,255,157,0.2)]' },
    };
    const theme = auraColors[aura] || auraColors.purple;

    return (
        <div
            onClick={onClick}
            className={`capsule-card group ${isLocked ? 'border-red-500/20 hover:border-red-500/50' : ''} ${!isLocked ? theme.shadow : ''}`}
            style={{ transition: 'all 0.3s ease' }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className={`relative z-10 flex flex-col items-center justify-center h-40 border-2 border-dashed ${isLocked ? 'border-red-500/20' : 'border-white/10'} rounded-xl ${isLocked ? 'group-hover:border-red-500/50' : theme.border} transition-colors`}>
                {isLocked ? (
                    <>
                        <Clock className="w-8 h-8 text-red-500/70 group-hover:text-red-400 transition-colors mb-2" />
                        <span className="text-xs font-mono text-red-500/70 group-hover:text-red-400 tracking-widest uppercase text-center px-2">
                            Locked until<br />{unlockDateStr}
                        </span>
                    </>
                ) : (
                    <>
                        <Lock className={`w-8 h-8 text-gray-500 ${theme.text} transition-colors mb-2`} />
                        <span className={`text-xs font-mono text-gray-500 ${theme.text} tracking-widest uppercase`}>
                            Encrypted
                        </span>
                    </>
                )}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm text-gray-400">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>{sizeStr}</span>
                    </div>
                </div>
                <div className="text-[10px] font-mono text-gray-600 truncate w-full text-center border-t border-white/5 pt-2 mt-1">
                    ID: {capsule.id}
                </div>
            </div>
        </div>
    );
}
