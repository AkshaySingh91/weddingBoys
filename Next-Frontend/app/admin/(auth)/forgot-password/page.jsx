'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  EnvelopeSimple,
  CircleNotch,
  WarningCircle,
  CheckCircle,
  ArrowLeft,
} from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${api_url}/api/admin/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }
      setSent(true);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center font-sans space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-ground-sunk text-accent-ink">
          <CheckCircle size={32} weight="duotone" />
        </div>
        <h1 className="text-2xl font-sans font-semibold text-ink">Check your email</h1>
        <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
          If <span className="font-medium text-ink">{email}</span> is registered in the studio roster, we&apos;ve sent a password reset link. It expires in 1 hour.
        </p>

        {devUrl && (
          <div className="mt-4 break-all rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800">
            <p className="mb-1 font-semibold">Dev only — reset link:</p>
            <a href={devUrl} className="underline">{devUrl}</a>
          </div>
        )}

        <div className="pt-4">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-ink hover:underline"
          >
            <ArrowLeft size={14} weight="bold" /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <header>
        <h1 className="font-sans text-3xl font-semibold text-ink">Reset Password</h1>
        <p className="mt-1 text-xs text-ink-muted">
          Enter your registered studio email address and we&apos;ll send recovery instructions.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
          <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
            Studio Email Address
          </label>
          <div className="relative">
            <EnvelopeSimple size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@theweddingvachan.com"
              className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-10 pr-3.5 text-xs text-ink placeholder:text-ink-muted outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="terracotta"
          loading={submitting}
          disabled={submitting}
          className="w-full justify-center mt-2"
        >
          Send Reset Link
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
