/*
 * Inkrypt — Public Landing Page
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Lock, Shield, Key, Server, Eye, EyeOff,
    Download, ChevronDown, Github,
    RefreshCw, Fingerprint, Database, FileText
} from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────

function NavBar() {
    const [open, setOpen] = useState(false);
    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <a href="#top" className="flex items-center gap-2.5">
                    <InkryptLogo size={32} />
                    <span className="text-lg font-bold text-slate-900 tracking-tight">Inkrypt</span>
                </a>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
                    <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
                    <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
                    <a href="#recovery" className="hover:text-slate-900 transition-colors">Recovery</a>
                    <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
                    <a
                        href="https://github.com/Sachin-S543/Diary"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                    >
                        <Github className="w-4 h-4" /> Source
                    </a>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <Link to="/auth" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Sign in</Link>
                    <Link
                        to="/auth?mode=signup"
                        className="text-sm font-semibold px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Get started free
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
                    <div className="w-5 h-0.5 bg-slate-700 mb-1 transition-all" />
                    <div className="w-5 h-0.5 bg-slate-700 mb-1 transition-all" />
                    <div className="w-5 h-0.5 bg-slate-700 transition-all" />
                </button>
            </div>

            {open && (
                <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3">
                    {['#how-it-works', '#security', '#recovery', '#faq'].map(h => (
                        <a key={h} href={h} onClick={() => setOpen(false)} className="block text-sm text-slate-600 hover:text-slate-900">
                            {h.replace('#', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </a>
                    ))}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        <Link to="/auth" className="text-sm font-medium text-slate-700 text-center py-2">Sign in</Link>
                        <Link to="/auth?mode=signup" className="text-sm font-semibold text-center py-2 bg-slate-900 text-white rounded-lg">
                            Get started free
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

function InkryptLogo({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Inkrypt logo">
            <rect width="40" height="40" rx="10" fill="#0f172a" />
            {/* Lock body */}
            <rect x="12" y="20" width="16" height="12" rx="3" fill="#e2e8f0" />
            {/* Lock shackle */}
            <path d="M15 20V16a5 5 0 0 1 10 0v4" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Keyhole */}
            <circle cx="20" cy="25" r="2" fill="#0f172a" />
            <rect x="19" y="25" width="2" height="3" rx="1" fill="#0f172a" />
            {/* Ink drop accent */}
            <circle cx="30" cy="11" r="3" fill="#6366f1" />
            <path d="M30 8.5 L30 5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function Hero() {
    return (
        <section id="top" className="pt-20 pb-24 px-6 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold mb-8 uppercase tracking-wider">
                <Lock className="w-3 h-3" /> Zero-knowledge · End-to-end encrypted · Open source
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                Your diary.<br />
                <span className="text-indigo-600">Fully encrypted.</span><br />
                Always yours.
            </h1>

            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                Inkrypt is a private, end-to-end encrypted diary. Your entries are scrambled on your device before anything touches a server — nobody, not even us, can read your words.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    to="/auth?mode=signup"
                    className="px-8 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-sm shadow-lg"
                >
                    Start writing — it's free
                </Link>
                <a
                    href="#how-it-works"
                    className="px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                >
                    See how it works
                </a>
            </div>

            <p className="mt-6 text-xs text-slate-400">
                Open source under AGPLv3 · No ads · No tracking · No analytics
            </p>
        </section>
    );
}

function HowItWorks() {
    const steps = [
        {
            icon: <Key className="w-6 h-6 text-indigo-600" />,
            title: 'You set a Diary Password',
            description:
                'When you create an account, you choose a Diary Password that never leaves your device. This is separate from your login password — the server never sees it.',
        },
        {
            icon: <Lock className="w-6 h-6 text-indigo-600" />,
            title: 'Your device encrypts everything',
            description:
                'Before any entry is saved, your browser runs Argon2id to derive a 256-bit AES-GCM encryption key from your Diary Password. The entry is encrypted locally, then uploaded as an unreadable blob.',
        },
        {
            icon: <Server className="w-6 h-6 text-indigo-600" />,
            title: 'The server only stores ciphertext',
            description:
                'Our server stores your encrypted data and your login credentials (bcrypt hash). It has zero access to your Diary Password or any decryption key. Even a full database breach exposes nothing readable.',
        },
    ];

    return (
        <section id="how-it-works" className="py-20 px-6 bg-slate-50 border-y border-slate-100">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">How it works</h2>
                <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">
                    Three simple steps — all the hard crypto happens silently in the background.
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                                {step.icon}
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Step {i + 1}</span>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
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
            icon: <Shield className="w-5 h-5" />,
            title: 'Argon2id Key Derivation',
            description: 'Your Diary Password is never used directly. Argon2id (64 MB memory cost, 3 iterations) derives a strong 256-bit key. This makes brute-force attacks — including GPU and ASIC attacks — extremely costly.',
        },
        {
            icon: <Lock className="w-5 h-5" />,
            title: 'AES-GCM 256-bit Encryption',
            description: 'Every entry is encrypted with AES-GCM using a unique 12-byte random IV. AES-GCM provides authenticated encryption, meaning any tampering is detected before decryption.',
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: '4 KB Padding — Size Anonymity',
            description: 'All entries are padded to 4 KB boundaries (ISO/IEC 7816-4) before encryption. An attacker watching the database cannot guess entry length or content type from blob size.',
        },
        {
            icon: <Fingerprint className="w-5 h-5" />,
            title: 'WebAuthn Biometric Unlock',
            description: 'Enable Windows Hello, Touch ID, or Face ID to unlock your vault without typing your Diary Password. Hardware-backed key protection via the WebAuthn PRF extension.',
        },
        {
            icon: <Database className="w-5 h-5" />,
            title: 'Encrypted Local Cache',
            description: 'The browser IndexedDB cache is fully encrypted — every record, setting, and metadata item is encrypted with your derived key before being written to disk.',
        },
        {
            icon: <EyeOff className="w-5 h-5" />,
            title: 'Zero-Knowledge Architecture',
            description: 'Your Diary Password and all derived keys exist only in memory during an active session. They are never stored in localStorage, sessionStorage, cookies, or any persistent storage.',
        },
    ];

    return (
        <section id="security" className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Security, explained plainly</h2>
                <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">
                    We use well-established open standards — nothing custom, nothing clever. Here's exactly what protects your data.
                </p>

                <div className="grid md:grid-cols-2 gap-5">
                    {protections.map((p, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all">
                            <div className="w-9 h-9 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                {p.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1 text-sm">{p.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* License callout */}
                <div className="mt-12 p-6 rounded-2xl bg-slate-900 text-white">
                    <div className="flex items-start gap-4">
                        <Github className="w-6 h-6 flex-shrink-0 mt-0.5 text-slate-400" />
                        <div>
                            <h3 className="font-semibold mb-1">Fully open source — AGPLv3</h3>
                            <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                Inkrypt is licensed under the GNU Affero General Public License v3. Every line of code is public. 
                                You can audit it, self-host it, or fork it. The AGPLv3 ensures that any network-accessible modifications must also be open source.
                            </p>
                            <a
                                href="https://github.com/Sachin-S543/Diary"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-white underline-offset-4 hover:underline"
                            >
                                <Github className="w-4 h-4" /> View source on GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function RecoverySection() {
    const steps = [
        {
            icon: <Key className="w-5 h-5 text-amber-600" />,
            title: 'Save your Recovery Key',
            description: 'When you create your first entry, Inkrypt generates a Recovery Key — a Base64 representation of your derived encryption key. Copy it and store it somewhere safe (password manager, printed paper in a secure place). This is shown only once.',
        },
        {
            icon: <RefreshCw className="w-5 h-5 text-amber-600" />,
            title: 'Lost your Diary Password?',
            description: 'If you forget your Diary Password, go to Settings → Recovery. Enter your Recovery Key and set a new Diary Password. Inkrypt will re-encrypt all your entries with the new key.',
        },
        {
            icon: <Download className="w-5 h-5 text-amber-600" />,
            title: 'Export & Backup',
            description: 'Use Dashboard → Backup to download all your encrypted entries as a JSON file. Even your backups are encrypted — they\'re useless without your Diary Password or Recovery Key. Restore anytime via Dashboard → Restore.',
        },
        {
            icon: <FileText className="w-5 h-5 text-amber-600" />,
            title: 'Account loss (server side)',
            description: 'If your account is deleted from the server, your local IndexedDB cache still contains all encrypted data. You can re-create an account, import your backup file, and all entries will be accessible again using your Diary Password.',
        },
    ];

    return (
        <section id="recovery" className="py-20 px-6 bg-amber-50 border-y border-amber-100">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Recovery & Backup</h2>
                <p className="text-slate-600 text-center mb-4 max-w-xl mx-auto">
                    Because we can't read your data, we can't recover it for you. Here's how to make sure you never lose access.
                </p>
                <div className="bg-amber-100 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800 text-center mb-12 max-w-lg mx-auto">
                    ⚠ If you lose both your Diary Password <strong>and</strong> your Recovery Key, your entries cannot be recovered by anyone — including us.
                </div>

                <div className="space-y-4">
                    {steps.map((step, i) => (
                        <div key={i} className="flex gap-4 bg-white rounded-2xl border border-amber-100 p-5">
                            <div className="w-9 h-9 flex-shrink-0 bg-amber-100 rounded-lg flex items-center justify-center">
                                {step.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1 text-sm">{step.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQ() {
    const items = [
        {
            q: 'Is Inkrypt free?',
            a: 'Yes. The web app is free. You can also self-host the entire stack — the source code is on GitHub under the AGPLv3 license.',
        },
        {
            q: 'Can Inkrypt read my diary?',
            a: 'No. Technically impossible. Your entries are encrypted on your device before they reach our servers. We store encrypted binary blobs we cannot decrypt.',
        },
        {
            q: 'What is the difference between the login password and the Diary Password?',
            a: 'Your login password (verified server-side with bcrypt) identifies you to the system. Your Diary Password is used client-side to derive the encryption key — it never reaches the server. They are completely separate.',
        },
        {
            q: 'Does Inkrypt work offline?',
            a: 'Yes. Entries are cached in an encrypted local IndexedDB. You can read and write offline; changes sync when connectivity resumes.',
        },
        {
            q: 'Can I self-host Inkrypt?',
            a: 'Yes. Clone the repository, set up PostgreSQL, configure your .env file, and run npm run dev (or build for production). Full instructions are in the README.',
        },
        {
            q: 'What happens to my data if I stop using Inkrypt?',
            a: 'Export your backup via Dashboard → Backup before leaving. Your encrypted data is portable. The backup file can be imported into any future Inkrypt instance.',
        },
    ];

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently asked questions</h2>
                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                            >
                                {item.q}
                                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                            </button>
                            {openIndex === i && (
                                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTA() {
    return (
        <section className="py-20 px-6 bg-slate-900 text-white text-center">
            <div className="max-w-2xl mx-auto">
                <InkryptLogo size={48} />
                <h2 className="text-3xl font-bold mt-6 mb-4">Start writing privately</h2>
                <p className="text-slate-400 mb-8">
                    No credit card. No tracking. Your entries are yours — forever.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/auth?mode=signup"
                        className="px-8 py-3.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
                    >
                        Create free account
                    </Link>
                    <a
                        href="https://github.com/Sachin-S543/Diary"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-3.5 border border-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
                    >
                        <Github className="w-4 h-4" /> View on GitHub
                    </a>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    const appName = (import.meta.env as unknown as Record<string, string>)['VITE_APP_NAME'] || 'Inkrypt';
    return (
        <footer className="py-8 px-6 border-t border-slate-100 bg-white">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <InkryptLogo size={24} />
                    <span className="text-sm font-semibold text-slate-700">{appName}</span>
                </div>
                <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                    <a href="#security" className="hover:text-slate-800 transition-colors">Security</a>
                    <a href="#recovery" className="hover:text-slate-800 transition-colors">Recovery</a>
                    <a
                        href="https://github.com/Sachin-S543/Diary"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-800 transition-colors"
                    >
                        GitHub
                    </a>
                    <a
                        href="https://www.gnu.org/licenses/agpl-3.0.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-800 transition-colors"
                    >
                        AGPLv3 License
                    </a>
                </nav>
                <p className="text-xs text-slate-400">
                    © {new Date().getFullYear()} Sachin-S543 · AGPLv3
                </p>
            </div>
        </footer>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <NavBar />
            <Hero />
            <HowItWorks />
            <SecuritySection />
            <RecoverySection />
            <FAQ />
            <CTA />
            <Footer />
        </div>
    );
}
