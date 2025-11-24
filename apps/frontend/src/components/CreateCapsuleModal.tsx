import React, { useState } from 'react';
import { X, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // No minimum password length - user can choose any password

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
            } catch (err) {
                console.error(err);
                const message = err instanceof Error ? err.message : 'Failed to create capsule';
                setError(message);
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in border-neon-purple/30 shadow-neon-purple/20 custom-scrollbar">
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
                            className="input-cyber text-xl font-bold px-4"
                            placeholder="Capsule Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />

                        <textarea
                            className="input-cyber min-h-[200px] resize-none px-4 py-3"
                            placeholder="Write your secure content here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                    <div className="bg-black/40 p-6 rounded-xl border border-white/10 space-y-4">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Encryption Lock</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-cyber px-4 w-full pr-10"
                                    placeholder="Capsule Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-cyan transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-cyber px-4 w-full pr-10"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
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
