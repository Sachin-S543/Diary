import React, { useState } from 'react';
import { storage } from '../lib/storage';
import { Capsule } from '@secret-capsule/types';
import { generateSalt } from '@secret-capsule/crypto-utils';
import CryptoBridge from '../lib/cryptoBridge';
import { Copy, Check, X, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { toBase64 } from '../lib/capsuleUtils';

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
    const [unlockDate, setUnlockDate] = useState('');
    const [aura, setAura] = useState('purple');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [step, setStep] = useState<'create' | 'success'>('create');
    const [copied, setCopied] = useState(false);
    const [usePassword, setUsePassword] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (usePassword && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        // Use setTimeout to unblock UI
        setTimeout(async () => {
            try {
                const salt = generateSalt();
                let userKey: CryptoKey | null = null;

                if (usePassword) {
                    // 1. Derive User Master Key (Argon2id) via Worker
                    const saltBytes = new TextEncoder().encode(salt);
                    userKey = await CryptoBridge.deriveKey(password, saltBytes);

                    // 2. Generate Recovery Key (Export User Key)
                    const rawUserKey = await crypto.subtle.exportKey('raw', userKey);
                    const rKey = toBase64(new Uint8Array(rawUserKey));
                    setRecoveryKey(rKey);
                }

                // 3. Generate Random Capsule Key (AES-GCM)
                const capsuleKey = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );

                // 4. Encrypt Content with Capsule Key
                const payloadStr = JSON.stringify({ title, content });
                const { ciphertext: contentBuf, iv: contentIv } = await CryptoBridge.encrypt(payloadStr, capsuleKey);

                // 5. Encrypt Capsule Key (or store plain if no password)
                const rawCapsuleKey = await crypto.subtle.exportKey('raw', capsuleKey);
                const capsuleKeyStr = toBase64(new Uint8Array(rawCapsuleKey));

                let keyBuf: Uint8Array;
                let keyIv: Uint8Array;

                if (usePassword && userKey) {
                    const encKey = await CryptoBridge.encrypt(capsuleKeyStr, userKey);
                    keyBuf = encKey.ciphertext;
                    keyIv = encKey.iv;
                } else {
                    // No password: Store raw key bytes directly
                    keyBuf = new Uint8Array(rawCapsuleKey);
                    keyIv = new Uint8Array(0);
                }

                // 6. Pack Data (V2 Format)
                const encryptedContent = JSON.stringify({
                    v: 2,
                    p: usePassword ? 1 : 0,
                    c: toBase64(contentBuf),
                    civ: toBase64(contentIv),
                    k: toBase64(keyBuf),
                    kiv: toBase64(keyIv)
                });

                const id = crypto.randomUUID();
                const now = new Date().toISOString();

                const newCapsule: Capsule = {
                    id,
                    userId: 'local',
                    encryptedTitle: "", // Title is now inside the encrypted blob
                    encryptedContent: encryptedContent,
                    iv: toBase64(contentIv), // Legacy field, kept for schema compliance
                    salt: salt,
                    hmac: "v2-hmac-pending", // Placeholder for now
                    size: payloadStr.length,
                    unlockAt: unlockDate ? new Date(unlockDate).toISOString() : undefined,
                    aura,
                    createdAt: now,
                    updatedAt: now
                };

                // Save locally
                await storage.saveCapsule(newCapsule);

                // Sync
                try {
                    await api.capsules.create(newCapsule);
                } catch (e) {
                    console.error("Offline mode: Queued for sync", e);
                    await storage.addToSyncQueue({ type: 'create', payload: newCapsule });
                }

                setStep('success');
            } catch (err) {
                console.error(err);
                const message = err instanceof Error ? err.message : 'Failed to create capsule';
                setError(message);
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(recoveryKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="glass-panel w-full max-w-md p-8 relative animate-scale-in border-emerald-500/30 shadow-glow">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {usePassword ? 'Capsule Secured' : 'Note Saved'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {usePassword
                                ? 'Your capsule has been encrypted and stored.'
                                : 'Your note has been saved successfully.'}
                        </p>
                    </div>

                    {usePassword && (
                        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 mb-8 shadow-inner">
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Recovery Key</h3>
                            <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                                <strong>Save this key!</strong> It is the <span className="text-rose-400 font-bold">ONLY</span> way to recover your capsule if you forget the password.
                            </p>
                            <div className="relative group">
                                <code className="block bg-black/30 p-4 rounded-lg text-emerald-400 text-xs break-all font-mono border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                                    {recoveryKey}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onSuccess}
                        className="w-full btn-premium bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 border-none"
                    >
                        {usePassword ? 'I Have Saved My Key' : 'Close'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <div className="p-2 bg-primary-soft/10 rounded-lg text-primary-vibrant">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    Create New Capsule
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Title <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                            <input
                                type="text"
                                className="input-premium text-lg font-medium"
                                placeholder="e.g., My Future Goals"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Content</label>
                            <textarea
                                className="input-premium min-h-[200px] resize-none"
                                placeholder="Write your thoughts, dreams, or secrets here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Time Lock (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="input-premium"
                                    value={unlockDate}
                                    onChange={(e) => setUnlockDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                                <p className="text-xs text-slate-500">
                                    Capsule will remain locked until this date.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Aura (Theme)</label>
                                <div className="flex gap-3 flex-wrap">
                                    {[
                                        { id: 'purple', bg: 'bg-accent-purple', ring: 'ring-accent-purple' },
                                        { id: 'cyan', bg: 'bg-accent-cyan', ring: 'ring-accent-cyan' },
                                        { id: 'gold', bg: 'bg-accent-amber', ring: 'ring-accent-amber' },
                                        { id: 'red', bg: 'bg-accent-rose', ring: 'ring-accent-rose' },
                                        { id: 'green', bg: 'bg-accent-emerald', ring: 'ring-accent-emerald' },
                                        { id: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
                                        { id: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500' },
                                        { id: 'slate', bg: 'bg-slate-800', ring: 'ring-slate-800' }
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setAura(c.id)}
                                            className={`w-8 h-8 rounded-full transition-all duration-200 ${c.bg} ${aura === c.id
                                                ? `ring-4 ring-offset-2 ${c.ring} scale-110`
                                                : 'opacity-40 hover:opacity-100 hover:scale-105'
                                                }`}
                                            title={c.id.charAt(0).toUpperCase() + c.id.slice(1)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Encryption Lock</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">AES-GCM 256-bit</span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs font-medium text-slate-600">Password Protection</span>
                                <input
                                    type="checkbox"
                                    checked={usePassword}
                                    onChange={(e) => setUsePassword(e.target.checked)}
                                    className="toggle toggle-primary toggle-sm"
                                />
                            </label>
                        </div>

                        {usePassword ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input-premium pr-10"
                                            placeholder="Create Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required={usePassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-vibrant transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input-premium"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required={usePassword}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                                    <span>
                                        <strong>Important:</strong> We cannot recover this password. If you lose it, you will need your Recovery Key to access this capsule.
                                    </span>
                                </p>
                            </>
                        ) : (
                            <p className="text-xs text-slate-500 italic">
                                This capsule will be saved as an open note. Anyone with access to this device can read it.
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-premium btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-premium btn-primary min-w-[140px]"
                        >
                            {loading ? (
                                <span className="animate-pulse">Encrypting...</span>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    Seal Capsule
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
