import React, { useState } from 'react';
import { X, Unlock, AlertCircle, Eye, EyeOff, Key } from 'lucide-react';
import { Capsule } from '@secret-capsule/types';
import { deriveCapsuleKeys, decryptCapsule, CapsuleKeys, importRecoveryKey } from '@secret-capsule/crypto-utils';
import CryptoBridge from '../lib/cryptoBridge';
import { parseV2Blob, fromBase64 } from '../lib/capsuleUtils';

interface UnlockModalProps {
    capsule: Capsule;
    onClose: () => void;
    onUnlock: (content: { title: string; content: string }, keys: any) => void;
}

export default function UnlockModal({ capsule, onClose, onUnlock }: UnlockModalProps) {
    const [mode, setMode] = useState<'password' | 'recovery'>('password');
    const [password, setPassword] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Check V2 status
    const v2Info = React.useMemo(() => parseV2Blob(capsule.encryptedContent), [capsule]);

    const isPasswordProtected = v2Info ? (v2Info.p !== 0) : true;

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(async () => {
            try {
                if (v2Info) {
                    // --- V2 Decryption ---
                    let capsuleKey: CryptoKey;

                    if (v2Info.p === 0) {
                        // No Password: Key is stored directly
                        const rawCapsuleKey = fromBase64(v2Info.k);
                        capsuleKey = await crypto.subtle.importKey('raw', rawCapsuleKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
                    } else {
                        // Password Protected: Key Splitting
                        let userKey: CryptoKey;
                        if (mode === 'password') {
                            const saltBytes = new TextEncoder().encode(capsule.salt);
                            userKey = await CryptoBridge.deriveKey(password, saltBytes);
                        } else {
                            const rawKey = fromBase64(recoveryKey);
                            userKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
                        }

                        const capsuleKeyStr = await CryptoBridge.decrypt(
                            fromBase64(v2Info.kiv),
                            fromBase64(v2Info.k),
                            userKey
                        );
                        const rawCapsuleKey = fromBase64(capsuleKeyStr);
                        capsuleKey = await crypto.subtle.importKey('raw', rawCapsuleKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
                    }

                    // Decrypt Content
                    const contentStr = await CryptoBridge.decrypt(
                        fromBase64(v2Info.civ),
                        fromBase64(v2Info.c),
                        capsuleKey
                    );

                    const data = JSON.parse(contentStr);
                    onUnlock(data, { enc: capsuleKey } as any);

                } else {
                    // --- V1 Legacy Decryption ---
                    let keys: CapsuleKeys;

                    if (mode === 'password') {
                        keys = await deriveCapsuleKeys(password, capsule.salt);
                    } else {
                        keys = await importRecoveryKey(recoveryKey);
                    }

                    const decryptedPayload = await decryptCapsule({
                        ciphertext: capsule.encryptedContent,
                        iv: capsule.iv,
                        hmac: capsule.hmac
                    }, keys);

                    const data = JSON.parse(decryptedPayload);
                    onUnlock(data, keys);
                }
            } catch (err) {
                console.error(err);
                setError(mode === 'password' ? 'Decryption failed. Incorrect password.' : 'Invalid Recovery Key.');
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    // Aura Colors
    const aura = capsule.aura || 'purple';
    const auraColors: Record<string, { border: string, text: string, bg: string, btn: string }> = {
        purple: { border: 'border-accent-purple/30', text: 'text-accent-purple', bg: 'bg-accent-purple/10', btn: 'bg-accent-purple text-white hover:bg-accent-purple/90' },
        cyan: { border: 'border-accent-cyan/30', text: 'text-accent-cyan', bg: 'bg-accent-cyan/10', btn: 'bg-accent-cyan text-white hover:bg-accent-cyan/90' },
        gold: { border: 'border-accent-amber/30', text: 'text-accent-amber', bg: 'bg-accent-amber/10', btn: 'bg-accent-amber text-white hover:bg-accent-amber/90' },
        red: { border: 'border-accent-rose/30', text: 'text-accent-rose', bg: 'bg-accent-rose/10', btn: 'bg-accent-rose text-white hover:bg-accent-rose/90' },
        green: { border: 'border-accent-emerald/30', text: 'text-accent-emerald', bg: 'bg-accent-emerald/10', btn: 'bg-accent-emerald text-white hover:bg-accent-emerald/90' },
    };
    const theme = auraColors[aura] || auraColors.cyan;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className={`glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto p-8 relative animate-scale-in border-t-4 ${theme.border}`} style={{ borderTopColor: 'currentColor' }}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <div className={`w-16 h-16 ${theme.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                        <Unlock className={`w-8 h-8 ${theme.text}`} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        {isPasswordProtected ? 'Unlock Capsule' : 'Open Note'}
                    </h2>

                    {isPasswordProtected && (
                        <div className="flex justify-center gap-6 mt-6 text-sm font-medium">
                            <button
                                onClick={() => { setMode('password'); setError(''); }}
                                className={`pb-2 border-b-2 transition-all ${mode === 'password' ? `${theme.text} border-current` : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                Password
                            </button>
                            <button
                                onClick={() => { setMode('recovery'); setError(''); }}
                                className={`pb-2 border-b-2 transition-all ${mode === 'recovery' ? `${theme.text} border-current` : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                Recovery Key
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleUnlock} className="space-y-6">
                    {isPasswordProtected ? (
                        mode === 'password' ? (
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-premium text-center text-lg tracking-widest px-4 w-full pr-10 font-mono"
                                    placeholder={showPassword ? "password" : "••••••••••••"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:${theme.text} transition-colors`}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    className="input-premium text-sm font-mono px-4 py-3 w-full h-32 resize-none"
                                    placeholder="Paste your 64-character recovery key..."
                                    value={recoveryKey}
                                    onChange={(e) => setRecoveryKey(e.target.value)}
                                    autoFocus
                                />
                                <Key className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                            </div>
                        )
                    ) : (
                        <p className="text-center text-slate-500 text-sm">
                            This note is not password protected. Click below to open.
                        </p>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm justify-center bg-red-50 p-3 rounded-xl border border-red-100">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (isPasswordProtected && (mode === 'password' ? !password : !recoveryKey))}
                        className={`w-full btn-premium justify-center shadow-lg hover:shadow-xl ${theme.btn}`}
                    >
                        {loading ? (isPasswordProtected ? 'Decrypting...' : 'Opening...') : (isPasswordProtected ? 'Access Content' : 'Open Note')}
                    </button>
                </form>
            </div>
        </div>
    );
}
