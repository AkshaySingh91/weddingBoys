'use client';

import { useState } from 'react';
import { Plus, Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';
import { fireMessage } from '@/Utils/fireMessage.js';

/**
 * Tags for one film or photo, from the tag system (Hooks/useTaxonomy.jsx).
 *
 * One section per group the item's kind can use, in admin order:
 *   one-per-item groups (Ceremony, Film type) behave like radio buttons —
 *   picking one replaces the other; the rest toggle.
 * Tags from a hidden group (Unsorted) show only if the item already has them.
 * `allowCreate` adds an inline "add" per group.
 *
 *   <TagPicker taxonomy={tax} kind="Video" value={tagIds} onChange={setTagIds} />
 *
 * `free` drops the one-per-item rule: a row's rule may ask for "Haldi OR
 * Mehendi", which no single item could carry.
 */
export default function TagPicker({ taxonomy, kind, value = [], onChange, allowCreate = true, only, compact = false, free = false }) {
    const [adding, setAdding] = useState(null);   // group id with an open input
    const [draft, setDraft] = useState('');
    const selected = new Set((value || []).map(String));

    const groups = taxonomy.groupsFor(kind, { includeHidden: true })
        .filter((g) => !only || only.includes(g.key))
        .filter((g) => !g.hidden || (g.tags || []).some((t) => selected.has(t._id)));

    const toggle = (group, tagId) => {
        const inGroup = new Set((group.tags || []).map((t) => t._id));
        let next = [...selected];
        if (selected.has(tagId)) next = next.filter((id) => id !== tagId);
        else {
            if (group.cardinality === 'single' && !free) next = next.filter((id) => !inGroup.has(id));
            next.push(tagId);
        }
        onChange(next);
    };

    const create = async (group) => {
        const label = draft.trim();
        if (!label) { setAdding(null); return; }
        const r = await taxonomy.createTag(group._id, label);
        const id = r.ok ? r.tag._id : (r.status === 409 && r.data.existing) || null;
        if (!id) { fireMessage(r.message || 'Could not add the tag', 'error'); return; }
        setDraft('');
        setAdding(null);
        if (!selected.has(id)) toggle(group, id);
    };

    if (taxonomy.loading) return <p className="text-xs text-ink-muted">Loading tags…</p>;
    if (taxonomy.error) return <p className="text-xs text-rose-600">{taxonomy.error}</p>;

    return (
        <div className={cn('space-y-3', compact && 'space-y-2')}>
            {groups.map((g) => (
                <div key={g._id}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                        {g.label}
                        <span className="font-normal normal-case tracking-normal text-ink-muted">
                            {g.cardinality === 'single' && !free ? 'pick one' : 'any'}
                        </span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {(g.tags || []).filter((t) => !t.hidden || selected.has(t._id)).map((t) => {
                            const on = selected.has(t._id);
                            return (
                                <button
                                    key={t._id}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggle(g, t._id)}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                                        on
                                            ? 'border-accent bg-accent text-white'
                                            : 'border-edge-subtle bg-white text-ink-secondary hover:border-edge-strong',
                                    )}
                                >
                                    {on && <Check size={11} weight="bold" />}
                                    {t.label}
                                </button>
                            );
                        })}
                        {allowCreate && !g.hidden && (adding === g._id ? (
                            <input
                                autoFocus
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); create(g); }
                                    if (e.key === 'Escape') { setAdding(null); setDraft(''); }
                                }}
                                onBlur={() => create(g)}
                                placeholder={`New ${g.label.toLowerCase()}…`}
                                className="h-7 w-36 rounded-full border border-edge-strong px-2.5 text-xs outline-none focus:border-accent"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => { setAdding(g._id); setDraft(''); }}
                                className="inline-flex items-center gap-1 rounded-full border border-dashed border-edge-strong px-2.5 py-1 text-xs text-ink-muted hover:border-stone-500 hover:text-ink-secondary"
                            >
                                <Plus size={11} /> add
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
