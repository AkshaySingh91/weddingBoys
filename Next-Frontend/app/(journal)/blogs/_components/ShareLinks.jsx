'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

// Social share row. `url` is the absolute canonical article URL (built server-side).
export default function ShareLinks({ url, title }) {
    const [copied, setCopied] = useState(false);
    const enc = encodeURIComponent(url);
    const encTitle = encodeURIComponent(title);

    const links = [
        { label: 'WhatsApp', href: `https://wa.me/?text=${encTitle}%20${enc}`, color: 'bg-green-500' },
        { label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${enc}&description=${encTitle}`, color: 'bg-red-600' },
        { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, color: 'bg-blue-600' },
        { label: 'Twitter', href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`, color: 'bg-sky-500' },
    ];

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable — no-op */
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Share:</span>
            {links.map((l) => (
                <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full px-3 py-1.5 text-xs font-medium text-white ${l.color} hover:opacity-90`}
                >
                    {l.label}
                </a>
            ))}
            <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
                {copied ? <Check size={12} /> : <Link2 size={12} />}
                {copied ? 'Copied' : 'Copy link'}
            </button>
        </div>
    );
}
