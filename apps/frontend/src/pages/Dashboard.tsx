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
    // const navigate = useNavigate(); // Unused

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUnlocking(true);
        try {
            // In a real app, we would verify the key against a known hash or try to decrypt a "check" value.
            // For now, we just derive it and assume it's correct.
            // Use a fixed salt for simplicity in this MVP, or fetch user's salt.
            // Ideally, salt should be stored with the user record.
            // Let's assume a static salt for MVP or derive from username (not secure but works for MVP).
            const salt = btoa(user?.id || 'default-salt');
            const derivedKey = await deriveKey(diaryPassword, salt);
            setKey(derivedKey);
        } catch (error) {
            console.error(error);
        } finally {
            setIsUnlocking(false);
        }
    };

    if (!key) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold mb-4 text-primary">Unlock Your Diary</h2>
                    <p className="text-gray-400 mb-6">Enter your Diary Password to decrypt your entries.</p>
                    <form onSubmit={handleUnlock}>
                        <input
                            type="password"
                            className="input-field mb-4 text-center tracking-widest"
                            placeholder="••••••••"
                            value={diaryPassword}
                            onChange={(e) => setDiaryPassword(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={isUnlocking}
                        >
                            {isUnlocking ? 'Unlocking...' : 'Unlock'}
                        </button>
                    </form>
                    <button onClick={() => logout()} className="mt-4 text-sm text-gray-500 hover:text-white">
                        Logout
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
