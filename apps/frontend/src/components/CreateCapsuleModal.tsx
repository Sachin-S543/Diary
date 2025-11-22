import React, { useState } from 'react';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';
import { generateSalt, deriveCapsuleKeys, encryptCapsule } from '@secret-capsule/crypto-utils';
import api from '../api';

interface CreateCapsuleModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateCapsuleModal({ onClose, onSuccess }: CreateCapsuleModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        // Use setTimeout to unblock UI
        setTimeout(async () => {
            try {
                const salt = generateSalt();
                const keys = await deriveCapsuleKeys(password, salt);

                const payload = JSON.stringify({ title, content });
                const encrypted = await encryptCapsule(payload, keys);

                await api.capsules.create({
                    encryptedTitle: "", // Unused in single-blob mode
                    encryptedContent: encrypted.ciphertext,
                    iv: encrypted.iv,
                    salt: salt,
                    hmac: encrypted.hmac,
                    size: payload.length
                });

                onSuccess();
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to create capsule');
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-2xl p-8 relative animate-fade-in border-neon-purple/30 shadow-neon-purple/20">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-neon-purple" />
                    New Secure Capsule
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <input
                            type="text"
                            className="input-cyber text-xl font-bold"
                            placeholder="Capsule Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />

                        <textarea
                            className="input-cyber min-h-[200px] resize-none"
                            placeholder="Write your secure content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 space-y-4">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Encryption Lock</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="password"
                                className="input-cyber"
                                placeholder="Capsule Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                className="input-cyber"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            This password is required to unlock this specific capsule. If lost, content is unrecoverable.
                        </p>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-neon text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-neon bg-neon-purple/20 border-neon-purple/50 text-neon-purple hover:bg-neon-purple/30"
                        >
                            {loading ? 'ENCRYPTING...' : 'SEAL CAPSULE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
