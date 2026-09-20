/*
 * Inkrypt — Public Landing Page
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Shield, Key, Server, Eye, EyeOff,
    Download, ChevronDown, Github,
    RefreshCw, Fingerprint, Database,
    ArrowRight
} from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────

function NavBar() {
    const [open, setOpen] = useState(false);
    return (
        <nav className="fixed top-4 inset-x-4 md:inset-x-auto md:top-6 md:left-1/2 md:-translate-x-1/2 z-50 md:w-[800px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="px-6 h-14 flex items-center justify-between">
                <a href="#top" className="flex items-center gap-2.5 group">
                    <InkryptLogo size={28} />
                    <span className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">Inkrypt</span>
                </a>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                    <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                    <a href="#security" className="hover:text-white transition-colors">Security</a>
                    <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link to="/auth" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log in</Link>
                    <Link
                        to="/auth?mode=signup"
                        className="text-sm font-semibold px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button className="md:hidden p-2 text-slate-300 hover:text-white" onClick={() => setOpen(!open)} aria-label="Menu">
                    <div className={`w-5 h-0.5 bg-current mb-1.5 transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
                    <div className={`w-5 h-0.5 bg-current mb-1.5 transition-all ${open ? 'opacity-0' : ''}`} />
                    <div className={`w-5 h-0.5 bg-current transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="md:hidden border-t border-white/10 bg-slate-900/90 backdrop-blur-3xl px-6 py-6 space-y-4 rounded-b-2xl absolute top-full left-0 right-0 mt-2 shadow-2xl"
                    >
                        {['#how-it-works', '#security', '#recovery', '#faq'].map(h => (
                            <a key={h} href={h} onClick={() => setOpen(false)} className="block text-base font-medium text-slate-300 hover:text-white">
                                {h.replace('#', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </a>
                        ))}
                        <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                            <Link to="/auth" className="text-base font-medium text-slate-300 py-2 text-center" onClick={() => setOpen(false)}>Log in</Link>
                            <Link to="/auth?mode=signup" className="text-base font-semibold text-center py-3 bg-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)]" onClick={() => setOpen(false)}>
                                Get Started Free
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function InkryptLogo({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Inkrypt logo">
            <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
            {/* Lock body */}
            <rect x="12" y="20" width="16" height="12" rx="3" fill="#ffffff" />
            {/* Lock shackle */}
            <path d="M15 20V16a5 5 0 0 1 10 0v4" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Keyhole */}
            <circle cx="20" cy="25" r="2" fill="#0f172a" />
            <rect x="19" y="25" width="2" height="3" rx="1" fill="#0f172a" />
            {/* Ink drop accent */}
            <circle cx="30" cy="11" r="3" fill="#10b981" />
            <path d="M30 8.5 L30 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
            <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e1b4b" />
                    <stop offset="1" stopColor="#312e81" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function Hero() {
    return (
        <section id="top" className="relative pt-40 pb-32 px-6 text-center overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_80%)]" />
            </div>

            <div className="max-w-4xl mx-auto z-10 relative">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-full text-slate-300 text-xs font-semibold mb-8 uppercase tracking-widest"
                >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Digital Bunker Architecture
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6"
                >
                    Your thoughts.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                        Fully encrypted.
                    </span><br />
                    Always yours.
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-body"
                >
                    Inkrypt is a client-side encrypted personal diary. Your entries are encrypted on your device before being synchronized. Only you possess the decryption keys.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        to="/auth?mode=signup"
                        className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group"
                    >
                        Start Encrypted Diary
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm border border-slate-800"
                    >
                        How It Works
                    </a>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-widest"
                >
                    Open Source (AGPLv3) • Zero Tracking • Trustless
                </motion.p>
            </div>
        </section>
    );
}

function FeaturesGrid() {
    const features = [
        {
            icon: <Shield className="w-6 h-6 text-indigo-400" />,
            title: 'Vault Master Key Architecture',
            description: 'Your diary entries are protected using AES-256 GCM envelope encryption under a 256-bit Vault Master Key (VMK).',
        },
        {
            icon: <Key className="w-6 h-6 text-emerald-400" />,
            title: 'Dual-Wrapped VMK',
            description: 'Your VMK is wrapped by both your Diary Password and an independent 46-character Vault Recovery Key.',
        },
        {
            icon: <Lock className="w-6 h-6 text-indigo-400" />,
            title: 'Argon2id Key Derivation',
            description: 'Wrapping keys are derived locally using Argon2id with dedicated salt and 64MB memory cost.',
        },
        {
            icon: <Server className="w-6 h-6 text-emerald-400" />,
            title: 'Client-Side Encrypted Sync',
            description: 'PostgreSQL and Google Drive store only encrypted vault headers and encrypted capsule blobs.',
        },
    ];

    return (
        <section id="features" className="py-24 px-6 relative z-10 bg-slate-950/50">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6">
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-white mb-2 text-lg">{f.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-body">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    const steps = [
        {
            icon: <Key className="w-6 h-6 text-indigo-400" />,
            title: '1. Vault Initialization',
            description: 'Your browser generates a 256-bit VMK and dual-wraps it with your Diary Password and a 46-character Vault Recovery Key.',
        },
        {
            icon: <Lock className="w-6 h-6 text-emerald-400" />,
            title: '2. Local Envelope Encryption',
            description: 'Each entry is encrypted locally under a per-capsule key wrapped by your VMK before leaving client memory.',
        },
        {
            icon: <Database className="w-6 h-6 text-slate-300" />,
            title: '3. Encrypted Synchronization',
            description: 'Encrypted capsule blobs are synchronized to PostgreSQL and optional Google Drive appDataFolder.',
        },
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 relative z-10 bg-slate-950">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">The Cryptography Loop</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Client-side envelope encryption means your encryption keys remain on your device. All cryptographic operations take place locally.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {steps.map((step, i) => (
                        <div key={i} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:bg-slate-900 transition-colors hover:border-white/10 group">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/5 group-hover:ring-indigo-500/30 transition-all shadow-lg">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                            <p className="text-slate-400 leading-relaxed font-body">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SecuritySection() {
    const protections = [
        {
            icon: <Shield className="w-5 h-5 text-indigo-400" />,
            title: 'Argon2id Key Derivation',
            description: 'Your password is hammered with 64MB of memory cost and 3 iterations to derive a 256-bit key, severely punishing ASIC and GPU brute-force attacks.',
        },
        {
            icon: <Lock className="w-5 h-5 text-emerald-400" />,
            title: 'AES-GCM Authenticated Encryption',
            description: 'Every entry is encrypted with a unique 12-byte IV and tied with a MAC. An attacker cannot tamper with or silently modify your ciphertext.',
        },
        {
            icon: <EyeOff className="w-5 h-5 text-slate-300" />,
            title: '4 KB Padding (ISO/IEC 7816-4)',
            description: 'We pad all entries to 4KB boundaries before encryption. An adversary analyzing network traffic cannot guess the content based on block size.',
        },
        {
            icon: <Fingerprint className="w-5 h-5 text-indigo-400" />,
            title: 'WebAuthn Hardware Unlock',
            description: 'Unlock your vault using Windows Hello, Touch ID, or FaceID. True hardware-backed key protection using the WebAuthn PRF extension.',
        },
        {
            icon: <Database className="w-5 h-5 text-emerald-400" />,
            title: 'Local Encrypted Cache',
            description: 'The local IndexedDB cache stores encrypted V3 vault headers and capsule blobs. Plaintext keys are never persisted.',
        },
        {
            icon: <Eye className="w-5 h-5 text-slate-300" />,
            title: 'Ephemeral Key Architecture',
            description: 'Derived keys exist solely in memory. They are never committed to localStorage, sessionStorage, or cookies. Close the tab, the key is destroyed.',
        },
    ];

    return (
        <section id="security" className="py-24 px-6 bg-[#020617] relative">
            <div className="max-w-6xl mx-auto">
                <div className="mb-16 md:flex justify-between items-end">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-500/20">
                            <Shield className="w-3.5 h-3.5" /> Threat Model
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white">Military-grade isn't a buzzword here.</h2>
                    </div>
                    <p className="text-slate-400 font-body max-w-sm mt-6 md:mt-0">
                        We use globally audited, open standards to protect your thoughts against sophisticated adversaries.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {protections.map((p, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mb-5">
                                {p.icon}
                            </div>
                            <h3 className="font-bold text-white mb-3">{p.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-body">{p.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function RecoverySection() {
    return (
        <section id="recovery" className="py-24 px-6 relative overflow-hidden bg-slate-900">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
            
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="bg-slate-950 border border-indigo-500/20 rounded-[40px] p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
                    
                    <Key className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Absolute Data Sovereignty</h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 font-body">
                        When you initialize your vault, we provide a 46-character <strong>Vault Recovery Key</strong>. 
                        Store it safely. If you lose your Diary Password <em>and</em> your Vault Recovery Key, your entries are cryptographically lost forever. We cannot reset it.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 text-left">
                        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                            <Download className="w-6 h-6 text-slate-400 mb-4" />
                            <h3 className="text-white font-bold mb-2">Portable Backups</h3>
                            <p className="text-sm text-slate-400 font-body">Download your encrypted blobs as a JSON file anytime. Import them into any running Inkrypt instance.</p>
                        </div>
                        <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6">
                            <RefreshCw className="w-6 h-6 text-slate-400 mb-4" />
                            <h3 className="text-white font-bold mb-2">Password Rotation</h3>
                            <p className="text-sm text-slate-400 font-body">Use your Vault Recovery Key to seamlessly re-encrypt your VMK wrapper with a new Diary Password if compromised.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FAQ() {
    const items = [
        {
            q: 'Is Inkrypt really free?',
            a: 'Yes. Inkrypt is entirely free and open source. If you want maximum privacy, you can clone our GitHub repository and self-host the entire stack on your own hardware.',
        },
        {
            q: 'Can Inkrypt read my diary if compelled by law?',
            a: 'No. The architecture uses client-side envelope encryption. Without your local Diary Password or Vault Recovery Key, your vault payloads remain encrypted ciphertext. We cannot decrypt what we do not have the keys for.',
        },
        {
            q: 'Why do I have two passwords in the app?',
            a: 'Your Account Password (verified by our server using bcrypt) manages your subscription and access. Your Diary Password runs purely in your browser to derive your AES-GCM encryption key. The server never observes the second one.',
        },
        {
            q: 'What happens if I lose my internet connection?',
            a: 'Your vault caches data in an encrypted IndexedDB on your device. You can write securely offline; Inkrypt will seamlessly sync the encrypted blobs when you reconnect.',
        },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 px-6 bg-slate-950">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-black text-white text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left text-base font-bold text-white"
                            >
                                {item.q}
                                <ChevronDown className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180 text-indigo-400' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-6 text-slate-400 font-body"
                                    >
                                        <div className="pb-6">{item.a}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTA() {
    return (
        <section className="py-32 px-6 bg-slate-950 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="max-w-2xl mx-auto relative z-10">
                <div className="flex justify-center mb-8">
                    <InkryptLogo size={56} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Digital Freedom Awaits.</h2>
                <p className="text-xl text-slate-400 mb-10 font-body">
                    Claim your private space today. No credit cards, no tracking—just math and your thoughts.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/auth?mode=signup"
                        className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-colors text-sm shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                    >
                        Create Your Free Account
                    </Link>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const appName = (import.meta.env as unknown as Record<string, string>)['VITE_APP_NAME'] || 'Inkrypt';
    return (
        <footer className="py-8 px-6 border-t border-white/5 bg-[#020617]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                    <InkryptLogo size={24} />
                    <span className="text-sm font-bold text-slate-300 tracking-wider uppercase">{appName}</span>
                </div>
                <nav className="flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    <a href="#security" className="hover:text-indigo-400 transition-colors">Security</a>
                    <a href="#recovery" className="hover:text-indigo-400 transition-colors">Recovery</a>
                    <a href="https://github.com/Sachin-S543/Diary" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5"><Github className="w-3.5 h-3.5"/> GitHub</a>
                    <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">AGPLv3 License</a>
                </nav>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                    © {new Date().getFullYear()} Sachin-S543
                </p>
            </div>
        </footer>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            <NavBar />
            <main>
                <Hero />
                <HowItWorks />
                <FeaturesGrid />
                <SecuritySection />
                <RecoverySection />
                <FAQ />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
