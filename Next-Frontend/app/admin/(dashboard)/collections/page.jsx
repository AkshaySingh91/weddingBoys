'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FilmSlate, ImageSquare, Lock } from '@phosphor-icons/react';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * Rows ("collections"): every curated strip of films or photos on the site —
 * the home hero, the home and /films film rows, the home photo grid. Each is a
 * rule plus pins (Backend/Services/collectionResolver.js).
 */
export default function CollectionsPage() {
    const router = useRouter();
    const [rows, setRows] = useState(null);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [kind, setKind] = useState('Video');

    useEffect(() => {
        let cancelled = false;
        fetch(`${api_url}/api/admin/collections`, { credentials: 'include' })
            .then((r) => r.json())
            .then((d) => { if (!cancelled) setRows(d.collections || []); })
            .catch((e) => fireMessage(e.message, 'error'));
        return () => { cancelled = true; };
    }, []);

    const create = async (e) => {
        e.preventDefault();
        const res = await fetch(`${api_url}/api/admin/collections`, {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, kind, rule: { enabled: true, tagIds: [] }, status: 'Draft' }),
        });
        const data = await res.json();
        if (!res.ok) return fireMessage(data.message || 'Could not create the row', 'error');
        router.push(`/admin/collections/${data.collection._id}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Rows"
                subtitle="Every curated row of films or photos on the site: a rule that fills it, pins you place by hand."
                breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Rows' }]}
            >
                <Button variant="terracotta" size="sm" icon={Plus} onClick={() => setCreating((v) => !v)}>New row</Button>
            </PageHeader>

            {creating && (
                <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-xl border border-studio-border bg-white p-4">
                    <label className="space-y-1">
                        <span className="block text-[11px] font-semibold text-ink-secondary">Title</span>
                        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Beach weddings"
                            className="h-9 w-64 rounded-lg border border-edge-strong px-3 text-sm outline-none focus:border-accent" />
                    </label>
                    <label className="space-y-1">
                        <span className="block text-[11px] font-semibold text-ink-secondary">Shows</span>
                        <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 rounded-lg border border-edge-strong px-2 text-sm">
                            <option value="Video">Films</option>
                            <option value="Photo">Photos</option>
                        </select>
                    </label>
                    <Button type="submit" variant="primary" size="sm" disabled={!title.trim()}>Create and edit</Button>
                </form>
            )}

            {!rows ? <p className="text-sm text-ink-muted">Loading…</p> : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {rows.map((c) => (
                        <li key={c._id}>
                            <Link href={`/admin/collections/${c._id}`} className="block rounded-xl border border-studio-border bg-white p-4 transition-shadow hover:shadow-md">
                                <div className="mb-3 grid grid-cols-4 gap-1">
                                    {[0, 1, 2, 3].map((n) => (
                                        <div key={n} className="aspect-[4/3] overflow-hidden rounded-lg bg-ground-sunk">
                                            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                                            {c.thumbs[n] && <img src={c.thumbs[n]} alt="" className="h-full w-full object-cover" />}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {c.kind === 'Video' ? <FilmSlate size={14} className="text-ink-muted" /> : <ImageSquare size={14} className="text-ink-muted" />}
                                    <h3 className="text-sm font-semibold text-ink">{c.title}</h3>
                                    {c.system && <Badge size="sm" variant="neutral"><Lock size={10} className="mr-0.5 inline" /> site</Badge>}
                                    {c.status === 'Draft' && <Badge size="sm" variant="warning">Draft</Badge>}
                                </div>
                                <p className="mt-1 font-mono text-[11px] text-ink-muted">{c.key}</p>
                                <p className="mt-2 text-xs text-ink-secondary">
                                    Showing {c.shown} of {c.limit}
                                    {c.pinned?.length ? `, ${c.pinned.length} pinned` : ''}
                                    {c.rule?.enabled === false ? ', pins only' : ''}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
