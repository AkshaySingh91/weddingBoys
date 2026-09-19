'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    MagnifyingGlass, Plus, CircleNotch, FilmSlate, ImageSquare, Star,
    WarningCircle, MapPin, HardDrives, CalendarBlank, ArrowsDownUp,
    Trash, EyeSlash, TagSimple, DotsThree, PencilSimple,
} from '@phosphor-icons/react';
import useClients from '@/Hooks/useClients.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { Reveal, Collapse } from '@/app/admin/components/ui/Motion.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { formatBytes } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import DeleteClientModal from './_components/DeleteClientModal.jsx';
import ImageUploadModal from './_components/ImageUploadModal.jsx';
import VideoUploadModal from './_components/VideoUploadModal.jsx';


const SORTS = [
    { key: 'recent', label: 'Newest' },
    { key: 'name', label: 'Name' },
    { key: 'work', label: 'Most work' },
    { key: 'storage', label: 'Largest' },
];

const FILTERS = [
    { key: 'drafts', label: 'Has drafts', icon: EyeSlash, test: (s) => s.drafts > 0 },
    { key: 'untagged', label: 'Has untagged', icon: TagSimple, test: (s) => s.untagged > 0 },
    { key: 'empty', label: 'No media yet', icon: WarningCircle, test: (s) => (s.total || 0) === 0 },
];

const nameOf = (c) => [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ') || 'Unnamed';

const monthYear = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null);
const shootRange = (s) => {
    if (!s?.firstShoot) return null;
    const a = monthYear(s.firstShoot);
    const b = monthYear(s.lastShoot || s.firstShoot);
    return a === b ? a : `${a} – ${b}`;
};

export default function ClientsPage() {
    const router = useRouter();
    const { clients, loading, busyId: busy, load, remove } = useClients();

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('recent');
    const [filter, setFilter] = useState('');
    const [menuFor, setMenuFor] = useState(null);
    const [deletingClient, setDeletingClient] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Quick direct upload state
    const [uploadingClientId, setUploadingClientId] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);

    useEffect(() => { load(); }, [load]);

    const destroy = (client) => {
        setMenuFor(null);
        setDeletingClient(client);
    };

    const confirmDelete = async (options = {}) => {
        if (!deletingClient) return;
        setDeleteLoading(true);
        try {
            const ok = await remove(deletingClient.clientId, () => true, options);
            if (ok) setDeletingClient(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const active = FILTERS.find((f) => f.key === filter);
        return clients
            .filter((c) => !q
                || nameOf(c).toLowerCase().includes(q)
                || (c.stats?.cities || []).some((x) => x?.toLowerCase().includes(q))
                || (c.stats?.tags || []).some((t) => t?.toLowerCase().includes(q)))
            .filter((c) => !active || active.test(c.stats || {}))
            .sort((a, b) => {
                if (sort === 'name') return nameOf(a).localeCompare(nameOf(b));
                if (sort === 'work') return (b.stats?.total || 0) - (a.stats?.total || 0);
                if (sort === 'storage') return (b.stats?.storageBytes || 0) - (a.stats?.storageBytes || 0);
                return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
            });
    }, [clients, search, sort, filter]);

    const totals = useMemo(() => clients.reduce((a, c) => ({
        videos: a.videos + (c.stats?.videos || 0),
        photos: a.photos + (c.stats?.photos || 0),
        hero: a.hero + (c.stats?.hero || 0),
        drafts: a.drafts + (c.stats?.drafts || 0),
        untagged: a.untagged + (c.stats?.untagged || 0),
        bytes: a.bytes + (c.stats?.storageBytes || 0),
    }), { videos: 0, photos: 0, hero: 0, drafts: 0, untagged: 0, bytes: 0 }), [clients]);

    const counts = useMemo(() => Object.fromEntries(
        FILTERS.map((f) => [f.key, clients.filter((c) => f.test(c.stats || {})).length]),
    ), [clients]);

    return (
        <div className="space-y-6 font-sans">
            <PageHeader
                title="Wedding Archive"
                subtitle={
                    loading
                        ? 'Loading the archive…'
                        : `${clients.length} shoot${clients.length === 1 ? '' : 's'} · ${totals.videos} films · ${totals.photos} photographs · ${formatBytes(totals.bytes)} storage.`
                }
                breadcrumbs={[
                    { label: 'Admin', href: '/admin/dashboard' },
                    { label: 'Weddings' },
                ]}
            >
                <Button variant="terracotta" size="sm" icon={Plus} onClick={() => router.push('/admin/clients/new')}>
                    Add a Wedding
                </Button>
            </PageHeader>

            {/* filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[14rem] flex-1">
                    <MagnifyingGlass size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search a couple, city or tag…"
                        className="h-9 w-full rounded-lg border border-studio-border bg-white pl-7 pr-3 text-xs text-studio-inkSecondary outline-none transition-colors focus:border-studio-terracotta focus:ring-2 focus:ring-studio-terracotta/15" />
                </div>

                {FILTERS.map((f) => counts[f.key] > 0 && (
                    <button key={f.key} type="button"
                        onClick={() => setFilter(filter === f.key ? '' : f.key)}
                        className={cn('flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] transition-colors',
                            filter === f.key
                                ? 'border-studio-gold bg-studio-goldLight text-studio-terracottaDark'
                                : 'border-studio-border bg-white text-studio-inkSecondary hover:border-studio-borderStrong')}>
                        <f.icon size={11} /> {f.label}
                        <span className="tabular-nums opacity-60">{counts[f.key]}</span>
                    </button>
                ))}

                <div className="flex items-center gap-0.5 rounded-lg border border-studio-border bg-white p-0.5">
                    <ArrowsDownUp size={12} className="ml-1.5 text-stone-400" />
                    {SORTS.map((s) => (
                        <button key={s.key} type="button" onClick={() => setSort(s.key)}
                            className={cn('rounded-md px-2 py-1 text-[11px] transition-colors',
                                sort === s.key ? 'bg-studio-obsidian text-white' : 'text-studio-inkSecondary hover:bg-stone-100')}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <Collapse open={!loading && (totals.drafts > 0 || totals.untagged > 0)}>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-studio-gold/40 bg-studio-goldLight px-3 py-2 text-[11px] text-studio-terracottaDark">
                    <WarningCircle size={13} />
                    {totals.drafts > 0 && <span><span className="font-medium">{totals.drafts} unpublished</span> across all weddings</span>}
                    {totals.untagged > 0 && <span><span className="font-medium">{totals.untagged} untagged</span> — untagged work matches no row and stays invisible</span>}
                </p>
            </Collapse>

            {/* grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24 text-stone-400">
                    <CircleNotch size={22} className="animate-spin" />
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-studio-borderStrong/60 py-16 text-center">
                    <p className="text-sm text-studio-inkSecondary">
                        {clients.length ? 'No wedding matches that.' : 'No weddings yet.'}
                    </p>
                    {!clients.length && (
                        <Button variant="gold" size="sm" icon={Plus} className="mt-4" onClick={() => router.push('/admin/clients/new')}>
                            Add the first one
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((c, i) => {
                        const s = c.stats || {};
                        const range = shootRange(s);
                        const empty = (s.total || 0) === 0;
                        return (
                            <Reveal key={c.clientId} index={i}>
                                <div className={cn(
                                    'group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200',
                                    busy === c.clientId ? 'opacity-50' : 'hover:-translate-y-0.5 hover:shadow-lg',
                                    'border-studio-border hover:border-studio-borderStrong',
                                )}>
                                    <Link href={`/admin/clients/${c.clientId}`} className="block">
                                        <span className="relative block aspect-[16/10] overflow-hidden bg-stone-100">
                                            {c.media?.thumbnailUrl ? (
                                                <Image src={c.media.thumbnailUrl} alt={nameOf(c)} fill
                                                    sizes="(max-width: 640px) 100vw, 380px"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FAF3EA] to-[#EDE2D3] font-serif text-3xl font-bold tracking-widest text-[#9D774D] uppercase">
                                                    {(c.clientName?.Bride?.[0] || '?').toUpperCase()}&nbsp;&amp;&nbsp;{(c.clientName?.Groom?.[0] || '?').toUpperCase()}
                                                </span>
                                            )}
                                            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                            <span className="absolute inset-x-3 bottom-2.5">
                                                <span className="block truncate font-serif text-lg leading-tight text-white drop-shadow-sm">
                                                    {nameOf(c)}
                                                </span>
                                                <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10px] text-white/80">
                                                    {range && <span className="flex items-center gap-1"><CalendarBlank size={9} />{range}</span>}
                                                    {s.cities?.[0] && <span className="flex items-center gap-1"><MapPin size={9} />{s.cities[0]}</span>}
                                                </span>
                                            </span>

                                            {s.hero > 0 && (
                                                <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-studio-gold/95 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                                                    <Star size={9} weight="fill" /> {s.hero}
                                                </span>
                                            )}
                                        </span>
                                    </Link>

                                    {/* Ceremony Badges */}
                                    {(s.eventGroups || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1 px-3 pt-2 pb-0.5 border-t border-stone-100">
                                            {(s.eventGroups || []).slice(0, 3).map((eg) => (
                                                <Badge key={eg} size="sm" variant="gold">{eg}</Badge>
                                            ))}
                                            {(s.eventGroups || []).length > 3 && (
                                                <Badge size="sm" variant="neutral">+{(s.eventGroups || []).length - 3}</Badge>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 px-3 py-2.5">
                                        <span className="flex items-center gap-1 text-[11px] tabular-nums text-studio-inkSecondary">
                                            <FilmSlate size={11} className="text-stone-400" />{s.videos || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] tabular-nums text-studio-inkSecondary">
                                            <ImageSquare size={11} className="text-stone-400" />{s.photos || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] tabular-nums text-studio-inkMuted">
                                            <HardDrives size={11} className="text-stone-400" />{formatBytes(s.storageBytes)}
                                        </span>

                                        {/* Direct Ingest Shortcuts */}
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUploadingClientId(c.clientId);
                                                    setShowPhotoModal(true);
                                                }}
                                                className="rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer"
                                            >
                                                + Photo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setUploadingClientId(c.clientId);
                                                    setShowVideoModal(true);
                                                }}
                                                className="rounded-md bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer"
                                            >
                                                + Film
                                            </button>
                                        </div>

                                        <div className="relative shrink-0">
                                            <button type="button" aria-label="More actions"
                                                onClick={() => setMenuFor(menuFor === c.clientId ? null : c.clientId)}
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-studio-ink">
                                                <DotsThree size={16} weight="bold" />
                                            </button>
                                            {menuFor === c.clientId && (
                                                <>
                                                    <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuFor(null)} />
                                                    <div className="absolute bottom-full right-0 z-20 mb-1 w-44 overflow-hidden rounded-xl border border-studio-border bg-white py-1 shadow-lg">
                                                        <Link href={`/admin/clients/${c.clientId}`}
                                                            className="flex items-center gap-2 px-3 py-2 text-xs text-studio-ink hover:bg-stone-50">
                                                            <PencilSimple size={13} /> Open
                                                        </Link>
                                                        <div className="my-1 h-px bg-studio-border" />
                                                        <button type="button" onClick={() => destroy(c)}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50">
                                                            <Trash size={13} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            )}

            <DeleteClientModal
                open={Boolean(deletingClient)}
                client={deletingClient}
                loading={deleteLoading}
                onClose={() => setDeletingClient(null)}
                onConfirm={confirmDelete}
            />

            {/* Direct Ingest Modals from Client Card */}
            <ImageUploadModal
                open={showPhotoModal}
                clientId={uploadingClientId}
                onClose={() => {
                    setShowPhotoModal(false);
                    setUploadingClientId(null);
                }}
                onUploadComplete={() => {
                    setShowPhotoModal(false);
                    setUploadingClientId(null);
                    load();
                }}
            />

            <VideoUploadModal
                open={showVideoModal}
                clientId={uploadingClientId}
                onClose={() => {
                    setShowVideoModal(false);
                    setUploadingClientId(null);
                }}
                onUploadComplete={() => {
                    setShowVideoModal(false);
                    setUploadingClientId(null);
                    load();
                }}
            />
        </div>
    );
}
