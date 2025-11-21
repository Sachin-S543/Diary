import { useState } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { encryptData } from '@secret-capsule/crypto-utils';
import api from '../api';

interface EntryEditorProps {
    onSave: () => void;
    onCancel: () => void;
}

export default function EntryEditor({ onSave, onCancel }: EntryEditorProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { key } = useCryptoStore();

    const handleSave = async () => {
        if (!key || !title || !content) return;
        setIsSaving(true);
        try {
            const encTitle = await encryptData(title, key);
            const encContent = await encryptData(content, key);

            await api.post('/entries', {
                title: JSON.stringify(encTitle),
                content: JSON.stringify(encContent),
                tags: []
            });
            onSave();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-card p-6 animate-fade-in">
            <input
                type="text"
                placeholder="Title"
                className="w-full bg-transparent text-2xl font-bold mb-4 focus:outline-none border-b border-white/10 pb-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                placeholder="Write your thoughts..."
                className="w-full bg-transparent h-64 focus:outline-none resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="btn-secondary">Cancel</button>
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    disabled={isSaving}
                >
                    {isSaving ? 'Encrypting & Saving...' : 'Save Entry'}
                </button>
            </div>
        </div>
    );
}
