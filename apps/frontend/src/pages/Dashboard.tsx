import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCryptoStore } from '../store/cryptoStore';
import { deriveKey } from '@secret-capsule/crypto-utils';
import EntryEditor from '../components/EntryEditor';
import EntryList from '../components/EntryList';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const { key, setKey } = useCryptoStore();
    const [diaryPassword, setDiaryPassword] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [error, setError] = useState('');

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUnlocking(true);
        setError('');
        try {
            // Derive key using user ID as salt
            const salt = btoa(user?.id || 'default-salt');
            const derivedKey = await deriveKey(diaryPassword, salt);

            // Set the key - verification will happen when trying to decrypt entries
            setKey(derivedKey);
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Failed to unlock diary');
        } finally {
            setIsUnlocking(false);
        }
    };

    if (!key) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
                <div className="glass-card max-w-md w-full text-center border-t border-white/10">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-2 text-white">Unlock Your Diary</h2>
                        <p className="text-gray-400">Enter your encryption password to access your private thoughts.</p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input
                                type="password"
                                className="input-field text-center tracking-widest text-lg py-3"
                                placeholder="••••••••"
                                value={diaryPassword}
                                onChange={(e) => setDiaryPassword(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm animate-pulse">{error}</p>}

                        <button
                            type="submit"
                            className="btn-primary w-full py-3 text-lg shadow-lg shadow-primary/20"
                            disabled={isUnlocking}
                        >
                            {isUnlocking ? 'Unlocking...' : 'Unlock Diary'}
                        </button>
                    </form>

                    <button onClick={() => logout()} className="mt-6 text-sm text-gray-500 hover:text-white transition-colors">
                        Sign out of {user?.username}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-primary">Secret Capsule</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 hidden sm:inline">@{user?.username}</span>
                    <button onClick={() => logout()} className="btn-secondary text-sm">Logout</button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {!showEditor ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl">Your Entries</h2>
                            <button onClick={() => setShowEditor(true)} className="btn-primary">
                                + New Entry
                            </button>
                        </div>
                        <EntryList refreshTrigger={refreshTrigger} />
                    </>
                ) : (
                    <EntryEditor
                        onSave={() => {
                            setShowEditor(false);
                            setRefreshTrigger(p => p + 1);
                        }}
                        onCancel={() => setShowEditor(false)}
                    />
                )}
            </main>
        </div>
    );
}
