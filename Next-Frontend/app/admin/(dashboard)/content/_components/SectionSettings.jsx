'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormContext, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, X, Plus, ArrowSquareOut } from '@phosphor-icons/react';
import { apiJson } from '@/lib/apiClient.js';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';

/**
 * Settings for the sections that show portfolio content (plan phase 6;
 * Backend/Utils/sectionSettings.js validates them). Rows are chosen from
 * Admin › Rows; filter groups from Settings › Portfolio Tags.
 */
const FIELDS = {
    heroVideos: [{ name: 'collectionKey', kind: 'Video', type: 'row', label: 'Hero row' }],
    ourFilms: [
        { name: 'heading', type: 'text', label: 'Heading', placeholder: 'Our films' },
        { name: 'tabs', kind: 'Video', type: 'rows', label: 'Tabs (one row each)' },
        { name: 'defaultTab', type: 'defaultTab', label: 'Open on' },
    ],
    portfolio: [
        { name: 'heading', type: 'text', label: 'Heading', placeholder: 'Moments We’ve Captured' },
        { name: 'tabs', kind: 'Photo', type: 'rows', label: 'Tabs (one photo row each)' },
    ],
    filmRows: [
        { name: 'rows', kind: 'Video', type: 'rows', label: 'Rows, top to bottom' },
        { name: 'dedupe', type: 'check', label: 'Never show a film twice on the page (a later row skips it)' },
    ],
    browseFilms: [
        { name: 'facetGroups', kind: 'Video', type: 'groups', label: 'Filters offered (none chosen = every category)' },
        { name: 'sort', type: 'sort', label: 'Order' },
        { name: 'pageSize', type: 'number', label: 'Films per page', min: 6, max: 48 },
    ],
    photoGallery: [
        { name: 'facetGroups', kind: 'Photo', type: 'groups', label: 'Filter chips (none chosen = the gallery keeps its own)' },
        { name: 'sort', type: 'sort', label: 'Order' },
        { name: 'pageSize', type: 'number', label: 'Photos per page', min: 6, max: 60 },
    ],
};

const SORTS = [['newestShoot', 'Newest shoot first'], ['newestPublished', 'Newest published first'], ['featured', 'Featured first (spotlight)']];
const input = 'h-9 w-full rounded-lg border border-edge-strong bg-white px-3 text-sm outline-none focus:border-accent';
const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted';

export const hasSectionSettings = (component) => Boolean(FIELDS[component]);

export default function SectionSettings({ base, component, pageKey }) {
    const { control, setValue } = useFormContext();
    const settings = useWatch({ control, name: `${base}.settings` }) || {};
    const { data: rows = [] } = useQuery({
        queryKey: ['collections'],
        queryFn: () => apiJson('/api/admin/collections').then((d) => d.collections || []),
        staleTime: 30_000,
    });
    const taxonomy = useTaxonomy();
    const [preview, setPreview] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const fields = FIELDS[component];
    if (!fields) return null;

    const set = (name, value) => setValue(`${base}.settings.${name}`, value, { shouldDirty: true });
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const runPreview = async () => {
        setPreviewing(true);
        try {
            const d = await apiJson(`/api/admin/content/${pageKey}/preview`, {
                method: 'POST',
                body: JSON.stringify({ blocks: [{ key: 'preview', type: 'section', settings: { ...settings, component } }] }),
            });
            setPreview(d.sections?.[0]?.data || null);
        } catch (e) {
            setPreview({ error: e.message });
        } finally {
            setPreviewing(false);
        }
    };

    return (
        <div className="mt-3 space-y-4 rounded-xl border border-edge-subtle bg-ground/60 p-4">
            {fields.map((f) => {
                const value = settings[f.name];
                if (f.type === 'text') {
                    return (
                        <label key={f.name} className="block">
                            <span className={labelCls}>{f.label}</span>
                            <input className={input} value={value || ''} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
                        </label>
                    );
                }
                if (f.type === 'number') {
                    return (
                        <label key={f.name} className="block max-w-[200px]">
                            <span className={labelCls}>{f.label}</span>
                            <input type="number" min={f.min} max={f.max} className={input} value={value ?? ''} onChange={(e) => set(f.name, e.target.value === '' ? undefined : Number(e.target.value))} />
                        </label>
                    );
                }
                if (f.type === 'check') {
                    return (
                        <label key={f.name} className="flex items-center gap-2 text-xs text-ink-secondary">
                            <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(f.name, e.target.checked)} /> {f.label}
                        </label>
                    );
                }
                if (f.type === 'sort') {
                    return (
                        <label key={f.name} className="block max-w-xs">
                            <span className={labelCls}>{f.label}</span>
                            <select className={input} value={value || 'newestShoot'} onChange={(e) => set(f.name, e.target.value)}>
                                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </label>
                    );
                }
                if (f.type === 'row') {
                    const options = rows.filter((r) => r.kind === f.kind);
                    return (
                        <label key={f.name} className="block max-w-sm">
                            <span className={labelCls}>{f.label}</span>
                            <select className={input} value={value || ''} onChange={(e) => set(f.name, e.target.value)}>
                                {options.map((r) => <option key={r.key} value={r.key}>{r.title} ({r.key})</option>)}
                            </select>
                        </label>
                    );
                }
                if (f.type === 'defaultTab') {
                    const tabs = settings.tabs || [];
                    return (
                        <label key={f.name} className="block max-w-sm">
                            <span className={labelCls}>{f.label}</span>
                            <select className={input} value={value || ''} onChange={(e) => set(f.name, e.target.value || undefined)}>
                                <option value="">The first tab</option>
                                {tabs.map((k) => <option key={k} value={k}>{byKey.get(k)?.title || k}</option>)}
                            </select>
                        </label>
                    );
                }
                if (f.type === 'rows') {
                    const list = Array.isArray(value) ? value : [];
                    const options = rows.filter((r) => r.kind === f.kind && !list.includes(r.key));
                    const move = (i, d) => { const next = [...list]; [next[i], next[i + d]] = [next[i + d], next[i]]; set(f.name, next); };
                    return (
                        <div key={f.name}>
                            <span className={labelCls}>{f.label}</span>
                            <ul className="space-y-1">
                                {list.map((k, i) => {
                                    const r = byKey.get(k);
                                    return (
                                        <li key={k} className="flex items-center gap-2 rounded-lg border border-edge-subtle bg-white px-2.5 py-1.5 text-xs">
                                            <span className="w-5 text-center text-ink-muted">{i + 1}</span>
                                            <span className="flex-1 truncate">{r ? r.title : <span className="text-rose-600">{k} (missing)</span>}
                                                {r && <span className="ml-1 text-ink-muted">· {r.shown}/{r.limit}{r.status === 'Draft' ? ' · draft row' : ''}</span>}
                                            </span>
                                            {r && <Link href={`/admin/collections/${r._id}`} target="_blank" className="text-accent-ink hover:underline" title="Edit this row"><ArrowSquareOut size={13} /></Link>}
                                            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="p-0.5 disabled:opacity-30" aria-label="Up"><ArrowUp size={13} /></button>
                                            <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="p-0.5 disabled:opacity-30" aria-label="Down"><ArrowDown size={13} /></button>
                                            <button type="button" onClick={() => set(f.name, list.filter((x) => x !== k))} className="p-0.5 text-ink-muted hover:text-rose-600" aria-label="Remove"><X size={13} /></button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <select className="h-8 rounded-lg border border-edge-strong bg-white px-2 text-xs" value="" onChange={(e) => e.target.value && set(f.name, [...list, e.target.value])}>
                                    <option value="">Add a row…</option>
                                    {options.map((r) => <option key={r.key} value={r.key}>{r.title} ({r.key})</option>)}
                                </select>
                                <Link href="/admin/collections" target="_blank" className="inline-flex items-center gap-1 text-xs text-accent-ink hover:underline"><Plus size={12} /> New row</Link>
                            </div>
                        </div>
                    );
                }
                if (f.type === 'groups') {
                    const list = Array.isArray(value) ? value : [];
                    const groups = taxonomy.groupsFor(f.kind);
                    return (
                        <div key={f.name}>
                            <span className={labelCls}>{f.label}</span>
                            <div className="flex flex-wrap gap-1.5">
                                {groups.map((g) => {
                                    const at = list.indexOf(g.key);
                                    return (
                                        <button key={g.key} type="button"
                                            onClick={() => set(f.name, at >= 0 ? list.filter((x) => x !== g.key) : [...list, g.key])}
                                            className={`rounded-full border px-2.5 py-1 text-xs ${at >= 0 ? 'border-accent bg-accent text-white' : 'border-edge-strong bg-white text-ink-secondary'}`}>
                                            {at >= 0 ? `${at + 1}. ` : ''}{g.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-1 text-[11px] text-ink-muted">Click in the order they should appear.</p>
                        </div>
                    );
                }
                return null;
            })}

            <div className="border-t border-edge-subtle pt-3">
                <button type="button" onClick={runPreview} disabled={previewing}
                    className="rounded-lg border border-edge-strong bg-white px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-ground disabled:opacity-50">
                    {previewing ? 'Resolving…' : 'Preview what this shows'}
                </button>
                {preview && <PreviewSummary data={preview} />}
            </div>
        </div>
    );
}

/** A compact read-out of the resolved section: rows, their films or photos, filters. */
function PreviewSummary({ data }) {
    if (data.error) return <p className="mt-2 text-xs text-rose-600">{data.error}</p>;
    const lists = data.rows || data.tabs || (data.slides ? [{ key: 'hero', title: 'Hero', items: data.slides }] : null);
    return (
        <div className="mt-3 space-y-3">
            {lists?.map((r) => (
                <div key={r.key}>
                    <p className="text-xs font-semibold text-ink">{r.title} <span className="font-normal text-ink-muted">· {r.items.length}</span></p>
                    <div className="mt-1 flex gap-1 overflow-x-auto">
                        {r.items.slice(0, 10).map((i, n) => {
                            const src = i.thumbnailUrl || i.posterUrl || i.url;
                            return (
                                <span key={n} className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-ground-sunk">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                                    {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                                </span>
                            );
                        })}
                        {!r.items.length && <span className="text-xs text-ink-muted">Empty</span>}
                    </div>
                </div>
            ))}
            {data.facets && (
                <p className="text-xs text-ink-secondary">Filters: {data.facets.map((f) => `${f.label} (${f.tags.length})`).join(', ') || 'none'} · {data.pageSize} per page</p>
            )}
        </div>
    );
}
