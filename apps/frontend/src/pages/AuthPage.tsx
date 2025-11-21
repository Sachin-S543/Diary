import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/signup';
            const payload = isLogin
                ? { identifier: email || username, password }
                : { email, username, password };

            const { data } = await api.post(endpoint, payload);
            login(data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-6 text-primary">
                    {isLogin ? 'Welcome Back' : 'Join Secret Capsule'}
                </h2>

                <div className="flex mb-6 bg-surface/50 rounded-lg p-1">
                    <button
                        className={`flex-1 py-2 rounded-md transition-all ${isLogin ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 py-2 rounded-md transition-all ${!isLogin ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                            <input
                                type="text"
                                className="input-field"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {isLogin ? 'Email or Username' : 'Email'}
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button type="submit" className="w-full btn-primary mt-4">
                        {isLogin ? 'Unlock Diary' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
