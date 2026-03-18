'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import { Layers, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.register({ username, email, password });
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthColors = ['', '#f87171', '#c9a84c', '#4ade80'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

    const fields = [
        { label: 'Username', icon: User, type: 'text', value: username, onChange: setUsername, placeholder: 'johndoe' },
        { label: 'Email address', icon: Mail, type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com' },
    ];

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-base)' }}
        >
            <div
                className="absolute pointer-events-none"
                style={{
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(78,124,255,0.07) 0%, transparent 70%)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -60%)',
                    filter: 'blur(40px)',
                }}
            />

            <div className="w-full max-w-sm animate-fade-up" style={{ animationDuration: '0.5s' }}>
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
                        Create account
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Start managing projects today
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(({ label, icon: Icon, type, value, onChange, placeholder }) => (
                            <div key={label}>
                                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    {label}
                                </label>
                                <div className="relative">
                                    <Icon
                                        size={14}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                    <input
                                        type={type}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                        style={{
                                            background: 'var(--bg-overlay)',
                                            border: '1px solid var(--border-subtle)',
                                            color: 'var(--text-primary)',
                                            caretColor: 'var(--accent)',
                                        }}
                                        placeholder={placeholder}
                                        value={value}
                                        onChange={e => onChange(e.target.value)}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                                        required
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Password with strength */}
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={14}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: 'var(--bg-overlay)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        caretColor: 'var(--accent)',
                                    }}
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{
                                                    background: i <= passwordStrength ? strengthColors[passwordStrength] : 'var(--bg-hover)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-medium" style={{ color: strengthColors[passwordStrength] }}>
                                        {strengthLabels[passwordStrength]}
                                    </span>
                                </div>
                            )}
                        </div>

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
                                    <span>Create Account</span>
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}