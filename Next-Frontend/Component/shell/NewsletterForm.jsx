'use client';

/**
 * NewsletterForm.
 *
 * Small, but it carries the form patterns the rest of the redesign will follow:
 * a real <form> with an onSubmit so Enter works, a labelled field, validation on
 * submit with a specific message, an inline busy state, and a success state that
 * stays on screen.
 *
 * The audit found the site's main enquiry form failing silently on invalid input
 * and unable to be submitted by keyboard (R-01, R-02). Those are Stage 7, but
 * the pattern is set here.
 *
 * The old copy claimed "Join 12,000 discerning couples". That number is
 * unverified (F-01) and is not reproduced here — the studio can put it back once
 * it is confirmed.
 */
import { useId, useState } from 'react';

export default function NewsletterForm({ className = '' }) {
    const id = useId();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | busy | done | error
    const [message, setMessage] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        const value = email.trim();

        if (!value) {
            setStatus('error');
            setMessage('Enter an email address so we know where to send it.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
            setStatus('error');
            setMessage('That address looks incomplete — check for a typo.');
            return;
        }

        setStatus('busy');
        setMessage('');
        try {
            // Wired to the real endpoint in Stage 7 alongside the enquiry form.
            await new Promise((r) => setTimeout(r, 600));
            setStatus('done');
            setMessage('You are on the list.');
            setEmail('');
        } catch {
            setStatus('error');
            setMessage('That did not send. Try again in a moment.');
        }
    };

    if (status === 'done') {
        return (
            <p className={`t-body-sm text-state-success ${className}`} role="status">
                {message}
            </p>
        );
    }

    return (
        <form onSubmit={submit} className={className} noValidate>
            <label htmlFor={id} className="sr-only">Email address</label>
            <div className="flex gap-2">
                <input
                    id={id}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                    placeholder="you@example.com"
                    aria-invalid={status === 'error'}
                    aria-describedby={message ? `${id}-msg` : undefined}
                    className={`min-h-[44px] w-full rounded-control border bg-ground-raised px-3 text-[14px]
                                text-ink placeholder:text-ink-muted transition-colors duration-micro
                                ease-standard ${status === 'error' ? 'border-state-error' : 'border-edge-subtle'}`}
                />
                <button
                    type="submit"
                    disabled={status === 'busy'}
                    className="min-h-[44px] shrink-0 rounded-control border border-edge-strong px-4 text-[13px]
                               font-semibold text-ink transition-colors duration-micro ease-standard
                               hover:border-gold-strong disabled:text-ink-muted"
                >
                    {status === 'busy' ? 'Sending…' : 'Join'}
                </button>
            </div>
            {message && (
                <p id={`${id}-msg`} role="alert" className="t-caption mt-2 text-state-error">{message}</p>
            )}
        </form>
    );
}
