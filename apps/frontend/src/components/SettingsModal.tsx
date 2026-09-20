/*
 * Inkrypt — Settings & Session Management Modal
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useState, useEffect } from 'react';
import { X, Settings, Shield, Laptop, Trash2, Cloud, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { GoogleDriveAdapter } from '../lib/googleDrive';
import { UserSession } from '@secret-capsule/types';

type Tab = 'account' | 'sessions' | 'gdrive';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('account');
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const gdriveAdapter = new GoogleDriveAdapter();
    const gdriveConfig = gdriveAdapter.getConfig();

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const data = await api.auth.getSessions();
            setSessions(data || []);
        } catch {
            setError('Failed to load active sessions.');
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'sessions') {
            fetchSessions();
        }
    }, [activeTab]);

    const handleRevokeSession = async (sessionId: string, isCurrent?: boolean) => {
        try {
            await api.auth.revokeSession(sessionId);
            if (isCurrent) {
                logout();
                onClose();
            } else {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                setInfo('Session revoked.');
            }
        } catch {
            setError('Failed to revoke session.');
        }
    };

    const handleRevokeAllOther = async () => {
        try {
            await api.auth.revokeAllOtherSessions();
            setSessions(prev => prev.filter(s => s.isCurrent));
            setInfo('All other sessions revoked.');
        } catch {
            setError('Failed to revoke sessions.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-xl bg-white rounded-3xl p-8 relative animate-scale-in max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
                        <p className="text-sm text-slate-500">Security, active sessions & storage</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 mb-6 gap-6 text-sm font-semibold">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`pb-3 border-b-2 transition-all ${activeTab === 'account' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Account
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`pb-3 border-b-2 transition-all ${activeTab === 'sessions' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Active Sessions
                    </button>
                    <button
                        onClick={() => setActiveTab('gdrive')}
                        className={`pb-3 border-b-2 transition-all ${activeTab === 'gdrive' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Google Drive Sync
                    </button>
                </div>

                {info && <p className="text-xs text-indigo-600 bg-indigo-50 p-2.5 rounded-xl mb-4">{info}</p>}
                {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl mb-4">{error}</p>}

                {/* Account Tab */}
                {activeTab === 'account' && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Signed In As</p>
                            <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>Client-Side Envelope Encryption Active. Your Vault Master Key (VMK) is unwrapped locally in client memory.</span>
                        </div>
                    </div>
                )}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-900">Active Login Sessions</h3>
                            {sessions.length > 1 && (
                                <button
                                    onClick={handleRevokeAllOther}
                                    className="text-xs text-red-600 font-semibold hover:underline"
                                >
                                    Logout Other Devices
                                </button>
                            )}
                        </div>

                        {loadingSessions ? (
                            <p className="text-xs text-slate-400 text-center py-6">Loading sessions...</p>
                        ) : sessions.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">No active session details found.</p>
                        ) : (
                            sessions.map(s => (
                                <div key={s.id} className="border border-slate-100 p-4 rounded-2xl flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-200 text-slate-700 rounded-xl">
                                            <Laptop className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{s.userAgent}</p>
                                                {s.isCurrent && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Current Device</span>}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">IP: {s.ipAddress} · Last Active: {new Date(s.lastActiveAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRevokeSession(s.id, s.isCurrent)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-2"
                                        title="Revoke session"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Google Drive Tab */}
                {activeTab === 'gdrive' && (
                    <div className="space-y-4">
                        <div className="border border-slate-100 p-5 rounded-2xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Cloud className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Google Drive Encrypted Storage</h4>
                                        <p className="text-xs text-slate-500">Sync encrypted vault to your private appDataFolder</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${gdriveConfig.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {gdriveConfig.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>

                            {gdriveConfig.connected ? (
                                <div className="space-y-3 pt-2">
                                    <p className="text-xs text-slate-500">Last Synced: {gdriveConfig.lastSyncedAt ? new Date(gdriveConfig.lastSyncedAt).toLocaleString() : 'Never'}</p>
                                    <button
                                        onClick={() => gdriveAdapter.disconnect()}
                                        className="w-full py-2.5 bg-red-50 text-red-600 font-semibold text-xs rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        Disconnect Google Drive
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 leading-relaxed pt-2">
                                    Connect Google Drive in Onboarding or Settings to auto-sync your AES-256 encrypted vault payloads. Google only receives ciphertext.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

