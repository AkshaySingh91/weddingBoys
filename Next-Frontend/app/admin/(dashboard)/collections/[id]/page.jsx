'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Reorder } from 'framer-motion';
import { PushPin, PushPinSlash, EyeSlash, Eye, DotsSixVertical, MagnifyingGlass, Trash, FilmSlate, ImageSquare, Check } from '@phosphor-icons/react';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import TagPicker from '@/app/admin/components/taxonomy/TagPicker.jsx';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';
import { REASON_TEXT } from '../../clients/_lib/visibility.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;
const field = 'h-9 w-full rounded-lg border border-edge-strong bg-white px-3 text-sm outline-none focus:border-accent';
const label = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted';

const NOT_SHOWN = {
    'hidden-in-row': 'Hidden in this row',
    'wedding-cap': 'Over the per-wedding limit',
    'over-limit': 'Pinned beyond the row limit',
    'shown-earlier': 'Shown in an earlier row on the page',
    'not-public': 'Not on the site',
    'wrong-kind': 'Wrong kind for this row',
    deleted: 'Deleted item',
};

/** The editable fields, as the API takes them. */
const toDraft = (c) => ({
    title: c.title || '', subtitle: c.subtitle || '', kind: c.kind, status: c.status,
    limit: c.limit, sort: c.sort, dedupe: Boolean(c.dedupe),
    rule: {
        enabled: c.rule?.enabled !== false,
        tagIds: (c.rule?.tagIds || []).map(String),
        match: c.rule?.match || 'any',
        excludeTagIds: (c.rule?.excludeTagIds || []).map(String),
        clientIds: (c.rule?.clientIds || []).map(String),
        citySlugs: c.rule?.citySlugs || [],
        shootDateFrom: c.rule?.shootDateFrom ? String(c.rule.shootDateFrom).slice(0, 10) : '',
        shootDateTo: c.rule?.shootDateTo ? String(c.rule.shootDateTo).slice(0, 10) : '',
        maxPerWedding: c.rule?.maxPerWedding || '',
    },
    pinned: (c.pinned || []).map(String),
    hidden: (c.hidden || []).map(String),
});

async function api(path, method = 'GET', body) {
    const res = await fetch(`${api_url}${path}`, {
        method, credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'That did not work');
    return data;
}

export default function CollectionEditor() {
    const { id } = useParams();
    const router = useRouter();
    const taxonomy = useTaxonomy();
    const [saved, setSaved] = useState(null);
    const [draft, setDraft] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [weddings, setWeddings] = useState([]);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        let cancelled = false;
        api(`/api/admin/collections/${id}`).then((d) => {
            if (cancelled) return;
            setSaved(d.collection);
            setDraft(toDraft(d.collection));
            setPreview(d.preview);
        }).catch((e) => fireMessage(e.message, 'error'));
        api('/api/admin/clients/').then((d) => { if (!cancelled) setWeddings(d.clientDetails || []); }).catch(() => {});
        return () => { cancelled = true; };
    }, [id]);

    // Live preview of the unsaved draft, 400 ms after the last change.
    const draftKey = JSON.stringify(draft);
    useEffect(() => {
        if (!draft) return undefined;
        let cancelled = false;
        const t = setTimeout(() => {
            setPreviewing(true);
            // A title is required to save, not to preview: keep the preview alive while it is blank.
            api('/api/admin/collections/preview', 'POST', { ...draft, title: draft.title || 'Untitled' })
                .then((d) => { if (!cancelled) setPreview(d); })
                .catch((e) => { if (!cancelled) fireMessage(e.message, 'error'); })
                .finally(() => { if (!cancelled) setPreviewing(false); });
        }, 400);
        return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialized draft
    }, [draftKey]);

    // Search to pin: films or photos of this row's kind, by couple, tag or place.
    useEffect(() => {
        if (!draft || q.trim().length < 2) return undefined;
        let cancelled = false;
        const t = setTimeout(() => {
            api(`/api/admin/portfolio?q=${encodeURIComponent(q.trim())}&kind=${draft.kind}&limit=12`)
                .then((d) => { if (!cancelled) setResults(d.items || []); })
                .catch(() => {});
        }, 300);
        return () => { cancelled = true; clearTimeout(t); };
    }, [q, draft?.kind]); // eslint-disable-line react-hooks/exhaustive-deps -- only the kind of the draft matters

    const cardById = useMemo(() => {
        const m = new Map();
        for (const i of [...(preview?.items || []), ...(preview?.notShown || []), ...results.map((r) => ({ _id: r._id, posterUrl: r.render?.posterUrl, imageUrl: r.render?.imageUrl, wedding: r.clientNameText }))]) {
            if (i?._id && !m.has(i._id)) m.set(i._id, i);
        }
        return m;
    }, [preview, results]);

    if (!draft || !saved) return <p className="p-6 text-sm text-ink-muted">Loading…</p>;

    const dirty = JSON.stringify(toDraft(saved)) !== draftKey;
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
    const setRule = (patch) => setDraft((d) => ({ ...d, rule: { ...d.rule, ...patch } }));
    const without = (list, x) => list.filter((y) => y !== x);
    const pin = (itemId) => setDraft((d) => ({ ...d, pinned: [...without(d.pinned, itemId), itemId], hidden: without(d.hidden, itemId) }));
    const unpin = (itemId) => setDraft((d) => ({ ...d, pinned: without(d.pinned, itemId) }));
    const hide = (itemId) => setDraft((d) => ({ ...d, hidden: [...without(d.hidden, itemId), itemId], pinned: without(d.pinned, itemId) }));
    const unhide = (itemId) => setDraft((d) => ({ ...d, hidden: without(d.hidden, itemId) }));

    const save = async () => {
        setSaving(true);
        try {
            const d = await api(`/api/admin/collections/${saved._id}`, 'PATCH', {
                ...draft,
                rule: { ...draft.rule, maxPerWedding: draft.rule.maxPerWedding || undefined, shootDateFrom: draft.rule.shootDateFrom || undefined, shootDateTo: draft.rule.shootDateTo || undefined },
            });
            setSaved(d.collection);
            setDraft(toDraft(d.collection));
            fireMessage('Row saved', 'success');
        } catch (e) {
            fireMessage(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        try {
            await api(`/api/admin/collections/${saved._id}`, 'DELETE');
            fireMessage('Row deleted', 'success');
            router.push('/admin/collections');
        } catch (e) { fireMessage(e.message, 'error'); }
    };

    const thumb = (c) => c?.posterUrl || c?.imageUrl;
    const Thumb = ({ c, className }) => (
        <span className={cn('block overflow-hidden rounded-lg bg-ground-sunk', className)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
            {thumb(c) && <img src={thumb(c)} alt="" className="h-full w-full object-cover" />}
        </span>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title={draft.title || 'Row'}
                subtitle={<span className="font-mono text-xs">{saved.key}{saved.system ? ' · used by the site' : ''}</span>}
                breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Rows', href: '/admin/collections' }, { label: draft.title || 'Row' }]}
            >
                <div className="flex items-center gap-2">
                    {dirty && <Badge size="sm" variant="warning">Unsaved</Badge>}
                    {!saved.system && <Button variant="danger" size="sm" icon={Trash} onClick={remove}>Delete</Button>}
                    <Button variant="gold" size="sm" icon={Check} loading={saving} disabled={!dirty} onClick={save}>Save row</Button>
                </div>
            </PageHeader>

            <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                {/* ------------------------------------------------ settings + rule */}
                <aside className="space-y-4">
                    <section className="space-y-3 rounded-xl border border-studio-border bg-white p-4">
                        <div><span className={label}>Title</span><input className={field} value={draft.title} onChange={(e) => set({ title: e.target.value })} /></div>
                        <div><span className={label}>Subtitle</span><input className={field} value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className={label}>Status</span>
                                <select className={field} value={draft.status} onChange={(e) => set({ status: e.target.value })}>
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                            <div><span className={label}>Show at most</span><input type="number" min={1} max={60} className={field} value={draft.limit} onChange={(e) => set({ limit: e.target.value })} /></div>
                        </div>
                        <div>
                            <span className={label}>Order after the pins</span>
                            <select className={field} value={draft.sort} onChange={(e) => set({ sort: e.target.value })}>
                                <option value="newestShoot">Newest shoot first</option>
                                <option value="newestPublished">Newest published first</option>
                                <option value="featured">Featured first (spotlight)</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-ink-secondary">
                            <input type="checkbox" checked={draft.dedupe} onChange={(e) => set({ dedupe: e.target.checked })} />
                            Skip items already shown in an earlier row on the same page
                        </label>
                    </section>

                    <section className="space-y-3 rounded-xl border border-studio-border bg-white p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <input type="checkbox" checked={draft.rule.enabled} onChange={(e) => setRule({ enabled: e.target.checked })} />
                            Fill with a rule
                        </label>
                        {!draft.rule.enabled && <p className="text-xs text-ink-muted">Pins only: the row shows exactly what you pin.</p>}
                        {draft.rule.enabled && (
                            <>
                                <div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className={label}>Tagged</span>
                                        <select className="h-7 rounded-lg border border-edge-strong px-1 text-xs" value={draft.rule.match} onChange={(e) => setRule({ match: e.target.value })}>
                                            <option value="any">any of these</option>
                                            <option value="all">all of these</option>
                                        </select>
                                    </div>
                                    <TagPicker taxonomy={taxonomy} kind={draft.kind} value={draft.rule.tagIds} onChange={(tagIds) => setRule({ tagIds })} allowCreate={false} free compact />
                                    {!draft.rule.tagIds.length && <p className="mt-1 text-[11px] text-ink-muted">No tags: every public {draft.kind === 'Video' ? 'film' : 'photo'}.</p>}
                                </div>
                                <details>
                                    <summary className="cursor-pointer text-xs font-semibold text-ink-secondary">Not tagged ({draft.rule.excludeTagIds.length})</summary>
                                    <div className="mt-2"><TagPicker taxonomy={taxonomy} kind={draft.kind} value={draft.rule.excludeTagIds} onChange={(excludeTagIds) => setRule({ excludeTagIds })} allowCreate={false} free compact /></div>
                                </details>
                                <div>
                                    <span className={label}>Cities</span>
                                    <input className={field} placeholder="udaipur, jaipur" value={draft.rule.citySlugs.join(', ')}
                                        onChange={(e) => setRule({ citySlugs: e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) })} />
                                </div>
                                <details>
                                    <summary className="cursor-pointer text-xs font-semibold text-ink-secondary">Only these weddings ({draft.rule.clientIds.length})</summary>
                                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                                        {weddings.map((w) => (
                                            <label key={w.clientId} className="flex items-center gap-2 text-xs">
                                                <input type="checkbox" checked={draft.rule.clientIds.includes(String(w.clientId))}
                                                    onChange={(e) => setRule({ clientIds: e.target.checked ? [...draft.rule.clientIds, String(w.clientId)] : draft.rule.clientIds.filter((x) => x !== String(w.clientId)) })} />
                                                {[w.clientName?.Bride, w.clientName?.Groom].filter(Boolean).join(' & ')}
                                            </label>
                                        ))}
                                    </div>
                                </details>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><span className={label}>Shot from</span><input type="date" className={field} value={draft.rule.shootDateFrom} onChange={(e) => setRule({ shootDateFrom: e.target.value })} /></div>
                                    <div><span className={label}>Shot until</span><input type="date" className={field} value={draft.rule.shootDateTo} onChange={(e) => setRule({ shootDateTo: e.target.value })} /></div>
                                </div>
                                <div><span className={label}>At most per wedding</span><input type="number" min={1} max={60} placeholder="no limit" className={field} value={draft.rule.maxPerWedding} onChange={(e) => setRule({ maxPerWedding: e.target.value })} /></div>
                            </>
                        )}
                    </section>
                </aside>

                {/* ------------------------------------------------ pins + preview */}
                <main className="space-y-4">
                    <section className="rounded-xl border border-studio-border bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-ink">Pinned, in this order ({draft.pinned.length})</h2>
                            <div className="relative">
                                <MagnifyingGlass size={14} className="absolute left-2.5 top-2.5 text-ink-muted" />
                                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find to pin: couple, tag, city" className="h-9 w-64 rounded-lg border border-edge-strong pl-8 pr-3 text-xs outline-none focus:border-accent" />
                            </div>
                        </div>
                        {q.trim().length >= 2 && results.length > 0 && (
                            <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {results.map((r) => (
                                    <li key={r._id} className="rounded-lg border border-edge-subtle p-1.5">
                                        <Thumb c={{ posterUrl: r.render?.posterUrl, imageUrl: r.render?.imageUrl }} className="aspect-video" />
                                        <p className="mt-1 truncate text-[11px] text-ink-secondary">{r.clientNameText}</p>
                                        <button type="button" disabled={draft.pinned.includes(r._id)} onClick={() => pin(r._id)}
                                            className="mt-1 w-full rounded-lg bg-ink py-1 text-[11px] text-white disabled:opacity-40">{draft.pinned.includes(r._id) ? 'Pinned' : 'Pin'}</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {draft.pinned.length ? (
                            <Reorder.Group axis="y" values={draft.pinned} onReorder={(pinned) => set({ pinned })} className="divide-y divide-edge-subtle">
                                {draft.pinned.map((pid) => {
                                    const c = cardById.get(pid);
                                    return (
                                        <Reorder.Item key={pid} value={pid} className="flex cursor-grab items-center gap-3 bg-white py-1.5 active:cursor-grabbing">
                                            <DotsSixVertical size={16} className="text-ink-muted" />
                                            <Thumb c={c} className="h-9 w-14 shrink-0" />
                                            <span className="min-w-0 flex-1 truncate text-xs text-ink-secondary">{c?.wedding || c?.caption || pid}</span>
                                            {c?.reason && <Badge size="sm" variant="warning">{NOT_SHOWN[c.reason] || c.reason}</Badge>}
                                            <button type="button" onClick={() => unpin(pid)} className="rounded-lg p-1 text-ink-muted hover:bg-ground-sunk" aria-label="Unpin"><PushPinSlash size={14} /></button>
                                        </Reorder.Item>
                                    );
                                })}
                            </Reorder.Group>
                        ) : <p className="text-xs text-ink-muted">Nothing pinned. Pin from the preview or find an item above.</p>}
                    </section>

                    <section className="rounded-xl border border-studio-border bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold text-ink">
                                On the site {previewing && <span className="font-normal text-ink-muted">· updating…</span>}
                            </h2>
                            {preview?.counts && (
                                <p className="text-xs text-ink-muted">
                                    {preview.counts.shown} of {preview.counts.limit} shown · {preview.counts.pinned} pinned · {preview.counts.matching} match the rule
                                </p>
                            )}
                        </div>
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {(preview?.items || []).map((c, idx) => (
                                <li key={c._id} className="group relative">
                                    <Thumb c={c} className={draft.kind === 'Video' ? 'aspect-video' : 'aspect-[4/5]'} />
                                    <span className="absolute left-1.5 top-1.5 rounded-lg bg-white/90 px-1.5 text-[10px] font-semibold text-ink">
                                        {idx + 1}{c.source === 'pinned' ? ' · pinned' : ''}
                                    </span>
                                    <p className="mt-1 truncate text-[11px] text-ink-secondary">{c.wedding}</p>
                                    <div className="mt-1 flex gap-1">
                                        {c.source === 'pinned'
                                            ? <button type="button" onClick={() => unpin(c._id)} className="flex items-center gap-1 rounded-lg border border-edge-subtle px-1.5 py-0.5 text-[10px]"><PushPinSlash size={10} /> Unpin</button>
                                            : <button type="button" onClick={() => pin(c._id)} className="flex items-center gap-1 rounded-lg border border-edge-subtle px-1.5 py-0.5 text-[10px]"><PushPin size={10} /> Pin</button>}
                                        <button type="button" onClick={() => hide(c._id)} className="flex items-center gap-1 rounded-lg border border-edge-subtle px-1.5 py-0.5 text-[10px]"><EyeSlash size={10} /> Hide</button>
                                    </div>
                                </li>
                            ))}
                            {preview && !preview.items.length && <li className="col-span-full text-xs text-ink-muted">Nothing to show yet.</li>}
                        </ul>
                    </section>

                    {preview?.notShown?.length > 0 && (
                        <details className="rounded-xl border border-studio-border bg-white p-4" open={preview.notShown.length <= 8}>
                            <summary className="cursor-pointer text-sm font-semibold text-ink">Not shown ({preview.notShown.length})</summary>
                            <ul className="mt-3 divide-y divide-edge-subtle">
                                {preview.notShown.map((n) => (
                                    <li key={`${n._id}-${n.reason}`} className="flex items-center gap-3 py-1.5">
                                        <Thumb c={n} className="h-9 w-14 shrink-0" />
                                        {draft.kind === 'Video' ? <FilmSlate size={12} className="text-ink-muted" /> : <ImageSquare size={12} className="text-ink-muted" />}
                                        <span className="min-w-0 flex-1 truncate text-xs text-ink-secondary">{n.wedding || n._id}</span>
                                        <span className="text-[11px] text-ink-muted">
                                            {NOT_SHOWN[n.reason] || n.reason}
                                            {n.reasons?.length ? `: ${n.reasons.map((r) => REASON_TEXT[r] || r).join(', ')}` : ''}
                                        </span>
                                        {n.reason === 'hidden-in-row' && (
                                            <button type="button" onClick={() => unhide(n._id)} className="flex items-center gap-1 rounded-lg border border-edge-subtle px-1.5 py-0.5 text-[10px]"><Eye size={10} /> Unhide</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </main>
            </div>
        </div>
    );
}
