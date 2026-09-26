'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowUp, ArrowDown, PencilSimple, Trash, CopySimple } from '@phosphor-icons/react';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { Switch } from '@/app/admin/components/ui/Switch.jsx';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { BUILT_IN_PACKAGES } from '@/lib/builtInPackages.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const lines = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
const input = 'h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#D9342A]';
const area = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#D9342A]';
const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500';

async function call(path, options = {}) {
    const res = await fetch(`${api_url}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong');
    return data;
}

/** A built-in package (lib/builtInPackages.js) in the API's shape. */
const fromBuiltIn = (p, order) => ({
    name: p.title,
    category: 'wedding',
    tagline: p.tagline,
    description: p.description,
    originalPrice: p.total,
    discountedPrice: p.offer,
    team: p.team,
    includes: p.includes,
    recommendedFor: p.recommendedFor,
    isFeatured: Boolean(p.isPopular),
    isActive: true,
    order,
});

const EMPTY = { name: '', tagline: '', description: '', originalPrice: '', discountedPrice: '', team: '', included: '', excluded: '', recommendedFor: '', isFeatured: false, isActive: true };

/** The editor's form state for a package, and back. */
const toForm = (p) => ({
    name: p.name || '',
    tagline: p.tagline || '',
    description: p.description || '',
    originalPrice: p.originalPrice ?? '',
    discountedPrice: p.discountedPrice ?? '',
    team: (p.team || []).join('\n'),
    included: (p.includes || []).filter((i) => i.included !== false).map((i) => i.text).join('\n'),
    excluded: (p.includes || []).filter((i) => i.included === false).map((i) => i.text).join('\n'),
    recommendedFor: p.recommendedFor || '',
    isFeatured: Boolean(p.isFeatured),
    isActive: p.isActive !== false,
});
const fromForm = (f) => ({
    name: f.name.trim(),
    tagline: f.tagline.trim(),
    description: f.description.trim(),
    originalPrice: Number(f.originalPrice),
    discountedPrice: f.discountedPrice === '' ? null : Number(f.discountedPrice),
    team: lines(f.team),
    includes: [...lines(f.included).map((text) => ({ text, included: true })), ...lines(f.excluded).map((text) => ({ text, included: false }))],
    recommendedFor: f.recommendedFor.trim(),
    isFeatured: f.isFeatured,
    isActive: f.isActive,
});

/**
 * Pricing (plan phase 7): the packages in the home "Our packages" section.
 * Until the first one exists the site shows its four built-in packages; from
 * then on it shows exactly the visible ones here, in this order.
 */
export default function PricingPage() {
    const [list, setList] = useState(null);
    const [editing, setEditing] = useState(null);   // { id|null, form }
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // Bumped to reload the list after a change.
    const [version, setVersion] = useState(0);
    const load = useCallback(() => setVersion((v) => v + 1), []);
    useEffect(() => {
        let cancelled = false;
        call('/api/admin/pricing')
            .then((d) => { if (!cancelled) setList(d.packages || []); })
            .catch((e) => { if (!cancelled) { fireMessage(e.message, 'error'); setList([]); } });
        return () => { cancelled = true; };
    }, [version]);

    const save = async () => {
        const body = fromForm(editing.form);
        if (!body.name) return fireMessage('Give the package a name', 'error');
        if (!Number.isFinite(body.originalPrice) || body.originalPrice <= 0) return fireMessage('Enter the full price', 'error');
        if (body.discountedPrice !== null && !(body.discountedPrice > 0 && body.discountedPrice <= body.originalPrice)) {
            return fireMessage('The offer price must be above zero and no more than the full price', 'error');
        }
        setSaving(true);
        try {
            await call(editing.id ? `/api/admin/pricing/${editing.id}` : '/api/admin/pricing', {
                method: editing.id ? 'PUT' : 'POST',
                body: JSON.stringify(body),
            });
            fireMessage(editing.id ? 'Package saved' : 'Package added', 'success');
            setEditing(null);
            load();
        } catch (e) {
            fireMessage(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const patch = async (p, changes) => {
        try {
            await call(`/api/admin/pricing/${p._id}`, { method: 'PUT', body: JSON.stringify(changes) });
            load();
        } catch (e) {
            fireMessage(e.message, 'error');
        }
    };

    const move = async (i, d) => {
        const next = [...list];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        setList(next);
        try {
            setList((await call('/api/admin/pricing/reorder', { method: 'PUT', body: JSON.stringify({ order: next.map((p) => p._id) }) })).packages);
        } catch (e) {
            fireMessage(e.message, 'error');
            load();
        }
    };

    const remove = async () => {
        try {
            await call(`/api/admin/pricing/${deleting._id}`, { method: 'DELETE' });
            fireMessage('Package deleted', 'success');
            setDeleting(null);
            load();
        } catch (e) {
            fireMessage(e.message, 'error');
        }
    };

    const copyBuiltIn = async () => {
        setSaving(true);
        try {
            for (const [i, p] of BUILT_IN_PACKAGES.entries()) {
                await call('/api/admin/pricing', { method: 'POST', body: JSON.stringify(fromBuiltIn(p, i)) });
            }
            fireMessage('The site’s four packages are here to edit', 'success');
            load();
        } catch (e) {
            fireMessage(e.message, 'error');
            load();
        } finally {
            setSaving(false);
        }
    };

    const set = (k, v) => setEditing((e) => ({ ...e, form: { ...e.form, [k]: v } }));
    const visible = list?.filter((p) => p.isActive).length ?? 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pricing"
                subtitle="The packages in the home page’s “Our packages” section, in this order. Hidden packages stay here but leave the site."
                breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Pricing' }]}
            >
                <Button variant="terracotta" size="sm" icon={Plus} onClick={() => setEditing({ id: null, form: { ...EMPTY } })}>New package</Button>
            </PageHeader>

            {!list ? <p className="text-sm text-stone-500">Loading…</p> : list.length === 0 ? (
                <div className="rounded-2xl border border-[#E7E2DA] bg-white p-6 space-y-3">
                    <h2 className="font-serif text-xl text-[#1C1917]">No packages yet</h2>
                    <p className="text-sm text-[#57534E] max-w-2xl">
                        The site shows its four built-in packages until the first one is added here. Copy them in to edit them, or start from scratch. From the first package on, the site shows only what is here.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" icon={CopySimple} onClick={copyBuiltIn} loading={saving}>Copy the site’s packages</Button>
                    </div>
                </div>
            ) : (
                <>
                    {visible === 0 && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Every package is hidden, so the section shows no packages. Turn one on, or hide the section in <Link href="/admin/content/home" className="font-semibold underline">the home page composition</Link>.
                        </p>
                    )}
                    <ul className="space-y-3">
                        {list.map((p, i) => {
                            const save = p.discountedPrice && p.discountedPrice < p.originalPrice;
                            return (
                                <li key={p._id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-studio-border bg-white p-4 ${p.isActive ? '' : 'opacity-60'}`}>
                                    <div className="flex flex-col">
                                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
                                        <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
                                    </div>
                                    <div className="min-w-[220px] flex-1">
                                        <p className="flex flex-wrap items-center gap-2 font-semibold text-stone-900">
                                            {p.name}
                                            {p.isFeatured && <Badge variant="terracotta">Popular</Badge>}
                                            {!p.isActive && <Badge variant="neutral">Hidden</Badge>}
                                        </p>
                                        {p.tagline && <p className="mt-0.5 text-xs text-stone-500">{p.tagline}</p>}
                                        <p className="mt-1 text-xs text-stone-600">
                                            {(p.team || []).length} crew, {(p.includes || []).filter((x) => x.included !== false).length} deliverables
                                        </p>
                                    </div>
                                    <p className="text-right">
                                        <span className="block text-lg font-semibold text-[#B92B22]">{rupees(save ? p.discountedPrice : p.originalPrice)}</span>
                                        {save && <span className="text-xs text-stone-400 line-through">{rupees(p.originalPrice)}</span>}
                                    </p>
                                    <label className="flex items-center gap-2 text-xs text-stone-600">
                                        <Switch checked={p.isActive} onChange={(v) => patch(p, { isActive: v })} aria-label="Show on the site" />
                                        On site
                                    </label>
                                    <div className="flex gap-1">
                                        <Button variant="secondary" size="sm" icon={PencilSimple} onClick={() => setEditing({ id: p._id, form: toForm(p) })}>Edit</Button>
                                        <Button variant="ghost" size="sm" icon={Trash} onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}

            <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editing?.id ? 'Edit package' : 'New package'}</DialogTitle>
                        <DialogDescription>The card shows the name, tagline, prices, crew size and the first four deliverables; “View full details” shows the rest.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="sm:col-span-2"><span className={labelCls}>Name</span>
                                <input className={input} value={editing.form.name} onChange={(e) => set('name', e.target.value)} placeholder="Premium 2-Day Wedding" /></label>
                            <label className="sm:col-span-2"><span className={labelCls}>Tagline</span>
                                <input className={input} value={editing.form.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
                            <label><span className={labelCls}>Full price (₹)</span>
                                <input type="number" min="0" className={input} value={editing.form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} /></label>
                            <label><span className={labelCls}>Offer price (₹, blank for none)</span>
                                <input type="number" min="0" className={input} value={editing.form.discountedPrice} onChange={(e) => set('discountedPrice', e.target.value)} /></label>
                            <label className="sm:col-span-2"><span className={labelCls}>Description</span>
                                <textarea rows={3} className={area} value={editing.form.description} onChange={(e) => set('description', e.target.value)} /></label>
                            <label className="sm:col-span-2"><span className={labelCls}>Recommended for</span>
                                <input className={input} value={editing.form.recommendedFor} onChange={(e) => set('recommendedFor', e.target.value)} /></label>
                            <label><span className={labelCls}>Crew (one per line)</span>
                                <textarea rows={5} className={area} value={editing.form.team} onChange={(e) => set('team', e.target.value)} placeholder={'2 Cinematographers\n1 Drone Pilot'} /></label>
                            <label><span className={labelCls}>Included (one per line)</span>
                                <textarea rows={5} className={area} value={editing.form.included} onChange={(e) => set('included', e.target.value)} /></label>
                            <label className="sm:col-span-2"><span className={labelCls}>Not included (one per line, shown crossed out)</span>
                                <textarea rows={3} className={area} value={editing.form.excluded} onChange={(e) => set('excluded', e.target.value)} /></label>
                            <label className="flex items-center gap-2 text-sm text-stone-700">
                                <Switch checked={editing.form.isFeatured} onChange={(v) => set('isFeatured', v)} /> Mark as popular
                            </label>
                            <label className="flex items-center gap-2 text-sm text-stone-700">
                                <Switch checked={editing.form.isActive} onChange={(v) => set('isActive', v)} /> Show on the site
                            </label>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={save} loading={saving}>{editing?.id ? 'Save' : 'Add package'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(deleting)} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
                        <DialogDescription>It leaves the site at once and cannot be restored. To take it off the site for now, switch it off instead.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>Keep it</Button>
                        <Button variant="dangerSolid" size="sm" onClick={remove}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
