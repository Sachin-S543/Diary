import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { Lock, User, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const getStrength = (pass: string) => {
        let s = 0;
        if (pass.length >= 8) s++;
        if (pass.length >= 12) s++;
        if (/[A-Z]/.test(pass)) s++;
        if (/[0-9]/.test(pass)) s++;
        if (/[^A-Za-z0-9]/.test(pass)) s++;
        return s;
    };

    const strength = getStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const { user } = await api.auth.login({ identifier: email, password });
                login(user);
                navigate('/dashboard');
            } else {
                // No password strength requirement - user can choose any password
                const { user } = await api.auth.signup({ email, username, password });
                login(user);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-neon-purple/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-cyan/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

            <div className="glass-panel w-full max-w-md p-8 relative z-10 border-t border-l border-white/10 shadow-neon-purple/20">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold neon-text mb-2 tracking-wider">SECRET CAPSULE</h1>
                    <p className="text-gray-400 text-sm uppercase tracking-widest">Secure Digital Memory Storage</p>
                </div>

                <div className="flex mb-8 bg-black/40 rounded-lg p-1 border border-white/5">
                    <button
                        className={`flex-1 py-2 rounded-md transition-all font-medium ${isLogin ? 'bg-neon-purple/20 text-neon-purple shadow-[0_0_10px_rgba(176,38,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => { setIsLogin(true); setError(''); }}
                    >
                        ACCESS
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-md transition-all font-medium ${!isLogin ? 'bg-neon-cyan/20 text-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => { setIsLogin(false); setError(''); }}
                    >
                        INITIALIZE
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                className="input-cyber pl-12 pr-4"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                        <input
                            type="text"
                            className="input-cyber pl-12 pr-4"
                            placeholder={isLogin ? "Email or Username" : "Email"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="password"
                                className="input-cyber pl-12 pr-4"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {!isLogin && password && (
                            <div className="flex gap-1 h-1 mt-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-full transition-all duration-300 ${strength >= i
                                            ? (strength < 3 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-green-500')
                                            : 'bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full btn-neon flex items-center justify-center gap-2 group"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="animate-pulse">PROCESSING...</span>
                        ) : (
                            <>
                                {isLogin ? 'DECRYPT SESSION' : 'ESTABLISH IDENTITY'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
