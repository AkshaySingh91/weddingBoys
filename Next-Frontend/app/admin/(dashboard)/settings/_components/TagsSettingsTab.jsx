'use client';

import { useEffect, useState } from 'react';
import {
    Tag as TagIcon, Plus, ArrowUp, ArrowDown, PencilSimple, Trash, ArrowsMerge,
    ArrowBendUpRight, Eye, EyeSlash, ArrowCounterClockwise, WarningCircle, Check, X,
} from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';

const field = 'h-8 rounded-lg border border-edge-strong bg-white px-2.5 text-xs outline-none focus:border-accent';
const iconBtn = 'flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ground-sunk hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent';

// Full class names, so Tailwind generates them (a built `bg-${c}-400` would not be).
const DOT = {
    amber: 'bg-amber-400', emerald: 'bg-emerald-400', purple: 'bg-purple-400', indigo: 'bg-indigo-400',
    rose: 'bg-rose-400', gold: 'bg-amber-500', sky: 'bg-sky-400', neutral: 'bg-stone-400',
};

const usageText = (u = {}) => {
    const parts = [];
    if (u.Video) parts.push(`${u.Video} film${u.Video === 1 ? '' : 's'}`);
    if (u.Photo) parts.push(`${u.Photo} photo${u.Photo === 1 ? '' : 's'}`);
    return parts.join(' · ') || 'unused';
};

/**
 * Settings › Portfolio Tags: the one tag system (Backend/Services/taxonomy.js).
 * Replaces the old category editor and the Ceremonies tab — ceremonies are the
 * Ceremony group here. Films and photos store tag ids, so a rename or merge is
 * safe and every change below can be undone.
 */
export default function TagsSettingsTab() {
    const tax = useTaxonomy();
    const [busy, setBusy] = useState(false);
    const [ops, setOps] = useState([]);
    const [showGroupForm, setShowGroupForm] = useState(false);

    const loadOps = async () => {
        const r = await tax.listOperations();
        if (r.ok) setOps(r.data.operations || []);
    };
    useEffect(() => {
        let cancelled = false;
        tax.listOperations().then((r) => { if (!cancelled && r.ok) setOps(r.data.operations || []); });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
    }, []);

    /** Runs an operation and reports it; returns the response. */
    const act = async (fn, success) => {
        setBusy(true);
        try {
            const r = await fn();
            if (r.ok) {
                if (success) fireMessage(typeof success === 'function' ? success(r) : success, 'success');
                loadOps();
            } else {
                fireMessage(r.message || 'That did not work', 'error');
            }
            return r;
        } finally {
            setBusy(false);
        }
    };

    if (tax.loading) return <p className="text-sm text-ink-muted">Loading tags…</p>;
    if (tax.error) return <p className="text-sm text-rose-600">{tax.error}</p>;

    const visibleGroups = tax.groups;
    const moveGroup = (idx, dir) => {
        const ids = visibleGroups.map((g) => g._id);
        const j = idx + dir;
        if (j < 0 || j >= ids.length) return;
        [ids[idx], ids[j]] = [ids[j], ids[idx]];
        act(() => tax.reorderGroups(ids));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge-subtle pb-4">
                <div>
                    <h2 className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight text-ink">
                        <TagIcon size={20} className="text-accent-ink" weight="duotone" />
                        Portfolio Tags
                    </h2>
                    <p className="mt-0.5 max-w-2xl text-xs text-ink-muted">
                        Every tag a film or photo can carry, in groups. Ceremony and Film type allow one per item; the other
                        groups any number. Rows on the site (home films, the films page) pick tags from here.
                    </p>
                </div>
                <Button variant="terracotta" size="sm" icon={Plus} onClick={() => setShowGroupForm((v) => !v)}>New group</Button>
            </div>

            {tax.legacyReads && (
                <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <WarningCircle size={16} className="mt-0.5 shrink-0" />
                    <p>
                        The live site still finds films by the tag&apos;s <em>name</em> until the portfolio switch. Until then,
                        renaming, merging or deleting a tag that is in use is locked (it would empty those rows). Adding,
                        moving, reordering and hiding work now.
                    </p>
                </div>
            )}

            {showGroupForm && <NewGroupForm busy={busy} onCancel={() => setShowGroupForm(false)}
                onCreate={async (body) => {
                    const r = await act(() => tax.createGroup(body), `Group "${body.label}" created`);
                    if (r.ok) setShowGroupForm(false);
                }} />}

            <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <div className="space-y-4">
                    {visibleGroups.map((g, idx) => (
                        <GroupCard key={g._id} group={g} tax={tax} busy={busy} act={act}
                            canUp={idx > 0} canDown={idx < visibleGroups.length - 1}
                            onUp={() => moveGroup(idx, -1)} onDown={() => moveGroup(idx, 1)} />
                    ))}
                </div>
                <RecentChanges ops={ops} busy={busy}
                    onUndo={(op) => act(() => tax.undo(op._id), `Undone: ${op.summary}`)} />
            </div>
        </div>
    );
}

function NewGroupForm({ busy, onCreate, onCancel }) {
    const [label, setLabel] = useState('');
    const [cardinality, setCardinality] = useState('multi');
    const [appliesTo, setAppliesTo] = useState(['Video', 'Photo']);
    const toggleKind = (k) => setAppliesTo((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); if (label.trim()) onCreate({ label: label.trim(), cardinality, appliesTo }); }}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-accent/30 bg-ground/50 p-4"
        >
            <label className="space-y-1">
                <span className="block text-[11px] font-semibold text-ink-secondary">Group name</span>
                <input autoFocus className={cn(field, 'w-56')} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Style, Venue type" />
            </label>
            <label className="space-y-1">
                <span className="block text-[11px] font-semibold text-ink-secondary">Per item</span>
                <select className={field} value={cardinality} onChange={(e) => setCardinality(e.target.value)}>
                    <option value="multi">Any number</option>
                    <option value="single">One only</option>
                </select>
            </label>
            <div className="space-y-1">
                <span className="block text-[11px] font-semibold text-ink-secondary">For</span>
                <div className="flex gap-3 pb-1.5 text-xs">
                    {['Video', 'Photo'].map((k) => (
                        <label key={k} className="flex items-center gap-1.5">
                            <input type="checkbox" checked={appliesTo.includes(k)} onChange={() => toggleKind(k)} />
                            {k === 'Video' ? 'Films' : 'Photos'}
                        </label>
                    ))}
                </div>
            </div>
            <Button type="submit" variant="primary" size="sm" loading={busy} disabled={!label.trim() || !appliesTo.length}>Create group</Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </form>
    );
}

function GroupCard({ group, tax, busy, act, canUp, canDown, onUp, onDown }) {
    const [newTag, setNewTag] = useState('');
    const [renaming, setRenaming] = useState(false);
    const [groupLabel, setGroupLabel] = useState(group.label);
    const tags = group.tags || [];

    const moveTagOrder = (idx, dir) => {
        const ids = tags.map((t) => t._id);
        const j = idx + dir;
        if (j < 0 || j >= ids.length) return;
        [ids[idx], ids[j]] = [ids[j], ids[idx]];
        act(() => tax.reorderTags(group._id, ids));
    };

    return (
        <section className={cn('rounded-xl border bg-white', group.hidden ? 'border-dashed border-edge-strong' : 'border-edge-subtle')}>
            <header className="flex flex-wrap items-center gap-2 border-b border-edge-subtle px-4 py-3">
                {renaming ? (
                    <form className="flex items-center gap-1.5" onSubmit={async (e) => {
                        e.preventDefault();
                        const r = await act(() => tax.updateGroup(group._id, { label: groupLabel }), 'Group renamed');
                        if (r.ok) setRenaming(false);
                    }}>
                        <input autoFocus className={cn(field, 'w-48')} value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)} />
                        <button type="submit" className={iconBtn} aria-label="Save"><Check size={14} /></button>
                        <button type="button" className={iconBtn} aria-label="Cancel" onClick={() => { setRenaming(false); setGroupLabel(group.label); }}><X size={14} /></button>
                    </form>
                ) : (
                    <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
                )}
                <Badge size="sm" variant={group.cardinality === 'single' ? 'warning' : 'neutral'}>
                    {group.cardinality === 'single' ? 'One per item' : 'Any number'}
                </Badge>
                <Badge size="sm" variant="outline">
                    {group.appliesTo?.length === 2 ? 'Films & photos' : group.appliesTo?.[0] === 'Video' ? 'Films only' : 'Photos only'}
                </Badge>
                {group.hidden && <Badge size="sm" variant="neutral">Hidden from filters</Badge>}
                <div className="ml-auto flex items-center">
                    {!renaming && <button type="button" className={iconBtn} aria-label="Rename group" onClick={() => setRenaming(true)}><PencilSimple size={14} /></button>}
                    <button type="button" className={iconBtn} aria-label={group.hidden ? 'Show group' : 'Hide group'} disabled={busy}
                        onClick={() => act(() => tax.updateGroup(group._id, { hidden: !group.hidden }), group.hidden ? 'Group shown' : 'Group hidden from filters')}>
                        {group.hidden ? <Eye size={14} /> : <EyeSlash size={14} />}
                    </button>
                    <button type="button" className={iconBtn} aria-label="Move group up" disabled={!canUp || busy} onClick={onUp}><ArrowUp size={14} /></button>
                    <button type="button" className={iconBtn} aria-label="Move group down" disabled={!canDown || busy} onClick={onDown}><ArrowDown size={14} /></button>
                    {!group.system && !tags.length && (
                        <button type="button" className={iconBtn} aria-label="Delete group" disabled={busy}
                            onClick={() => act(() => tax.deleteGroup(group._id), `Group "${group.label}" deleted`)}><Trash size={14} /></button>
                    )}
                </div>
                {group.description && <p className="w-full text-[11px] text-ink-muted">{group.description}</p>}
            </header>

            <ul className="divide-y divide-edge-subtle">
                {tags.map((t, idx) => (
                    <TagRow key={t._id} tag={t} group={group} tax={tax} busy={busy} act={act}
                        canUp={idx > 0} canDown={idx < tags.length - 1}
                        onUp={() => moveTagOrder(idx, -1)} onDown={() => moveTagOrder(idx, 1)} />
                ))}
                {!tags.length && <li className="px-4 py-3 text-xs text-ink-muted">No tags yet.</li>}
            </ul>

            {!group.hidden && (
                <form className="flex gap-2 border-t border-edge-subtle px-4 py-3" onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newTag.trim()) return;
                    const r = await act(() => tax.createTag(group._id, newTag.trim()).then(async (res) => { if (res.ok) await tax.reload(); return res; }), `Added "${newTag.trim()}"`);
                    if (r.ok) setNewTag('');
                }}>
                    <input className={cn(field, 'flex-1')} value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder={`Add to ${group.label}…`} />
                    <Button type="submit" variant="secondary" size="sm" icon={Plus} disabled={!newTag.trim() || busy}>Add</Button>
                </form>
            )}
        </section>
    );
}

function TagRow({ tag, group, tax, busy, act, canUp, canDown, onUp, onDown }) {
    const [mode, setMode] = useState(null); // 'rename' | 'merge' | 'move'
    const [label, setLabel] = useState(tag.label);
    const [into, setInto] = useState('');
    const [preview, setPreview] = useState(null);
    const [moveTo, setMoveTo] = useState('');
    const used = tag.usage?.total > 0;
    const siblings = (group.tags || []).filter((t) => t._id !== tag._id);
    const otherGroups = tax.groups.filter((g) => g._id !== group._id);

    const close = () => { setMode(null); setPreview(null); setInto(''); setMoveTo(''); setLabel(tag.label); };

    return (
        <li className="px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
                {tag.color && <span className={cn('h-2 w-2 rounded-full', DOT[tag.color] || DOT.neutral)} />}
                <span className={cn('text-sm', tag.hidden ? 'text-ink-muted line-through' : 'text-ink')}>{tag.label}</span>
                <span className="text-[11px] text-ink-muted">{usageText(tag.usage)}</span>
                {(tag.pageRows || []).map((row) => <Badge key={row} size="sm" variant="terracotta">Row: {row}</Badge>)}
                {tag.aliases?.length > 0 && <span className="text-[10px] text-ink-muted" title={tag.aliases.join(', ')}>also: {tag.aliases.slice(0, 2).join(', ')}{tag.aliases.length > 2 ? '…' : ''}</span>}
                <div className="ml-auto flex items-center">
                    <button type="button" className={iconBtn} aria-label="Rename" onClick={() => setMode(mode === 'rename' ? null : 'rename')}><PencilSimple size={13} /></button>
                    <button type="button" className={iconBtn} aria-label="Merge into another tag" disabled={!siblings.length} onClick={() => setMode(mode === 'merge' ? null : 'merge')}><ArrowsMerge size={13} /></button>
                    <button type="button" className={iconBtn} aria-label="Move to another group" onClick={() => setMode(mode === 'move' ? null : 'move')}><ArrowBendUpRight size={13} /></button>
                    <button type="button" className={iconBtn} aria-label={tag.hidden ? 'Show' : 'Hide'} disabled={busy}
                        onClick={() => act(() => tax.updateTag(tag._id, { hidden: !tag.hidden }), tag.hidden ? `"${tag.label}" shown` : `"${tag.label}" hidden from pickers and filters`)}>
                        {tag.hidden ? <Eye size={13} /> : <EyeSlash size={13} />}
                    </button>
                    <button type="button" className={iconBtn} aria-label="Move up" disabled={!canUp || busy} onClick={onUp}><ArrowUp size={13} /></button>
                    <button type="button" className={iconBtn} aria-label="Move down" disabled={!canDown || busy} onClick={onDown}><ArrowDown size={13} /></button>
                    <button type="button" className={iconBtn} disabled={busy || used || (tag.pageRows || []).length > 0}
                        aria-label={used ? 'In use: merge it instead' : 'Delete'}
                        title={used ? 'In use — merge it into another tag instead' : (tag.pageRows || []).length ? 'Remove its row first' : 'Delete'}
                        onClick={() => act(() => tax.deleteTag(tag._id), `Deleted "${tag.label}"`)}>
                        <Trash size={13} />
                    </button>
                </div>
            </div>

            {mode === 'rename' && (
                <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await act(() => tax.updateTag(tag._id, { label }), `Renamed to "${label.trim()}"`);
                    if (r.ok) close();
                }}>
                    <input autoFocus className={cn(field, 'w-56')} value={label} onChange={(e) => setLabel(e.target.value)} />
                    <Button type="submit" variant="primary" size="sm" disabled={busy || !label.trim() || label.trim() === tag.label}>Rename</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button>
                    <span className="w-full text-[11px] text-ink-muted">Every film and photo keeps it, rows follow the new name, and links with the old name still work.</span>
                </form>
            )}

            {mode === 'merge' && (
                <div className="mt-2 space-y-2 rounded-lg bg-ground p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ink-secondary">Merge <strong>{tag.label}</strong> into</span>
                        <select className={field} value={into} onChange={async (e) => {
                            setInto(e.target.value);
                            setPreview(null);
                            if (e.target.value) {
                                const r = await tax.mergeTag(tag._id, e.target.value, true);
                                if (r.ok) setPreview(r.data);
                            }
                        }}>
                            <option value="">Choose a tag…</option>
                            {siblings.map((t) => <option key={t._id} value={t._id}>{t.label}</option>)}
                        </select>
                        <Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button>
                    </div>
                    {preview && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                            <span>
                                {preview.items} item(s) move to the new tag{preview.alreadyHadTarget ? ` (${preview.alreadyHadTarget} already had it)` : ''}
                                {preview.pageRows?.length ? `; rows on ${preview.pageRows.join(', ')} follow` : ''}. &ldquo;{tag.label}&rdquo; keeps working as an old name.
                            </span>
                            <Button type="button" variant="dangerSolid" size="sm" disabled={busy}
                                onClick={async () => { const r = await act(() => tax.mergeTag(tag._id, into), (res) => `Merged ${res.data.items} item(s)`); if (r.ok) close(); }}>
                                Merge
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {mode === 'move' && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-ground p-3">
                    <span className="text-xs text-ink-secondary">Move <strong>{tag.label}</strong> to</span>
                    <select className={field} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                        <option value="">Choose a group…</option>
                        {otherGroups.map((g) => <option key={g._id} value={g._id}>{g.label}</option>)}
                    </select>
                    <Button type="button" variant="primary" size="sm" disabled={!moveTo || busy}
                        onClick={async () => { const r = await act(() => tax.moveTag(tag._id, moveTo), 'Moved'); if (r.ok) close(); }}>
                        Move
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button>
                </div>
            )}
        </li>
    );
}

function RecentChanges({ ops, busy, onUndo }) {
    return (
        <aside className="h-fit rounded-xl border border-edge-subtle bg-white xl:sticky xl:top-4">
            <h3 className="border-b border-edge-subtle px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Recent changes</h3>
            <ul className="divide-y divide-edge-subtle">
                {ops.map((op) => (
                    <li key={op._id} className="space-y-1 px-4 py-2.5">
                        <p className={cn('text-xs', op.undoneAt ? 'text-ink-muted line-through' : 'text-ink')}>{op.summary}</p>
                        <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                            <span>{new Date(op.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {op.by && <span>· {op.by.split('@')[0]}</span>}
                            {!op.undoneAt && (
                                <button type="button" disabled={busy} onClick={() => onUndo(op)}
                                    className="ml-auto flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-medium text-accent-ink hover:bg-ground disabled:opacity-40">
                                    <ArrowCounterClockwise size={11} /> Undo
                                </button>
                            )}
                        </div>
                    </li>
                ))}
                {!ops.length && <li className="px-4 py-3 text-xs text-ink-muted">No changes yet.</li>}
            </ul>
        </aside>
    );
}
