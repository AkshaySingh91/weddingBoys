'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
    Star, ArrowUp, ArrowDown, X, Plus, FilmSlate, CircleNotch,
    MagnifyingGlass, Check,
} from '@phosphor-icons/react';
import usePortfolio from '@/Hooks/usePortfolio.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';


const posterOf = (i) => i?.render?.posterUrl || i?.render?.imageUrl || null;
const nameOf = (i) => {
    const n = i?.client?.clientName;
    return [n?.Bride, n?.Groom].filter(Boolean).join(' & ') || i?.clientNameText || 'Untitled';
};

/**
 * The homepage hero carousel, as an ordered list.
 *
 * Lives here because this is the homepage's own settings screen — the reel it
 * controls is previewed directly above. Saving replaces the whole set in one
 * call, which is deliberate: the original model appended per client, so editing
 * one wedding could silently clear every other wedding's slides.
 */
export default function HeroCarouselManager() {
    const {
        saveHeroSet, saving,
        heroSet, heroCandidates, heroLoading, fetchHeroSet,
    } = usePortfolio();

    // `null` means "showing exactly what the server has". Any reorder replaces it
    // with a working copy. Derived rather than mirrored into state by an effect,
    // so a refetch cannot briefly render the old order.
    const [draftOrder, setDraftOrder] = useState(null);
    const [picking, setPicking] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchHeroSet(); }, [fetchHeroSet]);

    const list = draftOrder ?? heroSet;
    const dirty = draftOrder !== null;
    const setList = setDraftOrder;
    const loading = heroLoading;
    const candidates = heroCandidates;

    const move = (idx, delta) => {
        const next = idx + delta;
        if (next < 0 || next >= list.length) return;
        const copy = [...list];
        [copy[idx], copy[next]] = [copy[next], copy[idx]];
        setList(copy);
    };

    const available = useMemo(() => {
        const chosen = new Set(list.map((l) => l._id));
        const q = search.trim().toLowerCase();
        return candidates
            .filter((c) => !chosen.has(c._id))
            .filter((c) => !q || nameOf(c).toLowerCase().includes(q) || (c.tags || []).some((t) => t.toLowerCase().includes(q)));
    }, [candidates, list, search]);

    const commit = async () => {
        const res = await saveHeroSet(list.map((l) => l._id));
        if (res) { setDraftOrder(null); fetchHeroSet(); }
    };

    return (
        <section className="rounded-2xl border border-[#E7E2DA] bg-white p-5">
            <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 font-serif text-xl text-[#1C1917]">
                        <Star size={17} weight="fill" className="text-[#C29555]" />
                        Hero carousel order
                    </h2>
                    <p className="mt-0.5 text-xs text-[#78716C]">
                        Top to bottom is the order visitors see. Only films can appear here.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" icon={Plus} onClick={() => setPicking((v) => !v)}>
                        {picking ? 'Done adding' : 'Add a film'}
                    </Button>
                    <Button variant="gold" size="sm" loading={saving} disabled={!dirty} onClick={commit}>
                        {dirty ? 'Save order' : 'Saved'}
                    </Button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-10 text-stone-400">
                    <CircleNotch size={20} className="animate-spin" />
                </div>
            ) : (
                <div className="space-y-2">
                    {list.length === 0 && (
                        <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">
                            No films in the carousel — the homepage falls back to its static hero.
                        </p>
                    )}

                    {list.map((item, idx) => {
                        const poster = posterOf(item);
                        return (
                            <div key={item._id} className="flex items-center gap-3 rounded-xl border border-[#E7E2DA] bg-[#FCFAF7] p-2">
                                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-stone-400">{idx + 1}</span>
                                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                                    {poster ? (
                                        <Image src={poster} alt={nameOf(item)} fill sizes="80px" className="object-cover" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-stone-400"><FilmSlate size={16} /></span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-stone-800">{nameOf(item)}</p>
                                    <p className="truncate text-[10px] text-stone-500">{(item.tags || []).slice(0, 3).join(' · ') || 'No tags'}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-0.5">
                                    <Button variant="ghost" size="iconSm" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up"><ArrowUp size={13} /></Button>
                                    <Button variant="ghost" size="iconSm" onClick={() => move(idx, 1)} disabled={idx === list.length - 1} aria-label="Move down"><ArrowDown size={13} /></Button>
                                    <Button variant="ghost" size="iconSm" aria-label="Remove from carousel"
                                        onClick={() => setList(list.filter((l) => l._id !== item._id))}>
                                        <X size={13} />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {picking && (
                        <div className="mt-3 rounded-xl border border-dashed border-[#E7E2DA] p-3">
                            <div className="relative mb-2">
                                <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search a couple or tag…"
                                    className="h-8 w-full rounded-lg border border-[#E7E2DA] bg-white pl-7 pr-3 text-xs outline-none focus:border-[#A3603A]" />
                            </div>
                            <div className="max-h-56 space-y-1 overflow-y-auto">
                                {available.length === 0 && (
                                    <p className="py-4 text-center text-[11px] text-stone-500">
                                        {candidates.length ? 'Every published film is already in the carousel.' : 'No published films yet.'}
                                    </p>
                                )}
                                {available.map((item) => (
                                    <button key={item._id} type="button"
                                        onClick={() => setList([...list, item])}
                                        className="flex w-full items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-left transition hover:border-[#A3603A]">
                                        <Plus size={12} className="shrink-0 text-[#A3603A]" />
                                        <span className="min-w-0 flex-1 truncate text-xs text-stone-700">{nameOf(item)}</span>
                                        <span className="shrink-0 text-[10px] text-stone-400">{(item.tags || [])[0] || ''}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="flex items-center gap-2 pt-1 text-[11px] text-stone-500">
                        <Badge size="sm" variant="neutral">{list.length} in carousel</Badge>
                        {dirty
                            ? <span className="text-[#7C4524]">Unsaved order — press Save order.</span>
                            : <span className="flex items-center gap-1"><Check size={11} /> Matches the live homepage.</span>}
                    </p>
                </div>
            )}
        </section>
    );
}
