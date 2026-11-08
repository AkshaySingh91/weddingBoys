'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  LockKey,
  Eye,
  EyeSlash,
  CircleNotch,
  WarningCircle,
  CheckCircle,
  Check,
  X,
  ArrowLeft,
} from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'letter', label: 'Contains a letter', test: (p) => /[A-Za-z]/.test(p) },
  { key: 'number', label: 'Contains a number', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Contains a symbol (recommended)', test: (p) => /[^A-Za-z0-9]/.test(p), optional: true },
];

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passed = useMemo(() => RULES.filter((r) => r.test(password)), [password]);
  const requiredMet = RULES.filter((r) => !r.optional).every((r) => r.test(password));
  const matches = confirm.length > 0 && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!requiredMet) return setError('Password does not meet the requirements');
    if (!matches) return setError('Passwords do not match');

    setSubmitting(true);
    try {
      const res = await fetch(`${api_url}/api/admin/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Could not reset password. The link may have expired.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/admin/login'), 2500);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center font-sans space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-ground-sunk text-accent-ink">
          <CheckCircle size={32} weight="duotone" />
        </div>
        <h1 className="text-2xl font-sans font-semibold text-ink">Password Updated</h1>
        <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
          All other active devices have been signed out. Redirecting you to sign in…
        </p>
        <div className="pt-4">
          <Link href="/admin/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-ink hover:underline">
            Go to sign in now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <header>
        <h1 className="font-sans text-3xl font-semibold text-ink">Set New Password</h1>
        <p className="mt-1 text-xs text-ink-muted">Choose a secure password for your administrator account.</p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
            New Password
          </label>
          <div className="relative">
            <LockKey size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-10 pr-10 text-xs text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
            >
              {show ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
            </button>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-1.5 rounded-xl border border-edge-subtle bg-ground p-3 text-xs">
          {RULES.map((r) => {
            const pass = r.test(password);
            return (
              <div key={r.key} className="flex items-center gap-2">
                {pass ? (
                  <Check size={13} weight="bold" className="text-emerald-600 shrink-0" />
                ) : (
                  <X size={13} weight="bold" className="text-stone-300 shrink-0" />
                )}
                <span className={pass ? 'text-ink' : 'text-ink-muted'}>{r.label}</span>
              </div>
            );
          })}
        </div>

        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
            Confirm Password
          </label>
          <div className="relative">
            <LockKey size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="confirm"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-10 pr-3.5 text-xs text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="terracotta"
          loading={submitting}
          disabled={submitting || !requiredMet || !matches}
          className="w-full justify-center mt-2"
        >
          Update Password
        </Button>
      </form>

      <div className="pt-2 text-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition"
        >
          <ArrowLeft size={14} weight="bold" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
