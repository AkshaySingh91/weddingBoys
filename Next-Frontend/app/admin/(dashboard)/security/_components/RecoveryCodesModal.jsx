'use client';

import { useState } from 'react';
import { ShieldCheck, Copy, Check, Download, AlertTriangle } from 'lucide-react';

/**
 * Shown once, immediately after 2FA is enabled. These codes are the only way
 * back into the account if the authenticator device is lost, and the server
 * only keeps hashes — so this is the user's single chance to save them.
 */
export default function RecoveryCodesModal({ codes, onClose, regenerated = false }) {
    const [copied, setCopied] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    if (!codes?.length) return null;

    const asText = [
        'The Wedding Boys — Admin two-factor backup codes',
        `Generated: ${new Date().toLocaleString()}`,
        '',
        'Each code can be used ONCE to sign in if you lose your authenticator device.',
        'Store them somewhere safe and private.',
        '',
        ...codes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`),
        '',
    ].join('\n');

    const copyAll = async () => {
        try {
            await navigator.clipboard.writeText(codes.join('\n'));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const download = () => {
        const blob = new Blob([asText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wedding-boys-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center gap-3 border-b px-6 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <ShieldCheck size={20} />
                    </span>
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            {regenerated ? 'Your new backup codes' : 'Save your backup codes'}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {regenerated
                                ? 'Your previous codes have been invalidated.'
                                : 'Two-factor authentication is now enabled.'}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>
                            These codes won&apos;t be shown again. Each one works <strong>once</strong> if you lose
                            access to your authenticator app.
                        </span>
                    </div>

                    <ul className="grid grid-cols-2 gap-2 rounded-lg border bg-gray-50 p-4">
                        {codes.map((code, i) => (
                            <li key={code} className="flex items-center gap-2 font-mono text-sm text-gray-800">
                                <span className="w-5 text-right text-xs text-gray-400">{i + 1}.</span>
                                {code}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={copyAll}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {copied ? <Check size={15} /> : <Copy size={15} />}
                            {copied ? 'Copied' : 'Copy all'}
                        </button>
                        <button
                            type="button"
                            onClick={download}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Download size={15} /> Download .txt
                        </button>
                    </div>

                    <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(e) => setAcknowledged(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        I&apos;ve saved these codes somewhere safe.
                    </label>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={!acknowledged}
                        className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
