'use client';

import { useState } from 'react';
import { X, CircleNotch, EnvelopeSimple, Copy, Check, WarningCircle } from '@phosphor-icons/react';
import { apiJson } from '@/lib/apiClient.js';
import Button from '@/app/admin/components/ui/Button.jsx';

const ROLE_OPTIONS = [
    { value: 'SuperAdmin', label: 'SuperAdmin', hint: 'Full access, including team and security settings' },
    { value: 'Editor', label: 'Editor', hint: 'Can create and publish content, films and articles' },
    { value: 'PortfolioManager', label: 'PortfolioManager', hint: 'Manages client shoots, films and galleries' },
];

export default function InviteModal({ open, onClose, onInvited }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Editor');
    const [error, setError] = useState('');
    const [inviteUrl, setInviteUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const reset = () => {
        setEmail(''); setRole('Editor'); setError(''); setInviteUrl(''); setCopied(false);
    };

    const close = () => { reset(); onClose(); };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.');

        setSubmitting(true);
        try {
            const data = await apiJson('/api/admin/users/invite', {
                method: 'POST',
                body: JSON.stringify({ email, role }),
            });
            setInviteUrl(data.inviteUrl || '');
            onInvited?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl border border-edge-subtle bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-edge-subtle px-6 py-4">
                    <h2 className="text-base font-medium font-sans text-ink">Invite Administrator</h2>
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-ground hover:text-ink"
                    >
                        <X size={18} weight="bold" />
                    </button>
                </div>

                {inviteUrl ? (
                    <div className="p-6 space-y-4">
                        <p className="text-sm font-sans text-ink-secondary">
                            Invitation link generated for <span className="font-semibold text-ink">{email}</span>.
                            Share this link with the recipient — it expires in 7 days.
                        </p>
                        <div className="flex items-center gap-2 rounded-xl border border-edge-subtle bg-ground p-2.5">
                            <span className="flex-1 truncate font-mono text-xs text-ink-secondary">{inviteUrl}</span>
                            <button
                                type="button"
                                onClick={copy}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge-subtle bg-white px-3 py-1.5 text-xs font-medium font-sans text-ink shadow-sm transition hover:bg-ground"
                            >
                                {copied ? <Check size={14} weight="bold" className="text-emerald-600" /> : <Copy size={14} weight="bold" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={close}
                            className="w-full justify-center mt-2"
                        >
                            Done
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate className="p-6 space-y-5">
                        {error && (
                            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm font-sans text-rose-800">
                                <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-rose-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="invite-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">Email Address</label>
                            <div className="relative">
                                <EnvelopeSimple size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                                <input
                                    id="invite-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@theweddingvachan.com"
                                    className="w-full rounded-xl border border-edge-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm font-sans text-ink placeholder:text-ink-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                                />
                            </div>
                        </div>

                        <div>
                            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">Role Privileges</span>
                            <div className="space-y-2.5">
                                {ROLE_OPTIONS.map((r) => (
                                    <label
                                        key={r.value}
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                                            role === r.value
                                                ? 'border-gold bg-ground shadow-sm'
                                                : 'border-edge-subtle bg-white hover:border-edge-strong'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={r.value}
                                            checked={role === r.value}
                                            onChange={() => setRole(r.value)}
                                            className="mt-0.5 h-4 w-4 accent-gold"
                                        />
                                        <div className="min-w-0">
                                            <span className="block text-sm font-medium text-ink">{r.label}</span>
                                            <span className="block text-xs text-ink-muted">{r.hint}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={close}
                                className="flex-1 justify-center"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="gold"
                                disabled={submitting}
                                loading={submitting}
                                className="flex-1 justify-center"
                            >
                                Send Invite
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
