import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { Capsule } from '@secret-capsule/types';
import CapsuleCard from '../components/CapsuleCard';
import CreateCapsuleModal from '../components/CreateCapsuleModal';
import UnlockModal from '../components/UnlockModal';
import CapsuleViewer from '../components/CapsuleViewer';
import SettingsModal from '../components/SettingsModal';
import { 
    Plus, LogOut, Search, Download, Upload, Settings, 
    LayoutGrid, Clock, Shield, X, Check,
    Database, Hash
} from 'lucide-react';
import { storage } from '../lib/storage';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
    const [capsules, setCapsules] = useState<Capsule[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
    const [viewData, setViewData] = useState<{ title: string; content: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'locked'>('all');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCapsules();
    }, []);

    const loadCapsules = async () => {
        try {
            setLoading(true);
            const localCapsules = await storage.getCapsules();
            setCapsules(localCapsules);

            const { data } = await api.capsules.getAll();
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

    const filteredCapsules = capsules.filter(capsule => {
        const query = searchQuery.toLowerCase();
        const date = new Date(capsule.createdAt).toLocaleDateString().toLowerCase();
        
        let matchesQuery = !query || date.includes(query) || capsule.id.includes(query);
        
        if (activeTab === 'recent') {
            const daysAgo = (Date.now() - new Date(capsule.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return matchesQuery && daysAgo < 7;
        }
        if (activeTab === 'locked') {
            return matchesQuery && capsule.unlockAt && new Date(capsule.unlockAt) > new Date();
        }
        
        return matchesQuery;
    });

    const handleUnlock = (data: { title: string; content: string }) => {
        setViewData(data);
    };

    const handleDelete = async () => {
        if (!selectedCapsule) return;
        if (confirm('Permanently delete this capsule? This action cannot be reversed.')) {
            await api.capsules.delete(selectedCapsule.id);
            await storage.deleteCapsule(selectedCapsule.id);
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
        a.download = `inkrypt-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                if (Array.isArray(imported)) {
                    for (const c of imported) {
                        await api.capsules.create(c);
                    }
                    loadCapsules();
                    alert('Import complete.');
                }
            } catch (err) {
                alert('Import failed.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex h-screen bg-inkrypt-main overflow-hidden">
            {/* Mobile Sidebar Toggle */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-primary-vibrant text-white rounded-full shadow-glow"
            >
                {isSidebarOpen ? <X /> : <Plus />}
            </button>

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 transition-transform duration-300 transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-primary-vibrant rounded-xl flex items-center justify-center text-white shadow-glow">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">Inkrypt</span>
                    </div>

                    <nav className="space-y-1.5 flex-1">
                        <div 
                            onClick={() => { setActiveTab('all'); setIsSidebarOpen(false); }}
                            className={`sidebar-link ${activeTab === 'all' ? 'active' : ''}`}
                        >
                            <LayoutGrid className="w-5 h-5" /> All Capsules
                        </div>
                        <div 
                            onClick={() => { setActiveTab('recent'); setIsSidebarOpen(false); }}
                            className={`sidebar-link ${activeTab === 'recent' ? 'active' : ''}`}
                        >
                            <Clock className="w-5 h-5" /> Recent
                        </div>
                        <div 
                            onClick={() => { setActiveTab('locked'); setIsSidebarOpen(false); }}
                            className={`sidebar-link ${activeTab === 'locked' ? 'active' : ''}`}
                        >
                            <Shield className="w-5 h-5" /> Time Locked
                        </div>
                        <div className="pt-4 pb-2 px-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</span>
                        </div>
                        <div onClick={handleExport} className="sidebar-link">
                            <Download className="w-5 h-5" /> Backup Data
                        </div>
                        <div onClick={() => fileInputRef.current?.click()} className="sidebar-link">
                            <Upload className="w-5 h-5" /> Restore
                        </div>
                    </nav>

                    <div className="mt-auto space-y-1.5 pt-6 border-t border-slate-50">
                        <div onClick={() => setShowSettings(true)} className="sidebar-link">
                            <Settings className="w-5 h-5" /> Settings
                        </div>
                        <div onClick={logout} className="sidebar-link text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                            <LogOut className="w-5 h-5" /> Sign Out
                        </div>
                        
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Database className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Storage Used</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div className="bg-primary-vibrant h-full w-[15%]" />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-2 block">12.4 MB / 100 MB</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
                <header className="h-20 bg-white/40 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-10">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-vibrant transition-colors" />
                            <input
                                type="text"
                                placeholder="Search capsules by date or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100/50 border-transparent focus:bg-white focus:border-primary-soft/30 rounded-full pl-11 pr-4 py-2.5 text-sm transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-slate-900">{user?.username}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Verified User</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-primary-vibrant to-accent-purple opacity-80" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                                    {activeTab === 'all' ? 'All Memories' : activeTab === 'recent' ? 'Recent Activity' : 'Locked Vaults'}
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    You have <span className="text-primary-vibrant">{capsules.length}</span> secure entries stored on this vault.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="btn-premium btn-primary px-8 h-12 shadow-glow hover:shadow-glow/50"
                            >
                                <Plus className="w-5 h-5" /> New Capsule
                            </button>
                        </div>

                        {/* Recent Stats Panels */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Hash className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-slate-900">{capsules.length}</span>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Total Capsules</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-slate-900">
                                        {capsules.filter(c => !c.unlockAt || new Date(c.unlockAt) <= new Date()).length}
                                    </span>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Available</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-slate-900">
                                        {capsules.filter(c => c.unlockAt && new Date(c.unlockAt) > new Date()).length}
                                    </span>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Vaulted</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-64 bg-white/60 rounded-3xl animate-pulse border border-slate-100"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-32">
                                    {filteredCapsules.map(capsule => (
                                        <CapsuleCard
                                            key={capsule.id}
                                            capsule={capsule}
                                            onClick={() => setSelectedCapsule(capsule)}
                                        />
                                    ))}
                                </div>

                                {filteredCapsules.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-40 text-center bg-white/30 rounded-[40px] border border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                            <Search className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">No capsules found</h3>
                                        <p className="text-slate-500 max-w-xs mt-2">Try adjusting your filters or search query.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            
            {showCreate && (
                <CreateCapsuleModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => { setShowCreate(false); loadCapsules(); }}
                />
            )}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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

