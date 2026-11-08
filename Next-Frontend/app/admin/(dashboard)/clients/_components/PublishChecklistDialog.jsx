'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, WarningCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * "Review & publish": what goes live the moment the wedding is published, what
 * follows on its own, and what will not appear — from
 * GET /api/admin/clients/:id/readiness. Blockers disable Publish; warnings do not.
 */
export default function PublishChecklistDialog({ open, clientId, publishing, onPublish, onClose }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open || !clientId) return undefined;
        let cancelled = false;
        fetch(`${api_url}/api/admin/clients/${clientId}/readiness`, { credentials: 'include' })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.ok) { setData(body); setError(''); } else setError(body.message || 'Could not check the wedding');
            })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [open, clientId]);

    const c = data?.counts;
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v && !publishing) { setData(null); onClose(); } }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Review &amp; publish</DialogTitle>
                    <DialogDescription>What visitors will see once this wedding is published.</DialogDescription>
                </DialogHeader>

                {!data && !error && <p className="flex items-center gap-2 text-sm text-ink-muted"><CircleNotch size={16} className="animate-spin" /> Checking…</p>}
                {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

                {c && (
                    <div className="space-y-3 text-sm">
                        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-emerald-900">
                            <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
                            <span>
                                <strong>{c.goesLive}</strong> of {c.items} go live now
                                {' '}({c.goesLiveFilms} film{c.goesLiveFilms === 1 ? '' : 's'}, {c.goesLivePhotos} photo{c.goesLivePhotos === 1 ? '' : 's'})
                                {c.processing ? <>; <strong>processing: {c.processing}</strong> follow when ready</> : null}.
                            </span>
                        </p>
                        {data.blockers.map((b) => (
                            <p key={b.code} className="flex items-start gap-2 text-rose-700"><XCircle size={16} weight="fill" className="mt-0.5 shrink-0" />{b.message}</p>
                        ))}
                        {data.warnings.map((w) => (
                            <p key={w.code} className="flex items-start gap-2 text-amber-800"><WarningCircle size={16} className="mt-0.5 shrink-0" />{w.message}</p>
                        ))}
                        {data.storyUrl && (
                            <p className="text-xs text-ink-muted">Story page: <span className="font-mono text-ink-secondary">{data.storyUrl}</span></p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => { setData(null); onClose(); }} disabled={publishing}>Not yet</Button>
                    <Button variant="terracotta" size="sm" loading={publishing} disabled={!data?.ready}
                        onClick={onPublish}>Publish wedding</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
