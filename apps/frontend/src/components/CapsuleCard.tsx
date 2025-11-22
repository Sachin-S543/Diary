import { Capsule } from '@secret-capsule/types';
import { Lock, Calendar, HardDrive } from 'lucide-react';

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

    // Estimate size (very rough)
    const size = (capsule.encryptedContent.length + capsule.encryptedTitle.length) * 0.75; // Base64 overhead removal
    const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${Math.round(size)} B`;

    return (
        <div
            onClick={onClick}
            className="capsule-card group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/10 rounded-xl group-hover:border-neon-cyan/50 transition-colors">
                <Lock className="w-8 h-8 text-gray-500 group-hover:text-neon-cyan transition-colors mb-2" />
                <span className="text-xs font-mono text-gray-500 group-hover:text-neon-cyan/80 tracking-widest uppercase">
                    Encrypted
                </span>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{date}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>{sizeStr}</span>
                </div>
            </div>
        </div>
    );
}
