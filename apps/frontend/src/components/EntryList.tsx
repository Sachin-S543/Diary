import { useEffect, useState } from 'react';
import { useCryptoStore } from '../store/cryptoStore';
import { decryptData } from '@secret-capsule/crypto-utils';
import { DiaryEntry } from '@secret-capsule/types';
import api from '../api';

export default function EntryList({ refreshTrigger }: { refreshTrigger: number }) {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [decryptedEntries, setDecryptedEntries] = useState<{ id: string, title: string, content: string, date: string }[]>([]);
    const { key } = useCryptoStore();

    useEffect(() => {
        api.get('/entries').then(({ data }) => setEntries(data));
    }, [refreshTrigger]);

    useEffect(() => {
        if (!key || entries.length === 0) return;

        const decryptAll = async () => {
            const decrypted = await Promise.all(entries.map(async (entry) => {
                try {
                    const titleObj = JSON.parse(entry.title);
                    const contentObj = JSON.parse(entry.content);

                    const title = await decryptData(titleObj.ciphertext, titleObj.iv, key);
                    const content = await decryptData(contentObj.ciphertext, contentObj.iv, key);

                    return {
                        id: entry.id,
                        title,
                        content,
                        date: new Date(entry.createdAt).toLocaleDateString()
                    };
                } catch (e) {
                    console.error('Failed to decrypt entry', entry.id, e);
                    return { id: entry.id, title: 'Decryption Failed', content: 'Wrong password?', date: '' };
                }
            }));
            setDecryptedEntries(decrypted);
        };

        decryptAll();
    }, [entries, key]);

    if (decryptedEntries.length === 0 && entries.length > 0) {
        return <div className="text-center text-gray-400">Decrypting...</div>;
    }

    if (entries.length === 0) {
        return <div className="text-center text-gray-400 mt-10">No entries yet. Start writing!</div>;
    }

    return (
        <div className="grid gap-4">
            {decryptedEntries.map((entry) => (
                <div key={entry.id} className="glass-card hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-primary">{entry.title}</h3>
                        <span className="text-xs text-gray-500">{entry.date}</span>
                    </div>
                    <p className="text-gray-300 line-clamp-3">{entry.content}</p>
                </div>
            ))}
        </div>
    );
}
