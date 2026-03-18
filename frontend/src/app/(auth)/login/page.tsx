'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import { Layers, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authApi.login({ email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-base)' }}
        >
            {/* Ambient glow */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -60%)',
                    filter: 'blur(40px)',
                }}
            />

            <div
                className="w-full max-w-sm animate-fade-up"
                style={{ animationDuration: '0.5s' }}
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
                            boxShadow: '0 0 32px var(--accent-glow)',
                        }}
                    >
                        <Layers size={22} color="#0e0f14" strokeWidth={2} />
                    </div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                    >
                        Welcome back
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Sign in to your workspace
                    </p>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                    }}
                >
                    {error && (
                        <div
                            className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6 text-sm animate-scale-in"
                            style={{ background: 'var(--rose-dim)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.2)' }}
                        >
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Email address
                            </label>
                            <div className="relative">
                                <Mail
                                    size={14}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: 'var(--bg-overlay)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        caretColor: 'var(--accent)',
                                    }}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Password
                                </label>
                                <a href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock
                                    size={14}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: 'var(--bg-overlay)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        caretColor: 'var(--accent)',
                                    }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-accent w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 mt-2"
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-[#0e0f14]/40 border-t-[#0e0f14] rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="font-semibold transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}