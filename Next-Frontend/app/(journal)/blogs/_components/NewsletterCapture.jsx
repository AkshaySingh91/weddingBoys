'use client';

import { useState } from 'react';

export default function NewsletterCapture() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;

        setStatus('loading');
        // Simulated subscription feedback (or integrated with newsletter service)
        setTimeout(() => {
            setStatus('success');
            setMessage('Welcome to The Wedding Boys Journal. You will receive our next curated story.');
            setEmail('');
        }, 600);
    };

    return (
        <section aria-label="Journal Newsletter" className="my-16 overflow-hidden rounded-3xl border border-studio-border bg-gradient-to-br from-studio-canvas via-white to-amber-50/40 p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-studio-gold">
                    The Wedding Boys Journal
                </span>
                <h3 className="mt-2 font-playfair text-2xl sm:text-3xl font-bold text-studio-ink">
                    Cinematic Love Stories, Delivered Weekly
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-studio-inkSecondary">
                    Join over 12,000 couples receiving our intimate real wedding features, destination venue guides, and timeless cinematography inspiration.
                </p>

                {status === 'success' ? (
                    <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-800">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="flex-1 rounded-xl border border-studio-border bg-white px-5 py-3 text-sm text-studio-ink placeholder-studio-inkMuted focus:border-studio-terracotta focus:outline-none focus:ring-2 focus:ring-studio-terracotta/20 transition-all"
                            disabled={status === 'loading'}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="rounded-xl bg-studio-ink px-6 py-3 text-sm font-semibold text-studio-canvas transition-colors hover:bg-studio-terracotta disabled:opacity-60 shrink-0"
                        >
                            {status === 'loading' ? 'Joining...' : 'Subscribe'}
                        </button>
                    </form>
                )}

                <p className="mt-4 text-xs text-studio-inkMuted">
                    No spam ever. Unsubscribe with one click anytime.
                </p>
            </div>
        </section>
    );
}
