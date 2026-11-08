'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    EnvelopeSimple, LockKey, Eye, EyeSlash, CircleNotch, WarningCircle, ShieldCheck, ArrowLeft, Key
} from '@phosphor-icons/react';
import Button from '@/app/admin/components/ui/Button.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedNext = searchParams.get('next') || '/dashboard';
    const nextPath = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\') ? requestedNext : '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Second factor (TOTP)
    const [tempToken, setTempToken] = useState(null);
    const [code, setCode] = useState('');
    const [useRecovery, setUseRecovery] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');

    const goToDestination = () => {
        const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');
        let target;
        if (isSubdomain) {
            const clean = nextPath ? nextPath.replace(/^\/admin/, '') : '/dashboard';
            target = clean.startsWith('/') ? clean : `/${clean}`;
        } else {
            const clean = nextPath ? nextPath.replace(/^\/admin/, '') : '/dashboard';
            target = `/admin${clean.startsWith('/') ? clean : `/${clean}`}`;
        }
        window.location.href = target;
    };

    const validate = () => {
        const errs = {};
        if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Please enter a valid email address';
        if (!password) errs.password = 'Password is required';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${api_url}/api/admin/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message || 'Invalid email or password. Please try again.');
                return;
            }

            if (data.requiresMfa) {
                setTempToken(data.tempToken);
                return;
            }

            goToDestination();
        } catch (err) {
            setError(err.message || 'Network error. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyMfa = async (e) => {
        e.preventDefault();
        setError('');
        if (!/^\d{6}$/.test(code)) {
            setError('Please enter the 6-digit verification code');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${api_url}/api/admin/auth/mfa/login-verify`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, code }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || 'Invalid verification code.');
                if (res.status === 401 && /expired/i.test(data.message || '')) {
                    setTempToken(null);
                    setCode('');
                    setPassword('');
                }
                return;
            }
            goToDestination();
        } catch (err) {
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyRecovery = async (e) => {
        e.preventDefault();
        setError('');
        if (!recoveryCode.trim()) {
            setError('Please enter a recovery code');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${api_url}/api/admin/auth/mfa/recovery`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, recoveryCode: recoveryCode.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || 'Invalid backup code.');
                return;
            }
            goToDestination();
        } catch (err) {
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 2: Recovery Code
    if (useRecovery && tempToken) {
        return (
            <div className="space-y-6">
                <header>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ground text-gold-strong">
                        <Key size={24} weight="duotone" />
                    </div>
                    <h1 className="font-sans text-2xl font-semibold text-ink">Backup Recovery Code</h1>
                    <p className="mt-1 text-xs font-sans text-ink-muted">
                        Enter one of your saved single-use emergency recovery codes.
                    </p>
                </header>

                {error && (
                    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-sans text-rose-800">
                        <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleVerifyRecovery} noValidate className="space-y-5">
                    <div>
                        <label htmlFor="recoveryCode" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                            Recovery Code
                        </label>
                        <input
                            id="recoveryCode"
                            type="text"
                            autoComplete="one-time-code"
                            autoFocus
                            value={recoveryCode}
                            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                            placeholder="A8K2-9P3L"
                            className="w-full rounded-xl border border-edge-subtle bg-white py-3 text-center font-mono text-xl tracking-[0.25em] text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="gold"
                        loading={submitting}
                        disabled={submitting || recoveryCode.trim().length < 8}
                        className="w-full justify-center"
                    >
                        Verify with Backup Code
                    </Button>
                </form>

                <button
                    type="button"
                    onClick={() => { setUseRecovery(false); setRecoveryCode(''); setError(''); }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium font-sans text-ink-muted hover:text-ink transition"
                >
                    <ArrowLeft size={14} weight="bold" /> Use authenticator app instead
                </button>
            </div>
        );
    }

    // Step 2: TOTP verification
    if (tempToken) {
        return (
            <div className="space-y-6">
                <header>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ground text-emerald-700">
                        <ShieldCheck size={24} weight="duotone" />
                    </div>
                    <h1 className="font-sans text-2xl font-semibold text-ink">Two-Factor Verification</h1>
                    <p className="mt-1 text-xs font-sans text-ink-muted">
                        Enter the 6-digit verification code from your authenticator app.
                    </p>
                </header>

                {error && (
                    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-sans text-rose-800">
                        <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleVerifyMfa} noValidate className="space-y-5">
                    <div>
                        <label htmlFor="code" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                            Authentication Code
                        </label>
                        <input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full rounded-xl border border-edge-subtle bg-white py-3 text-center font-mono text-2xl tracking-[0.4em] text-ink outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="gold"
                        loading={submitting}
                        disabled={submitting || code.length !== 6}
                        className="w-full justify-center"
                    >
                        Verify &amp; Enter Dashboard
                    </Button>
                </form>

                <div className="space-y-3 pt-2 text-center">
                    <button
                        type="button"
                        onClick={() => { setUseRecovery(true); setCode(''); setError(''); }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium font-sans text-gold-strong hover:underline"
                    >
                        <Key size={14} weight="bold" /> Lost access? Use emergency backup code
                    </button>
                    <div>
                        <button
                            type="button"
                            onClick={() => { setTempToken(null); setCode(''); setError(''); }}
                            className="inline-flex items-center gap-1 text-xs font-sans text-ink-muted hover:text-ink"
                        >
                            <ArrowLeft size={13} weight="bold" /> Back to email sign in
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Initial Login Form
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-sans text-3xl font-semibold text-ink">Sign in</h1>
                <p className="mt-1 text-xs font-sans text-ink-muted">
                    Use your studio email and password.
                </p>
            </header>

            {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-sans text-rose-800">
                    <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">Email Address</label>
                    <div className="relative">
                        <EnvelopeSimple size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@theweddingvachan.com"
                            className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm font-sans text-ink placeholder:text-ink-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold ${
                                fieldErrors.email ? 'border-rose-400' : 'border-edge-subtle'
                            }`}
                        />
                    </div>
                    {fieldErrors.email && <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.email}</p>}
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-ink-muted">Password</label>
                        <Link href="/admin/forgot-password" className="text-xs font-sans text-gold-strong hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <LockKey size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm font-sans text-ink placeholder:text-ink-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold ${
                                fieldErrors.password ? 'border-rose-400' : 'border-edge-subtle'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition"
                        >
                            {showPassword ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                        </button>
                    </div>
                    {fieldErrors.password && <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.password}</p>}
                </div>

                <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-sans text-ink-muted">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-lg border-edge-subtle accent-gold"
                    />
                    <span>Remember this device for 30 days</span>
                </label>

                <Button
                    type="submit"
                    variant="gold"
                    loading={submitting}
                    disabled={submitting}
                    className="w-full justify-center mt-2"
                >
                    Sign in
                </Button>
            </form>

            <p className="border-t border-edge-subtle pt-4 text-center text-[11px] font-sans text-ink-muted">
                For studio staff only. New team members join by invite.
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-ground" />}>
            <LoginForm />
        </Suspense>
    );
}
