import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { Capsule } from '@secret-capsule/types';
import CapsuleCard from '../components/CapsuleCard';
import CreateCapsuleModal from '../components/CreateCapsuleModal';
import UnlockModal from '../components/UnlockModal';
import CapsuleViewer from '../components/CapsuleViewer';
import { Plus, LogOut, Search, Download, Upload } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const [capsules, setCapsules] = useState<Capsule[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
    const [viewData, setViewData] = useState<{ title: string; content: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCapsules();
    }, []);

    const loadCapsules = async () => {
        try {
            const { data } = await api.capsules.getAll();
            setCapsules(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = (data: { title: string; content: string }) => {
        setViewData(data);
    };

    const handleDelete = async () => {
        if (!selectedCapsule) return;
        if (confirm('Are you sure you want to delete this capsule? This cannot be undone.')) {
            await api.capsules.delete(selectedCapsule.id);
            setViewData(null);
            setSelectedCapsule(null);
            loadCapsules();
        }
    };

    const handleExport = () => {
        const data = JSON.stringify(capsules, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `secret-capsules-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                if (Array.isArray(imported)) {
                    let count = 0;
                    for (const c of imported) {
                        if (c.encryptedContent && c.iv && c.hmac) {
                            await api.capsules.create({
                                encryptedTitle: c.encryptedTitle || "",
                                encryptedContent: c.encryptedContent,
                                iv: c.iv,
                                salt: c.salt,
                                hmac: c.hmac,
                                size: c.size || 0
                            });
                            count++;
                        }
                    }
                    loadCapsules();
                    alert(`Successfully imported ${count} capsules.`);
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (err) {
                console.error(err);
                alert('Import failed: Invalid file or corrupted data.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen p-6 relative">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold neon-text tracking-wider">DASHBOARD</h1>
                    <p className="text-gray-400 text-sm mt-1">Welcome, Commander {user?.username}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="btn-neon text-xs py-2 px-3 flex items-center gap-2 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/10"
                        title="Backup Encrypted Capsules"
                    >
                        <Download className="w-4 h-4" />
                        BACKUP
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-neon text-xs py-2 px-3 flex items-center gap-2 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/10"
                        title="Restore Backup"
                    >
                        <Upload className="w-4 h-4" />
                        RESTORE
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        className="hidden"
                        accept=".json"
                    />
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <button
                        onClick={logout}
                        className="btn-neon flex items-center gap-2 text-sm py-2 px-4 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:shadow-none"
                    >
                        <LogOut className="w-4 h-4" />
                        DISCONNECT
                    </button>
                </div>
            </header>

            {/* Controls */}
            <div className="flex justify-between items-center mb-8">
                <div className="relative group w-64">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan" />
                    <input
                        type="text"
                        placeholder="Search (Locked)"
                        disabled
                        className="input-cyber pl-10 opacity-50 cursor-not-allowed"
                        title="Search is only available for unlocked content (Not implemented in this version)"
                    />
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="btn-neon bg-neon-purple/20 border-neon-purple/50 text-neon-purple hover:bg-neon-purple/30 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    NEW CAPSULE
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center text-gray-500 animate-pulse">Scanning storage...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {capsules.map(capsule => (
                        <CapsuleCard
                            key={capsule.id}
                            capsule={capsule}
                            onClick={() => setSelectedCapsule(capsule)}
                        />
                    ))}
                    {capsules.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                            No capsules found. Initialize a new secure storage unit.
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showCreate && (
                <CreateCapsuleModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); loadCapsules(); }}
                />
            )}

            {selectedCapsule && !viewData && (
                <UnlockModal
                    capsule={selectedCapsule}
                    onClose={() => setSelectedCapsule(null)}
                    onUnlock={handleUnlock}
                />
            )}

            {viewData && (
                <CapsuleViewer
                    data={viewData}
                    onClose={() => { setViewData(null); setSelectedCapsule(null); }}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
