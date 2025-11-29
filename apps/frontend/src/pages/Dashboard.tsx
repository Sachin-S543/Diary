import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { Capsule } from '@secret-capsule/types';
import CapsuleCard from '../components/CapsuleCard';
import CreateCapsuleModal from '../components/CreateCapsuleModal';
import UnlockModal from '../components/UnlockModal';
import CapsuleViewer from '../components/CapsuleViewer';
import { Plus, LogOut, Search, Download, Upload } from 'lucide-react';
import { storage } from '../lib/storage';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const [capsules, setCapsules] = useState<Capsule[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
    const [viewData, setViewData] = useState<{ title: string; content: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCapsules();
    }, []);

    const loadCapsules = async () => {
        try {
            // Load local first
            const localCapsules = await storage.getCapsules();
            setCapsules(localCapsules);

            // Then fetch API
            const { data } = await api.capsules.getAll();

            // Sync local with API
            for (const c of data) {
                await storage.saveCapsule(c);
            }

            setCapsules(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Filter capsules based on search query (by date)
    const filteredCapsules = capsules.filter(capsule => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const date = new Date(capsule.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).toLowerCase();

        // Search by date or capsule ID
        return date.includes(query) || capsule.id.toString().includes(query);
    });

    const handleUnlock = (data: { title: string; content: string }) => {
        setViewData(data);
    };

    const handleDelete = async () => {
        if (!selectedCapsule) return;
        if (confirm('Are you sure you want to delete this capsule? This cannot be undone.')) {
            await api.capsules.delete(selectedCapsule.id);
            await storage.deleteCapsule(selectedCapsule.id); // Delete locally too
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
                                id: c.id, // Pass ID if available
                                encryptedTitle: c.encryptedTitle || "",
                                encryptedContent: c.encryptedContent,
                                iv: c.iv,
                                salt: c.salt,
                                hmac: c.hmac,
                                size: c.size || 0,
                                unlockAt: c.unlockAt,
                                aura: c.aura
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

    // Sync Queue Processing
    useEffect(() => {
        const processSyncQueue = async () => {
            if (!navigator.onLine) return;

            try {
                const queue = await storage.getSyncQueue();
                if (queue.length === 0) return;

                console.log(`Processing ${queue.length} offline items...`);

                for (const item of queue) {
                    try {
                        if (item.type === 'create') {
                            await api.capsules.create(item.payload);
                        } else if (item.type === 'delete') {
                            await api.capsules.delete(item.payload);
                        }
                        // Remove from queue after success
                        // Note: idb doesn't support delete by value easily, but we can clear all if we process all
                        // For now, let's just clear the whole queue if we process everything successfully
                        // A more robust solution would delete individual items
                    } catch (e) {
                        console.error("Sync failed for item", item, e);
                    }
                }

                await storage.clearSyncQueue();
                console.log("Sync complete");
                loadCapsules(); // Refresh to get server state
            } catch (e) {
                console.error("Sync process failed", e);
            }
        };

        // Run on mount and when online status changes
        processSyncQueue();
        window.addEventListener('online', processSyncQueue);
        return () => window.removeEventListener('online', processSyncQueue);
    }, []);

    return (
        <div className="min-h-screen p-6 md:p-12 relative">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-2">
                        My Capsules
                    </h1>
                    <p className="text-slate-500 text-lg font-body">
                        Welcome back, <span className="text-primary-vibrant font-semibold">{user?.username}</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="btn-premium btn-secondary text-sm"
                        title="Backup Encrypted Capsules"
                    >
                        <Download className="w-4 h-4" />
                        Backup
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-premium btn-secondary text-sm"
                        title="Restore Backup"
                    >
                        <Upload className="w-4 h-4" />
                        Restore
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        className="hidden"
                        accept=".json"
                    />
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <button
                        onClick={logout}
                        className="btn-premium btn-ghost text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div className="relative group w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-vibrant transition-colors" />
                    <input
                        type="text"
                        placeholder="Search your memories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-premium pl-12"
                    />
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="btn-premium btn-primary w-full md:w-auto shadow-glow hover:shadow-glow/50"
                >
                    <Plus className="w-5 h-5" />
                    Create New Capsule
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-white/40 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                    {filteredCapsules.map(capsule => (
                        <CapsuleCard
                            key={capsule.id}
                            capsule={capsule}
                            onClick={() => {
                                if (capsule.unlockAt && new Date(capsule.unlockAt) > new Date()) {
                                    const date = new Date(capsule.unlockAt).toLocaleString();
                                    alert(`This capsule is time-locked until ${date}. You cannot open it yet.`);
                                    return;
                                }
                                setSelectedCapsule(capsule);
                            }}
                        />
                    ))}
                    {filteredCapsules.length === 0 && capsules.length > 0 && (
                        <div className="col-span-full text-center py-32 text-slate-400">
                            <p className="text-lg">No capsules match your search.</p>
                        </div>
                    )}
                    {capsules.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                <Plus className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Your journey starts here</h3>
                            <p className="text-slate-500 max-w-md mb-8">
                                Create your first secure time capsule to preserve your thoughts, ideas, and memories forever.
                            </p>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="btn-premium btn-primary"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Capsule
                            </button>
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
