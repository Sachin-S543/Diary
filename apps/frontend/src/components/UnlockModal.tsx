import React, { useState } from 'react';
import { X, Unlock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Capsule } from '@secret-capsule/types';
import { deriveCapsuleKeys, decryptCapsule, CapsuleKeys } from '@secret-capsule/crypto-utils';

interface UnlockModalProps {
    capsule: Capsule;
    onClose: () => void;
    onUnlock: (content: { title: string; content: string }, keys: CapsuleKeys) => void;
}

export default function UnlockModal({ capsule, onClose, onUnlock }: UnlockModalProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Use setTimeout to allow UI to update before heavy crypto op
        setTimeout(async () => {
            try {
                const keys = await deriveCapsuleKeys(password, capsule.salt);

                // Decrypt the content (title and content are encrypted together as JSON)
                const decryptedPayload = await decryptCapsule({
                    ciphertext: capsule.encryptedContent,
                    iv: capsule.iv,
                    hmac: capsule.hmac
                }, keys);

                // Parse the JSON payload
                const data = JSON.parse(decryptedPayload);

                onUnlock(data, keys);
            } catch (err) {
                console.error(err);
                setError('Decryption failed. Incorrect password or corrupted data.');
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    // Aura Colors
    const aura = capsule.aura || 'purple';
    const auraColors: Record<string, { border: string, text: string, bg: string, shadow: string, btn: string }> = {
        purple: { border: 'border-[#b026ff]/30', text: 'text-[#b026ff]', bg: 'bg-[#b026ff]/10', shadow: 'shadow-[#b026ff]/20', btn: 'bg-[#b026ff]/10 border-[#b026ff]/50 text-[#b026ff] hover:bg-[#b026ff]/20' },
        cyan: { border: 'border-[#00f3ff]/30', text: 'text-[#00f3ff]', bg: 'bg-[#00f3ff]/10', shadow: 'shadow-[#00f3ff]/20', btn: 'bg-[#00f3ff]/10 border-[#00f3ff]/50 text-[#00f3ff] hover:bg-[#00f3ff]/20' },
        gold: { border: 'border-[#ffd700]/30', text: 'text-[#ffd700]', bg: 'bg-[#ffd700]/10', shadow: 'shadow-[#ffd700]/20', btn: 'bg-[#ffd700]/10 border-[#ffd700]/50 text-[#ffd700] hover:bg-[#ffd700]/20' },
        red: { border: 'border-[#ff0055]/30', text: 'text-[#ff0055]', bg: 'bg-[#ff0055]/10', shadow: 'shadow-[#ff0055]/20', btn: 'bg-[#ff0055]/10 border-[#ff0055]/50 text-[#ff0055] hover:bg-[#ff0055]/20' },
        green: { border: 'border-[#00ff9d]/30', text: 'text-[#00ff9d]', bg: 'bg-[#00ff9d]/10', shadow: 'shadow-[#00ff9d]/20', btn: 'bg-[#00ff9d]/10 border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d]/20' },
    };
    const theme = auraColors[aura] || auraColors.cyan; // Default to cyan for unlock modal if no aura

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative animate-fade-in ${theme.border} ${theme.shadow} custom-scrollbar`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className={`w-16 h-16 ${theme.bg} rounded-full flex items-center justify-center mx-auto mb-4 border ${theme.border}`}>
                        <Unlock className={`w-8 h-8 ${theme.text}`} />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Unlock Capsule</h2>
                    <p className="text-gray-400 text-sm mt-1">Enter the unique password for this capsule</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="input-cyber text-center text-lg tracking-widest px-4 w-full pr-10"
                            placeholder={showPassword ? "password" : "••••••••••••"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:${theme.text} transition-colors`}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 p-2 rounded">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className={`w-full btn-neon ${theme.btn}`}
                    >
                        {loading ? 'DECRYPTING...' : 'ACCESS CONTENT'}
                    </button>
                </form>
            </div>
        </div>
    );
}
