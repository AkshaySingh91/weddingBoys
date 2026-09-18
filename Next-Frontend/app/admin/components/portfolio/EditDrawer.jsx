'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Trash, FilmSlate, ImageSquare, ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { cn } from '@/lib/utils.js';
import { posterOf, nameOf } from './PortfolioCard.jsx';

const field = 'w-full rounded-lg border border-[#E5DCD3] bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#8C532B] focus:ring-2 focus:ring-[#8C532B]/15';
const label = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500';

/** `<input type="date">` needs yyyy-mm-dd; the API returns an ISO timestamp. */
const toDateInput = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
};

const initialForm = (item) => ({
    title: item.title || '',
    caption: item.caption || '',
    eventGroup: item.eventGroup || '',
    tags: [...(item.tags || [])],
    shootDate: toDateInput(item.shootDate),
    location: { ...(item.location || {}) },
    generalPriority: item.generalPriority ?? 0,
    isHero: Boolean(item.isHero),
    heroPriority: item.heroPriority ?? 0,
    status: item.status || 'Published',
    credits: (item.credits || []).map((c) => ({ name: c.name || '', role: c.role || '' })),
});

/**
 * The caller MUST pass `key={item._id}` so opening a different item remounts
 * this drawer. That is what resets the form — copying props into state from an
 * effect instead would render one frame of the previous item's values.
 */
export default function EditDrawer({ item, vocabulary, saving, onClose, onSave, onDelete }) {
    const [form, setForm] = useState(() => initialForm(item));
    const [tagInput, setTagInput] = useState('');

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setLoc = (k, v) => setForm((f) => ({ ...f, location: { ...f.location, [k]: v } }));

    const addTag = (raw) => {
        const t = raw.trim();
        if (!t) return;
        setForm((f) => (f.tags.includes(t) ? f : { ...f, tags: [...f.tags, t] }));
        setTagInput('');
    };

    const submit = () => {
        onSave(item._id, {
            ...form,
            eventGroup: form.eventGroup || '',
            // Empty string would fail the Date cast; null clears it.
            shootDate: form.shootDate || null,
            generalPriority: Number(form.generalPriority) || 0,
            heroPriority: Number(form.heroPriority) || 0,
            // Only films appear in the hero carousel.
            isHero: item.kind === 'Video' ? form.isHero : false,
            credits: form.credits.filter((c) => c.name || c.role),
        });
    };

    const poster = posterOf(item);
    const publicHref = item.kind === 'Video' ? `/films/${item._id}` : `/photos/${item._id}`;
    const unused = (vocabulary || []).filter((t) => !form.tags.includes(t));

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button
                type="button"
                aria-label="Close editor"
                onClick={onClose}
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
            />
            <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[#E5DCD3] bg-[#FCFAF7] shadow-2xl">
                <header className="flex shrink-0 items-center justify-between border-b border-[#E5DCD3] px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">{nameOf(item)}</p>
                        <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            {item.kind === 'Video' ? <FilmSlate size={11} /> : <ImageSquare size={11} />}
                            {item.kind}
                            {item.mediaId && <span className="font-mono">· {item.mediaId}</span>}
                        </p>
                    </div>
                    <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close">
                        <X size={15} />
                    </Button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-stone-100">
                        {poster ? (
                            <Image src={poster} alt={item.title || 'preview'} fill sizes="400px" className="object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-stone-400">
                                <ImageSquare size={28} />
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className={label}>Event Ceremony / Theme</span>
                            {form.eventGroup && (
                                <button
                                    type="button"
                                    onClick={() => set('eventGroup', '')}
                                    className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                            {['Haldi', 'Mehendi', 'Sangeet', 'Wedding / Pheras', 'Reception', 'Pre-Wedding', 'Candid & Portraits'].map((grp) => (
                                <button
                                    key={grp}
                                    type="button"
                                    onClick={() => set('eventGroup', form.eventGroup === grp ? '' : grp)}
                                    className={cn(
                                        'rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition text-left border cursor-pointer',
                                        form.eventGroup === grp
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
                                            : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                                    )}
                                >
                                    {grp}
                                </button>
                            ))}
                        </div>
                        <input
                            className={field}
                            value={form.eventGroup || ''}
                            placeholder="Or enter custom ceremony (e.g. Cocktail, Baraat)..."
                            onChange={(e) => set('eventGroup', e.target.value)}
                        />
                    </div>

                    <div>
                        <span className={label}>Title</span>
                        <input className={field} value={form.title} onChange={(e) => set('title', e.target.value)} />
                    </div>

                    <div>
                        <span className={label}>Caption</span>
                        <textarea rows={2} className={field} value={form.caption} onChange={(e) => set('caption', e.target.value)} />
                    </div>

                    <div>
                        <span className={label}>Tags — these decide which rows it appears in</span>
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {form.tags.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                                    className="group flex items-center gap-1 rounded-md border border-[#E8D7C5] bg-[#FAF1E6] px-2 py-0.5 text-[11px] text-[#74583E] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                                >
                                    {t} <X size={9} />
                                </button>
                            ))}
                            {!form.tags.length && <span className="text-[11px] text-stone-400">None yet</span>}
                        </div>
                        <input
                            className={field}
                            value={tagInput}
                            placeholder="Type a tag and press Enter"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
                            }}
                        />
                        {unused.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {unused.slice(0, 14).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => addTag(t)}
                                        className="rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-stone-600 hover:border-[#8C532B] hover:text-[#8C532B]"
                                    >
                                        + {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className={label}>Shoot date</span>
                            <input type="date" className={field} value={form.shootDate} onChange={(e) => set('shootDate', e.target.value)} />
                        </div>
                        <div>
                            <span className={label}>Status</span>
                            <select className={field} value={form.status} onChange={(e) => set('status', e.target.value)}>
                                <option value="Published">Published</option>
                                <option value="Draft">Draft</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className={label}>City</span>
                            <input className={field} value={form.location.city || ''} onChange={(e) => setLoc('city', e.target.value)} />
                        </div>
                        <div>
                            <span className={label}>State</span>
                            <input className={field} value={form.location.state || ''} onChange={(e) => setLoc('state', e.target.value)} />
                        </div>
                        <div>
                            <span className={label}>Country</span>
                            <input className={field} value={form.location.country || ''} onChange={(e) => setLoc('country', e.target.value)} />
                        </div>
                        <div>
                            <span className={label}>Venue</span>
                            <input className={field} value={form.location.venue || ''} onChange={(e) => setLoc('venue', e.target.value)} />
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#E5DCD3] bg-white p-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className={label}>Priority</span>
                                <input type="number" className={field} value={form.generalPriority} onChange={(e) => set('generalPriority', e.target.value)} />
                            </div>
                            {item.kind === 'Video' && (
                                <div>
                                    <span className={label}>Hero priority</span>
                                    <input type="number" className={field} value={form.heroPriority} onChange={(e) => set('heroPriority', e.target.value)} disabled={!form.isHero} />
                                </div>
                            )}
                        </div>
                        {item.kind === 'Video' && (
                            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-stone-700">
                                <input type="checkbox" checked={form.isHero} onChange={(e) => set('isHero', e.target.checked)} className="h-3.5 w-3.5 accent-[#8C532B]" />
                                Show in the homepage hero carousel
                            </label>
                        )}
                        <p className="mt-2 text-[10px] leading-relaxed text-stone-500">
                            Higher priority sorts first. Hero films are ordered by hero priority, above everything else.
                        </p>
                    </div>

                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <span className={label}>Behind the scenes credits</span>
                            <button
                                type="button"
                                onClick={() => set('credits', [...form.credits, { name: '', role: '' }])}
                                className="text-[11px] font-medium text-[#8C532B] hover:underline"
                            >
                                + Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.credits.map((c, idx) => (
                                // Rows are positional and can be blank, so index is the only stable key.
                                <div key={idx} className="flex gap-2">
                                    <input
                                        className={field}
                                        placeholder="Name"
                                        value={c.name}
                                        onChange={(e) => set('credits', form.credits.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                                    />
                                    <input
                                        className={field}
                                        placeholder="Role"
                                        value={c.role}
                                        onChange={(e) => set('credits', form.credits.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x)))}
                                    />
                                    <Button variant="ghost" size="iconSm" onClick={() => set('credits', form.credits.filter((_, i) => i !== idx))} aria-label="Remove credit">
                                        <X size={13} />
                                    </Button>
                                </div>
                            ))}
                            {!form.credits.length && <p className="text-[11px] text-stone-400">No credits recorded.</p>}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-[#E5DCD3] pt-3">
                        <a
                            href={publicHref}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-[#8C532B]"
                        >
                            <ArrowSquareOut size={12} /> View public page
                        </a>
                        {item.legacy?.subdocId && (
                            <Badge size="sm" variant="neutral">migrated</Badge>
                        )}
                    </div>
                </div>

                <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-[#E5DCD3] bg-white px-4 py-3">
                    <Button variant="danger" size="sm" icon={Trash} onClick={() => onDelete(item)}>
                        Remove
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                        <Button variant="gold" size="sm" loading={saving} onClick={submit}>Save changes</Button>
                    </div>
                </footer>
            </aside>
        </div>
    );
}
