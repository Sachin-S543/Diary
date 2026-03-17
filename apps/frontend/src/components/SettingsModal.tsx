/*
 * Secret Capsule (Diary)
 * Copyright (C) 2025 Sachin-S543
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public 
 * License along with this program. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useEffect } from 'react';
import { X, Fingerprint, Settings, AlertCircle } from 'lucide-react';
import { BIOMETRIC_CREDENTIAL_ID_KEY, isBiometricUnlockSupported, registerBiometric } from '../auth/biometricUnlock';
import { useAuthStore } from '../store/authStore';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
    const { user } = useAuthStore();
    const [supported, setSupported] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        isBiometricUnlockSupported().then(setSupported).catch(console.error);
        if (localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY)) {
            setEnabled(true);
        }
    }, []);

    const handleToggleBiometric = async () => {
        if (enabled) {
             localStorage.removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
             setEnabled(false);
             return;
        }

        if (!user) return;
        
        setError('');
        setLoading(true);
        try {
            await registerBiometric(user.username);
            setEnabled(true);
        } catch (err: any) {
            setError(err.message || "Failed to register biometric");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md bg-white rounded-3xl p-8 relative animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
                        <p className="text-sm text-slate-500">Manage your preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Fingerprint className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Biometric Unlock</h3>
                                <p className="text-xs text-slate-500">
                                    {supported ? "Use Windows Hello, Touch ID, etc." : "Not supported on this device"}
                                </p>
                            </div>
                        </div>
                        <button
                            disabled={!supported || loading}
                            onClick={handleToggleBiometric}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                enabled ? 'bg-indigo-600' : 'bg-slate-300'
                            } ${(!supported || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span 
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    enabled ? 'translate-x-6' : 'translate-x-1'
                                }`} 
                            />
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
