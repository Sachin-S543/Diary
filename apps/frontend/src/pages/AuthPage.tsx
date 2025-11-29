import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { Lock, User, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

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
                const { user } = await api.auth.signup({ email, username, password });
                login(user);
                navigate('/dashboard');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(99,102,241,0.15)_0px,transparent_50%),radial-gradient(at_100%_0%,rgba(236,72,153,0.15)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(6,182,212,0.15)_0px,transparent_50%),radial-gradient(at_0%_100%,rgba(139,92,246,0.15)_0px,transparent_50%)]"></div>

            <div className="glass-panel w-full max-w-md p-8 relative z-10 animate-scale-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-glass-md flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                        <Shield className="w-8 h-8 text-primary-vibrant" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Secret Capsule</h1>
                    <p className="text-slate-500 text-sm">Secure Digital Memory Storage</p>
                </div>

                <div className="flex mb-8 bg-slate-100/50 p-1 rounded-xl">
                    <button
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => { setIsLogin(true); setError(''); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => { setIsLogin(false); setError(''); }}
                    >
                        Create Account
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-vibrant transition-colors" />
                            <input
                                type="text"
                                className="input-premium pl-12"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-vibrant transition-colors" />
                        <input
                            type="text"
                            className="input-premium pl-12"
                            placeholder={isLogin ? "Email or Username" : "Email"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-vibrant transition-colors" />
                            <input
                                type="password"
                                className="input-premium pl-12"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {!isLogin && password && (
                            <div className="flex gap-1 h-1.5 mt-2 px-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-full transition-all duration-300 ${strength >= i
                                            ? (strength < 3 ? 'bg-rose-400' : strength < 4 ? 'bg-amber-400' : 'bg-emerald-400')
                                            : 'bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full btn-premium btn-primary justify-center group"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="animate-pulse">Processing...</span>
                        ) : (
                            <>
                                {isLogin ? 'Sign In' : 'Get Started'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
