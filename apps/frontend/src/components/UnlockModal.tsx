import React, { useState } from 'react';
import { X, Unlock, AlertCircle } from 'lucide-react';
import { Capsule } from '@secret-capsule/types';
import { deriveCapsuleKeys, decryptCapsule, CapsuleKeys } from '@secret-capsule/crypto-utils';

interface UnlockModalProps {
    capsule: Capsule;
    onClose: () => void;
    onUnlock: (content: { title: string; content: string }, keys: CapsuleKeys) => void;
}

export default function UnlockModal({ capsule, onClose, onUnlock }: UnlockModalProps) {
    const [password, setPassword] = useState('');
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 relative animate-fade-in border-neon-cyan/30 shadow-neon-cyan/20">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-cyan/30">
                        <Unlock className="w-8 h-8 text-neon-cyan" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white">Unlock Capsule</h2>
                    <p className="text-gray-400 text-sm mt-1">Enter the unique password for this capsule</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <input
                        type="password"
                        className="input-cyber text-center text-lg tracking-widest"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 p-2 rounded">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full btn-neon bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20"
                    >
                        {loading ? 'DECRYPTING...' : 'ACCESS CONTENT'}
                    </button>
                </form>
            </div>
        </div>
    );
}
