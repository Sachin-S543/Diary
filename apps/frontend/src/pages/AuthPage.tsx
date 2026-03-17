/*
 * Inkrypt — Auth Page (Sign In / Sign Up with Email OTP)
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import {
    Lock, Mail, User, ArrowRight, AlertCircle,
    Shield, CheckCircle, RotateCcw, Eye, EyeOff
} from 'lucide-react';

type SignupStep = 'email' | 'otp' | 'details';
type Mode = 'login' | 'signup';

// ─── Reusable field ────────────────────────────────────────────────────────
function Field({
    icon, type, placeholder, value, onChange, autoFocus, rightElement,
}: {
    icon: React.ReactNode;
    type: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    autoFocus?: boolean;
    rightElement?: React.ReactNode;
}) {
    return (
        <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                {icon}
            </span>
            <input
                type={type}
                className="input-premium pl-11 pr-11 w-full"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                autoFocus={autoFocus}
            />
            {rightElement && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {rightElement}
                </span>
            )}
        </div>
    );
}

// ─── Password strength indicator ──────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
        password.length >= 12,
    ];
    const score = checks.filter(Boolean).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];

    if (!password) return null;
    return (
        <div className="mt-2">
            <div className="flex gap-1 h-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${score >= i ? colors[score] : 'bg-slate-200'}`} />
                ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">{labels[score]}</p>
        </div>
    );
}

// ─── OTP digit boxes ───────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

    return (
        <div className="flex gap-3 justify-center">
            {digits.map((d, i) => (
                <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={d}
                    pattern="[0-9]"
                    inputMode="numeric"
                    autoFocus={i === 0}
                    aria-label={`Digit ${i + 1}`}
                    onChange={e => {
                        const v = e.target.value.replace(/\D/g, '');
                        const newVal = value.split('');
                        newVal[i] = v;
                        onChange(newVal.join('').slice(0, 6));
                        if (v && i < 5) {
                            (e.target.nextSibling as HTMLInputElement)?.focus();
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Backspace' && !d && i > 0) {
                            (e.target as HTMLInputElement).previousSibling
                                && ((e.target as HTMLInputElement).previousSibling as HTMLInputElement).focus();
                            const newVal = value.split('');
                            newVal[i - 1] = '';
                            onChange(newVal.join(''));
                        }
                    }}
                    onPaste={e => {
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (pasted) { e.preventDefault(); onChange(pasted); }
                    }}
                    className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-colors outline-none
                        ${d ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}
                        focus:border-slate-700`}
                />
            ))}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
    const [signupStep, setSignupStep] = useState<SignupStep>('email');

    // Login fields
    const [identifier, setIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Signup fields
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);

    const navigate = useNavigate();
    const { login } = useAuthStore();

    // OTP resend cooldown timer
    useEffect(() => {
        if (otpCooldown <= 0) return;
        const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [otpCooldown]);

    const clear = () => { setError(''); setInfo(''); };

    // ── Login ──
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clear();
        setLoading(true);
        try {
            const { user } = await api.auth.login({ identifier, password: loginPassword });
            login(user);
            navigate('/app');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    // ── Signup Step 1: Send OTP ──
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        clear();
        setLoading(true);
        try {
            await api.auth.sendOtp(email);
            setSignupStep('otp');
            setOtpCooldown(60);
            setInfo('Check your email for a 6-digit verification code.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send code.');
        } finally {
            setLoading(false);
        }
    };

    // ── Signup Step 2: Verify OTP (advance to details) ──
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { setError('Enter all 6 digits.'); return; }
        // We don't call a separate verify endpoint — OTP is verified during signup
        setSignupStep('details');
        clear();
    };

    // ── Signup Step 3: Complete signup ──
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        clear();
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true);
        try {
            const { user } = await api.auth.signup({ email, username, password, otpCode: otp });
            login(user);
            navigate('/app');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Signup failed.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setSignupStep('email');
        clear();
        setEmail(''); setOtp(''); setUsername(''); setPassword('');
        setIdentifier(''); setLoginPassword('');
    };

    // ─── Render signup steps ───────────────────────────────────────────────
    const renderSignup = () => {
        if (signupStep === 'email') {
            return (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
                        <p className="text-sm text-slate-500 mt-1">We'll send a verification code to your email</p>
                    </div>
                    <Field
                        icon={<Mail className="w-4 h-4" />}
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={setEmail}
                        autoFocus
                    />
                    {error && <ErrorMsg message={error} />}
                    <SubmitButton loading={loading} label="Send verification code" icon={<ArrowRight className="w-4 h-4" />} />
                </form>
            );
        }

        if (signupStep === 'otp') {
            return (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Verify your email</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Enter the 6-digit code sent to <strong>{email}</strong>
                        </p>
                    </div>
                    <OtpInput value={otp} onChange={setOtp} />
                    {info && <p className="text-sm text-indigo-600 text-center">{info}</p>}
                    {error && <ErrorMsg message={error} />}
                    <SubmitButton loading={loading} label="Confirm code" icon={<ArrowRight className="w-4 h-4" />} disabled={otp.length !== 6} />
                    <div className="text-center text-sm text-slate-500">
                        Didn't receive it?{' '}
                        <button
                            type="button"
                            disabled={otpCooldown > 0}
                            onClick={handleSendOtp}
                            className="text-indigo-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : <><RotateCcw className="w-3 h-3" /> Resend</>}
                        </button>
                        {' · '}
                        <button type="button" onClick={() => setSignupStep('email')} className="text-slate-600 hover:underline">
                            Change email
                        </button>
                    </div>
                </form>
            );
        }

        // signupStep === 'details'
        return (
            <form onSubmit={handleSignup} className="space-y-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Complete your profile</h2>
                    <p className="text-sm text-slate-500 mt-1">Choose a username and login password</p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700 leading-relaxed">
                    <strong>Two passwords, one goal:</strong> Your <em>login password</em> (below) authenticates you to our server. 
                    Your <em>Diary Password</em> (set on first entry) is the encryption key — it never leaves your device.
                </div>

                <Field
                    icon={<User className="w-4 h-4" />}
                    type="text"
                    placeholder="Username (3–30 chars, letters/numbers)"
                    value={username}
                    onChange={setUsername}
                    autoFocus
                />
                <div>
                    <Field
                        icon={<Lock className="w-4 h-4" />}
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Login password (min 8 chars)"
                        value={password}
                        onChange={setPassword}
                        rightElement={
                            <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="text-slate-400 hover:text-slate-600">
                                {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        }
                    />
                    <PasswordStrength password={password} />
                </div>
                {error && <ErrorMsg message={error} />}
                <SubmitButton loading={loading} label="Create account" icon={<ArrowRight className="w-4 h-4" />} />
            </form>
        );
    };

    // ─── Login form ────────────────────────────────────────────────────────
    const renderLogin = () => (
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">Sign in to access your encrypted diary</p>
            </div>
            <Field
                icon={<Mail className="w-4 h-4" />}
                type="text"
                placeholder="Email or username"
                value={identifier}
                onChange={setIdentifier}
                autoFocus
            />
            <Field
                icon={<Lock className="w-4 h-4" />}
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="Login password"
                value={loginPassword}
                onChange={setLoginPassword}
                rightElement={
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="text-slate-400 hover:text-slate-600">
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                }
            />
            {error && <ErrorMsg message={error} />}
            <SubmitButton loading={loading} label="Sign in" icon={<ArrowRight className="w-4 h-4" />} />
        </form>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Inkrypt</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    {/* Mode tabs */}
                    <div className="flex mb-8 bg-slate-50 p-1 rounded-xl">
                        {(['login', 'signup'] as Mode[]).map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => switchMode(m)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {m === 'login' ? 'Sign in' : 'Create account'}
                            </button>
                        ))}
                    </div>

                    {mode === 'login' ? renderLogin() : renderSignup()}
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Open source · AGPLv3 ·{' '}
                    <a href="https://github.com/Sachin-S543/Diary" className="hover:text-slate-600 underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">GitHub</a>
                </p>
            </div>
        </div>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function ErrorMsg({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {message}
        </div>
    );
}

function SubmitButton({ loading, label, icon, disabled }: { loading: boolean; label: string; icon: React.ReactNode; disabled?: boolean }) {
    return (
        <button
            type="submit"
            disabled={loading || disabled}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
            {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : icon}
            {loading ? 'Please wait...' : label}
        </button>
    );
}
