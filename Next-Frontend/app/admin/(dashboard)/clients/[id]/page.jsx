'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, CircleNotch, FilmSlate, ImageSquare, Star, HardDrives, MapPin,
    CalendarBlank, WarningCircle, PencilSimple, Check, X, UploadSimple, Trash,
    Eye, EyeSlash, DotsThree, Tag as TagIcon, ArrowSquareOut, Plus, Users,
} from '@phosphor-icons/react';
import usePortfolio from '@/Hooks/usePortfolio.jsx';
import useClientProfile from '@/Hooks/useClientProfile.jsx';
import Uploader from '@/app/admin/components/Uploader.jsx';
import EditDrawer from '@/app/admin/components/portfolio/EditDrawer.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { Reveal, Collapse } from '@/app/admin/components/ui/Motion.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { formatBytes } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import DeleteClientModal from '../_components/DeleteClientModal.jsx';
import DeleteMediaModal from '../_components/DeleteMediaModal.jsx';
import ImageUploadModal from '../_components/ImageUploadModal.jsx';
import VideoUploadModal from '../_components/VideoUploadModal.jsx';
import WeddingStatusDialog from '../_components/WeddingStatusDialog.jsx';
import AddFilmLinkDialog from '../_components/AddFilmLinkDialog.jsx';
import PublishChecklistDialog from '../_components/PublishChecklistDialog.jsx';
import ArrangePanel from '../_components/ArrangePanel.jsx';
import { pinFromForm, PIN_ERROR } from '../_lib/mapPin.js';
import { visibilityChip } from '../_lib/visibility.js';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Refresh while the worker is processing: 8 s, easing to once a minute, for at most 15 minutes.
const POLL_FIRST_MS = 8000;
const POLL_MAX_MS = 60000;
const POLL_GIVE_UP_MS = 15 * 60 * 1000;

const field = 'w-full rounded-lg border border-studio-border bg-white px-3 py-2 text-sm text-studio-ink outline-none focus:border-studio-terracotta focus:ring-2 focus:ring-studio-terracotta/15';
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-studio-inkMuted';

const KIND_TABS = [
    { key: '', label: 'Everything' },
    { key: 'Video', label: 'Films', icon: FilmSlate },
    { key: 'Photo', label: 'Photographs', icon: ImageSquare },
];

const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(url);
const posterOf = (i) => {
    const candidates = [
        i?.render?.posterUrl,
        i?.media?.video?.posterUrl,
        i?.render?.imageUrl,
        i?.kind !== 'Video' ? (i?.media?.cdnUrl || i?.media?.publicUrl) : null,
    ];
    return candidates.find((u) => u && !isVideoUrl(u)) || null;
};
const monthYear = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null);

const shootRange = (s) => {
    if (!s?.firstShoot) return null;
    const a = monthYear(s.firstShoot);
    const b = monthYear(s.lastShoot || s.firstShoot);
    return a === b ? a : `${a} – ${b}`;
};

function computeSpanDisplay(start, end, season) {
    if (!start && !end) return season ? `${season} Season` : '';
    if (start && (!end || start === end)) {
        const d = new Date(start + 'T00:00:00');
        const formatted = isNaN(d.getTime()) ? start : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${formatted} · Single-Day Celebration`;
    }
    if (start && end) {
        const d1 = new Date(start + 'T00:00:00');
        const d2 = new Date(end + 'T00:00:00');
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const diffDays = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
            const f1 = d1.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const f2 = d2.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return `${diffDays}-Day Celebration (${f1} – ${f2})`;
        }
    }
    return '';
}

/** One card. Selection is a first-class action, not a hover afterthought. */
function ItemCard({ item, selected, onToggle, onOpen, onDelete, isCover, onSetCover }) {
    const poster = posterOf(item);
    const isVideo = item.kind === 'Video';
    // Whether visitors can see it, and if not why (server-computed).
    const chip = visibilityChip(item);
    const videoStreamUrl = isVideo ? (item.render?.webUrl || item.render?.sourceUrl || item.render?.loopUrl || item.media?.cdnUrl || item.media?.publicUrl) : null;
    const [imgError, setImgError] = useState(false);

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-xl border bg-white transition-all duration-200',
                selected
                    ? 'border-studio-terracotta ring-2 ring-studio-terracotta/25'
                    : 'border-studio-border hover:border-studio-borderStrong hover:shadow-md',
            )}
        >
            <button
                type="button" onClick={() => onOpen(item)}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-ground-sunk"
            >
                {poster && !imgError ? (
                    <Image
                        src={poster} alt={item.title || 'item'} fill
                        unoptimized
                        onError={() => setImgError(true)}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        {...(item.render?.blurDataURL ? { placeholder: 'blur', blurDataURL: item.render.blurDataURL } : {})}
                    />
                ) : isVideo && videoStreamUrl ? (
                    <div className="relative h-full w-full bg-black">
                        <video
                            src={`${videoStreamUrl}#t=0.001`}
                            preload="metadata"
                            muted
                            playsInline
                            className="h-full w-full object-cover pointer-events-none"
                        />
                        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-lg bg-black/70 px-1 py-0.5 text-[9px] font-medium text-white">
                            <FilmSlate size={10} /> Video
                        </span>
                    </div>
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-ink-muted bg-ground-sunk">
                        {isVideo ? <FilmSlate size={26} /> : <ImageSquare size={26} />}
                    </span>
                )}

                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <span className="absolute right-2 top-2 flex gap-1">
                    {isCover && (
                        <span className="rounded-lg bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-studio-ink shadow-sm">Cover</span>
                    )}
                    {item.isHero && (
                        <span className="flex items-center gap-0.5 rounded-lg bg-studio-gold/95 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            <Star size={9} weight="fill" /> {item.heroPriority}
                        </span>
                    )}
                    {chip && (
                        <span title={chip.title} className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-white', chip.cls)}>
                            {chip.label}
                        </span>
                    )}
                </span>

                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-black/55 px-1.5 py-0.5 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                    {isVideo ? <FilmSlate size={9} /> : <ImageSquare size={9} />}
                    Priority {item.generalPriority ?? 0}
                </span>
            </button>

            <button
                type="button" onClick={() => onToggle(item._id)}
                aria-pressed={selected} aria-label={selected ? 'Deselect' : 'Select'}
                className={cn(
                    'absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg border transition-all',
                    selected
                        ? 'border-studio-terracotta bg-studio-terracotta text-white'
                        : 'border-white/70 bg-black/25 text-transparent backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:text-white/80',
                )}
            >
                <Check size={13} weight="bold" />
            </button>

            {onSetCover && !isCover && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSetCover(item); }}
                    className="absolute bottom-2 right-10 z-10 rounded-lg bg-ink/70 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-ink"
                >
                    Set as cover
                </button>
            )}
            {onDelete && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                    }}
                    aria-label="Delete item"
                    className="absolute bottom-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-ink/70 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-600 shadow-sm"
                >
                    <Trash size={12} />
                </button>
            )}

            <div className="space-y-1.5 px-2.5 pb-2.5 pt-2">
                <div className="flex flex-wrap gap-1">
                    {item.eventGroup && (
                        <Badge size="sm" variant="neutral">{item.eventGroup}</Badge>
                    )}
                    {(item.tags || []).slice(0, 3).map((t) => (
                        <Badge key={t} size="sm" variant="terracotta">{t}</Badge>
                    ))}
                    {!item.tags?.length && !item.eventGroup && <Badge size="sm" variant="warning">Untagged</Badge>}
                    {item.tags?.length > 3 && <Badge size="sm" variant="neutral">+{item.tags.length - 3}</Badge>}
                </div>
            </div>
        </div>
    );
}

export default function ClientWorkspace() {
    const { id } = useParams();
    const router = useRouter();
    const {
        items, total, loading, saving,
        fetchItems, updateItem, removeItem, assignMedia, bulkUpdate,
    } = usePortfolio();
    const { client, stats, load: loadClient, saving: savingProfile, saveProfile } = useClientProfile(id);

    const [kind, setKind] = useState('');
    const [eventGroupFilter, setEventGroupFilter] = useState('');
    const [editing, setEditing] = useState(null);
    const [selected, setSelected] = useState(() => new Set());
    // The tag system: bulk edits send tag ids; the ceremony filter reads its labels.
    const taxonomy = useTaxonomy();
    const [showUpload, setShowUpload] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [publishing, setPublishing] = useState(false);
    // 'Draft' | 'Archived' while the take-it-off-the-site confirmation is open.
    const [statusTarget, setStatusTarget] = useState(null);
    const [showChecklist, setShowChecklist] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [arranging, setArranging] = useState(false);
    const [bulkTag, setBulkTag] = useState('');
    const [bulkCeremony, setBulkCeremony] = useState('');
    const [form, setForm] = useState({
        bride: '', groom: '', startDate: '', endDate: '', season: '',
        isInMap: false, latitude: '', longitute: '', pinTouched: false,
        city: '', venue: '', state: '', slug: '', intro: '', storyEnabled: true,
    });

    // Dynamic ceremony groups present and counts
    const ceremonyTags = useMemo(() => taxonomy.groupByKey.get('ceremony')?.tags || [], [taxonomy.groupByKey]);
    const ceremonyGroups = useMemo(() => {
        const all = new Set(ceremonyTags.map((t) => t.label));
        items.forEach((i) => { if (i.eventGroup?.trim()) all.add(i.eventGroup.trim()); });
        return Array.from(all);
    }, [items, ceremonyTags]);

    const ceremonyCounts = useMemo(() => {
        const counts = {};
        for (const item of items) {
            const g = item.eventGroup?.trim() || '';
            counts[g] = (counts[g] || 0) + 1;
        }
        return counts;
    }, [items]);

    // Unique BTS crew members credited across this wedding
    const btsCrewList = useMemo(() => {
        const map = new Map();
        for (const item of items) {
            for (const c of item.credits || []) {
                if (c.role && c.name) map.set(`${c.role}:${c.name}`, c);
            }
        }
        return Array.from(map.values());
    }, [items]);

    // Staging modals state
    const [stagedPhotos, setStagedPhotos] = useState([]);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [stagedVideos, setStagedVideos] = useState([]);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // Story-page order, so what the admin arranges is what the grid shows.
    const query = useMemo(() => ({ client: id, kind, eventGroup: eventGroupFilter, status: '', sort: 'order' }), [id, kind, eventGroupFilter]);

    useEffect(() => { loadClient(); }, [loadClient]);
    useEffect(() => { fetchItems(query, { reset: true, pageNum: 1, limit: 120 }); }, [query, fetchItems]);

    const refresh = useCallback(() => {
        fetchItems(query, { reset: true, pageNum: 1, limit: 120 });
        loadClient();
        setSelected(new Set());
    }, [fetchItems, query, loadClient]);

    const toggle = useCallback((itemId) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
            return next;
        });
    }, []);

    /**
     * Uploading inside a wedding means the work belongs to it, so the placement
     * is created here. No status is sent: the server decides (plan D7). Into a
     * live wedding new work waits hidden until reviewed; into a draft wedding it
     * goes live together with the wedding.
     */
    const placeUploaded = async (media) => {
        setAssigning(true);
        const failures = [];
        for (const m of media) {
            const res = await assignMedia({ media: m._id, client: id });
            if (res.error && res.status !== 409) failures.push(`${m.originalFileName || m.mediaId}: ${res.error}`);
        }
        setAssigning(false);
        const placed = media.length - failures.length;
        if (placed) {
            fireMessage(client?.status === 'Published'
                ? `${placed} added, hidden until you publish ${placed === 1 ? 'it' : 'them'}`
                : `${placed} added; ${placed === 1 ? 'it goes' : 'they go'} live with the wedding`, 'success');
        }
        failures.forEach((f) => fireMessage(f, 'error'));
        refresh();
    };

    const runBulk = async (body) => {
        const ids = [...selected];
        if (!ids.length) return;
        if (await bulkUpdate({ ids, ...body })) refresh();
    };

    /**
     * The wedding's status is a gate over its items, not a cascade: publishing
     * shows every item that is itself Published and ready, and unpublishing
     * hides them all without touching their own settings, so a republish brings
     * back exactly the same set. The hook reports its own error and returns null.
     */
    const setWeddingStatus = async (status) => {
        setPublishing(true);
        try {
            const saved = await saveProfile({ status }, { quiet: true });
            if (!saved) return;
            const n = saved.publicItems ?? 0;
            fireMessage(status === 'Published'
                ? `Wedding published · ${n} item${n === 1 ? '' : 's'} live`
                : `Wedding ${status === 'Archived' ? 'archived' : 'unpublished'} · off the site`, 'success');
        } finally {
            setPublishing(false);
            setStatusTarget(null);
            refresh();
        }
    };

    /** The item that represents the wedding on its story page and in wedding lists. */
    const setCover = async (item) => {
        const saved = await saveProfile({ cover: item._id }, { quiet: true });
        if (saved) fireMessage('Cover set', 'success');
    };

    /** Publish the items an admin hid (or that arrived into the live wedding). */
    const publishHidden = async () => {
        const ids = items.filter((i) => i.status !== 'Published').map((i) => i._id);
        if (!ids.length) return;
        setPublishing(true);
        try {
            await bulkUpdate({ ids, set: { status: 'Published' } });
        } finally {
            setPublishing(false);
            refresh();
        }
    };

    const openProfile = () => {
        const cDates = client?.celebrationDates || {};
        const startStr = cDates.startDate ? new Date(cDates.startDate).toISOString().split('T')[0] : (client?.weddingDate ? new Date(client.weddingDate).toISOString().split('T')[0] : '');
        const endStr = cDates.endDate ? new Date(cDates.endDate).toISOString().split('T')[0] : '';
        setForm({
            bride: client?.clientName?.Bride || '',
            groom: client?.clientName?.Groom || '',
            startDate: startStr,
            endDate: endStr,
            season: cDates.season || '',
            isInMap: Boolean(client?.mapPin?.isInMap),
            latitude: String(client?.mapPin?.coordinate?.latitude ?? ''),
            longitute: String(client?.mapPin?.coordinate?.longitute ?? ''),
            pinTouched: false,
            city: client?.location?.city || '',
            venue: client?.location?.venue || '',
            state: client?.location?.state || '',
            slug: client?.slug || '',
            intro: client?.story?.intro || '',
            storyEnabled: client?.story?.enabled !== false,
        });
        setShowProfile((v) => !v);
        setMenuOpen(false);
    };

    const commitProfile = async () => {
        // The pin is sent only when the admin changed it, so a rename can never move or drop it.
        const pin = form.pinTouched ? pinFromForm(form.isInMap, form) : null;
        if (pin && !pin.ok) {
            fireMessage(PIN_ERROR, 'error');
            return;
        }
        const spanDisplay = computeSpanDisplay(form.startDate, form.endDate, form.season);
        const saved = await saveProfile({
            bride: form.bride,
            groom: form.groom,
            weddingDate: form.startDate || client?.weddingDate || null,
            celebrationDates: {
                startDate: form.startDate ? new Date(form.startDate) : null,
                endDate: form.endDate ? new Date(form.endDate) : null,
                season: form.season?.trim() || '',
                spanDisplay,
            },
            ...(pin ? { isInMap: pin.isInMap, coordinate: pin.coordinate } : {}),
            location: { city: form.city, venue: form.venue, state: form.state },
            story: { intro: form.intro, enabled: form.storyEnabled },
            ...(form.slug.trim() && form.slug.trim() !== client?.slug ? { slug: form.slug.trim().toLowerCase() } : {}),
        });
        if (!saved) return;
        setShowProfile(false);
        refresh(); // clientNameText is denormalised onto every placement
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteForceRequired, setDeleteForceRequired] = useState(null);

    // Media deletion state
    const [deleteMediaTarget, setDeleteMediaTarget] = useState([]);
    const [showDeleteMediaModal, setShowDeleteMediaModal] = useState(false);

    // Poll only while the worker has something to finish. It used to poll every
    // 8 s whenever a Draft existed — forever, since a draft never changes by itself.
    const hasProcessing = items.some((i) => i.media?.status === 'Processing');
    useEffect(() => {
        if (!hasProcessing) return;
        const startedAt = Date.now();
        let delay = POLL_FIRST_MS;
        let timer;
        const tick = () => {
            if (Date.now() - startedAt > POLL_GIVE_UP_MS) return;
            fetchItems(query, { reset: true, pageNum: 1, limit: 120 });
            delay = Math.min(delay * 1.5, POLL_MAX_MS);
            timer = setTimeout(tick, delay);
        };
        timer = setTimeout(tick, delay);
        return () => clearTimeout(timer);
    }, [hasProcessing, fetchItems, query]);

    const confirmDeleteMedia = async ({ ids, purgeMedia }) => {
        for (const itemId of ids) {
            await removeItem(itemId, { purgeMedia, releaseMedia: !purgeMedia });
        }
        setShowDeleteMediaModal(false);
        setDeleteMediaTarget([]);
        setSelected(new Set());
        if (editing && ids.includes(editing._id)) setEditing(null);
        refresh();
    };

    // Never forces by itself: a 409 puts the modal into "type the names" mode.
    const confirmDelete = async ({ purgeMedia = false, force = false } = {}) => {
        setDeleteLoading(true);
        const params = new URLSearchParams();
        if (force) params.set('force', 'true');
        if (purgeMedia) params.set('purge', 'true');
        const qs = params.toString() ? `?${params}` : '';
        try {
            const res = await fetch(`${api_url}/api/admin/clients/${id}${qs}`, { method: 'DELETE', credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 && data.requiresForce) {
                setDeleteForceRequired(data.message);
                return;
            }
            if (!res.ok) throw new Error(data.message || 'Could not delete');
            fireMessage(data.message, 'success');
            setShowDeleteModal(false);
            router.push('/admin/clients');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const name = [client?.clientName?.Bride, client?.clientName?.Groom].filter(Boolean).join(' & ');
    // Items the admin hid, or that arrived into the live wedding and wait for review.
    const drafts = items.filter((i) => i.status !== 'Published').length;
    const liveCount = items.filter((i) => i.visibility?.public).length;
    // Where new uploads start: the wedding's own date and place, and the ceremony being viewed.
    const uploadDefaults = {
        shootDate: (() => { const d = client?.celebrationDates?.startDate || client?.weddingDate; return d ? new Date(d).toISOString().slice(0, 10) : ''; })(),
        city: client?.location?.city || '',
        venue: client?.location?.venue || '',
        ceremony: eventGroupFilter || '',
    };
    const storyHref = client?.status === 'Published' && client?.slug && client?.story?.enabled !== false ? `/weddings/story/${client.slug}` : null;
    const range = shootRange(stats);
    const displayDates = client?.celebrationDates?.spanDisplay || range || monthYear(client?.weddingDate);
    const selectedItems = items.filter((i) => selected.has(i._id));

    return (
        <div className="space-y-6 font-sans">
            <PageHeader
                title={
                    <span className="flex items-center gap-2.5">
                        <span>{name || 'Loading…'}</span>
                        {client?.status === 'Published' ? (
                            <Badge size="sm" variant="success" className="font-bold">
                                Published
                            </Badge>
                        ) : client?.status === 'Archived' ? (
                            <Badge size="sm" variant="neutral" className="font-bold">
                                Archived
                            </Badge>
                        ) : client ? (
                            <Badge size="sm" variant="warning" className="font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1" />
                                Draft · not on the site
                            </Badge>
                        ) : null}
                    </span>
                }
                subtitle={
                    stats ? (
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1"><FilmSlate size={12} />{stats.videos} films</span>
                            <span className="flex items-center gap-1"><ImageSquare size={12} />{stats.photos} photographs</span>
                            {stats.hero > 0 && <span className="flex items-center gap-1 text-studio-goldDark"><Star size={12} weight="fill" />{stats.hero} in hero</span>}
                            {displayDates && <span className="flex items-center gap-1"><CalendarBlank size={12} />{displayDates}</span>}
                            {stats.cities?.[0] && <span className="flex items-center gap-1"><MapPin size={12} />{stats.cities.slice(0, 2).join(', ')}</span>}
                            <span className="flex items-center gap-1"><HardDrives size={12} />{formatBytes(stats.storageBytes)}</span>
                        </span>
                    ) : 'Wedding gallery and client media archive'
                }
                breadcrumbs={[
                    { label: 'Admin', href: '/admin/dashboard' },
                    { label: 'Weddings', href: '/admin/clients' },
                    { label: name || 'Wedding' },
                ]}
            >
                <div className="flex shrink-0 items-center gap-2">
                    {client && client.status !== 'Published' && (
                        <Button
                            variant="gold"
                            size="sm"
                            loading={publishing}
                            onClick={() => setShowChecklist(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                        >
                            Publish wedding
                        </Button>
                    )}
                    <Button variant="terracotta" size="sm" icon={showUpload ? X : Plus} onClick={() => setShowUpload((v) => !v)}>
                        {showUpload ? 'Close' : 'Add media'}
                    </Button>
                    <div className="relative">
                        <Button variant="outline" size="icon" aria-label="More actions" onClick={() => setMenuOpen((v) => !v)}>
                            <DotsThree size={18} weight="bold" />
                        </Button>
                        {menuOpen && (
                            <>
                                <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-studio-border bg-white py-1 shadow-lg">
                                    <button type="button" onClick={openProfile}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-studio-ink hover:bg-ground">
                                        <PencilSimple size={13} /> Edit couple &amp; map pin
                                    </button>
                                    <button type="button" onClick={() => { setShowUpload(true); setMenuOpen(false); }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-studio-ink hover:bg-ground">
                                        <UploadSimple size={13} /> Upload films or photos
                                    </button>
                                    <button type="button" onClick={() => { setShowLinkDialog(true); setMenuOpen(false); }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-studio-ink hover:bg-ground">
                                        <FilmSlate size={13} /> Add film by YouTube / Vimeo link
                                    </button>
                                    {storyHref && (
                                        <a href={storyHref} target="_blank" rel="noreferrer"
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-studio-ink hover:bg-ground">
                                            <ArrowSquareOut size={13} /> View story page
                                        </a>
                                    )}
                                    <div className="my-1 h-px bg-studio-border" />
                                    {client?.status !== 'Published' && (
                                        <button type="button" onClick={() => { setMenuOpen(false); setShowChecklist(true); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                                            <Eye size={13} /> Publish wedding
                                        </button>
                                    )}
                                    {client?.status === 'Published' && (
                                        <button type="button" onClick={() => { setMenuOpen(false); setStatusTarget('Draft'); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-studio-ink hover:bg-ground cursor-pointer">
                                            <EyeSlash size={13} /> Unpublish wedding…
                                        </button>
                                    )}
                                    {client && client.status !== 'Archived' && (
                                        <button type="button" onClick={() => { setMenuOpen(false); setStatusTarget('Archived'); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-studio-ink hover:bg-ground cursor-pointer">
                                            <HardDrives size={13} /> Archive wedding…
                                        </button>
                                    )}
                                    <div className="my-1 h-px bg-studio-border" />
                                    <button type="button" onClick={() => { setShowDeleteModal(true); setMenuOpen(false); }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 cursor-pointer">
                                        <Trash size={13} /> Delete wedding…
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </PageHeader>

            {/* ------------------------------------------------------ profile */}
            <Collapse open={showProfile}>
                <section className="max-w-xl space-y-3 rounded-xl border border-studio-border bg-white p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className={labelCls}>Bride</span>
                            <input className={field} value={form.bride} onChange={(e) => setForm((f) => ({ ...f, bride: e.target.value }))} />
                        </div>
                        <div>
                            <span className={labelCls}>Groom</span>
                            <input className={field} value={form.groom} onChange={(e) => setForm((f) => ({ ...f, groom: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                            <span className={labelCls}>Start Date</span>
                            <input
                                type="date"
                                className={field}
                                value={form.startDate}
                                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <span className={labelCls}>End Date</span>
                            <input
                                type="date"
                                className={field}
                                min={form.startDate}
                                value={form.endDate}
                                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <span className={labelCls}>Season (Optional)</span>
                            <input
                                type="text"
                                className={field}
                                placeholder="e.g. Winter 2026"
                                value={form.season}
                                onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="rounded-xl border border-studio-border bg-studio-card p-3">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-studio-inkSecondary">
                            <input type="checkbox" checked={form.isInMap} className="h-3.5 w-3.5 accent-studio-terracotta"
                                onChange={(e) => setForm((f) => ({ ...f, isInMap: e.target.checked, pinTouched: true }))} />
                            <MapPin size={13} className="text-studio-terracotta" />
                            Pin this wedding on the destination map
                        </label>
                        <Collapse open={form.isInMap}>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div>
                                    <span className={labelCls}>Latitude</span>
                                    <input type="number" step="any" className={field} value={form.latitude}
                                        onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value, pinTouched: true }))} />
                                </div>
                                <div>
                                    <span className={labelCls}>Longitude</span>
                                    <input type="number" step="any" className={field} value={form.longitute}
                                        onChange={(e) => setForm((f) => ({ ...f, longitute: e.target.value, pinTouched: true }))} />
                                </div>
                            </div>
                        </Collapse>
                        <p className="mt-2 text-[10px] text-studio-inkMuted">
                            Saving replaces this wedding&apos;s pin rather than adding another. Unticking removes it.
                        </p>
                    </div>
                    {/* Place and story page */}
                    <div className="grid grid-cols-3 gap-3">
                        {[['city', 'City'], ['venue', 'Venue'], ['state', 'State']].map(([k, l]) => (
                            <div key={k}>
                                <span className={labelCls}>{l}</span>
                                <input className={field} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 rounded-xl border border-studio-border p-3">
                        <label className="flex items-center gap-2 text-xs font-medium text-studio-ink">
                            <input type="checkbox" checked={form.storyEnabled} onChange={(e) => setForm((f) => ({ ...f, storyEnabled: e.target.checked }))} />
                            Story page for this wedding
                        </label>
                        <div>
                            <span className={labelCls}>Address</span>
                            <div className="flex items-center gap-1 text-xs text-studio-inkMuted">
                                <span>/weddings/story/</span>
                                <input className={cn(field, 'font-mono')} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                            </div>
                            <p className="mt-1 text-[10px] text-studio-inkMuted">Changing it keeps the old address working as a redirect.</p>
                        </div>
                        <div>
                            <span className={labelCls}>Introduction</span>
                            <textarea rows={3} className={field} value={form.intro} maxLength={2000}
                                placeholder="A few lines about the couple and the celebration, shown at the top of the story page."
                                onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowProfile(false)}>Cancel</Button>
                        <Button variant="gold" size="sm" icon={Check} loading={savingProfile} onClick={commitProfile}>Save</Button>
                    </div>
                </section>
            </Collapse>

            {/* ------------------------------------------------------- upload */}
            <Collapse open={showUpload}>
                <section className="rounded-xl border border-studio-border bg-studio-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-edge-subtle pb-2.5">
                        <div>
                            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                                Add Media to this Wedding
                            </h3>
                            <p className="text-[11px] text-ink-muted">
                                Select or drop photos and films separately for specialized pre-flight staging.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>Close</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Zone 1: Photos */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
                                if (files.length) {
                                    setStagedPhotos(files);
                                    setShowPhotoModal(true);
                                }
                            }}
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300/80 bg-white p-5 text-center transition hover:border-amber-400 hover:bg-amber-50/40"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 mb-2">
                                <ImageSquare size={22} weight="bold" />
                            </span>
                            <h4 className="text-xs font-bold text-ink">Photographs &amp; Stills</h4>
                            <p className="text-[11px] text-ink-muted mt-0.5">JPG, PNG, WebP, HEIC · Multi-res pipeline</p>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*,.jpg,.jpeg,.png,.webp,.heic"
                                multiple
                                hidden
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
                                    if (files.length) {
                                        setStagedPhotos(files);
                                        setShowPhotoModal(true);
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                icon={Plus}
                                onClick={() => photoInputRef.current?.click()}
                                className="mt-3 border-amber-300 text-amber-950 hover:bg-amber-50 text-xs font-semibold"
                            >
                                Stage Photos
                            </Button>
                        </div>

                        {/* Zone 2: Videos */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('video/'));
                                if (files.length) {
                                    setStagedVideos(files);
                                    setShowVideoModal(true);
                                }
                            }}
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-edge-strong bg-white p-5 text-center transition hover:border-edge-strong hover:bg-ground"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-amber-300 mb-2">
                                <FilmSlate size={22} weight="bold" />
                            </span>
                            <h4 className="text-xs font-bold text-ink">Films &amp; Cinema</h4>
                            <p className="text-[11px] text-ink-muted mt-0.5">MP4, MOV, WebM · Transcode &amp; Hero options</p>
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*,.mp4,.mov,.webm,.mkv"
                                multiple
                                hidden
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('video/'));
                                    if (files.length) {
                                        setStagedVideos(files);
                                        setShowVideoModal(true);
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                icon={Plus}
                                onClick={() => videoInputRef.current?.click()}
                                className="mt-3 border-edge-strong text-ink hover:bg-ground text-xs font-semibold"
                            >
                                Stage Films
                            </Button>
                        </div>
                    </div>
                </section>
            </Collapse>

            {/* ------------------------------------------------------- drafts */}
            <Collapse open={drafts > 0}>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-studio-gold/40 bg-studio-goldLight px-3 py-2.5">
                    <EyeSlash size={15} className="text-studio-goldDark" />
                    <p className="flex-1 text-xs text-studio-terracottaDark">
                        <span className="font-medium">{drafts} item{drafts === 1 ? '' : 's'} hidden.</span>
                        {' '}Visitors cannot see {drafts === 1 ? 'it' : 'them'}
                        {client?.status === 'Published' ? '.' : ', even once the wedding is published.'}
                    </p>
                    <Button variant="primary" size="sm" loading={publishing} onClick={publishHidden}>
                        Publish {drafts === 1 ? 'it' : `all ${drafts}`}
                    </Button>
                </div>
            </Collapse>

            {/* ------------------------------------------------------ toolbar */}
            {btsCrewList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-edge-subtle bg-ground px-3.5 py-2 text-xs">
                    <span className="flex items-center gap-1 font-bold text-ink-secondary text-[11px] uppercase tracking-wider mr-1">
                        <Users size={14} className="text-amber-600" /> Crew:
                    </span>
                    {btsCrewList.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-white border border-edge-subtle px-2 py-0.5 text-[10px] text-ink shadow-2xs">
                            <span className="font-semibold text-amber-900">{c.role}:</span> {c.name}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={arranging ? 'primary' : 'outline'} size="sm"
                        disabled={!arranging && (Boolean(kind) || Boolean(eventGroupFilter))}
                        title={kind || eventGroupFilter ? 'Show everything to arrange the story page' : 'Drag into story-page order'}
                        onClick={() => setArranging((v) => !v)}>
                        {arranging ? 'Arranging…' : 'Arrange'}
                    </Button>
                    <div className="flex rounded-lg border border-studio-border bg-white p-0.5">
                        {KIND_TABS.map((t) => (
                            <button key={t.key} type="button" onClick={() => { setKind(t.key); setSelected(new Set()); }}
                                className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer',
                                    kind === t.key ? 'bg-studio-obsidian text-white' : 'text-studio-inkSecondary hover:bg-ground-sunk')}>
                                {t.icon && <t.icon size={12} />}{t.label}
                            </button>
                        ))}
                    </div>

                    {/* Ceremony Clusters Filtering with Dynamic Counters */}
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                        {['', ...ceremonyGroups].map((eg) => {
                            const count = eg ? (ceremonyCounts[eg] || 0) : total;
                            if (eg && count === 0) return null;
                            return (
                                <button
                                    key={eg}
                                    type="button"
                                    onClick={() => { setEventGroupFilter(eg); setSelected(new Set()); }}
                                    className={cn(
                                        'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border cursor-pointer flex items-center gap-1.5',
                                        eventGroupFilter === eg
                                            ? 'bg-ink text-white border-ink shadow-xs'
                                            : 'border-studio-border bg-white text-studio-inkSecondary hover:border-edge-strong'
                                    )}
                                >
                                    <span>{eg || 'All Events'}</span>
                                    <span className={cn(
                                        'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                                        eventGroupFilter === eg ? 'bg-white/20 text-white' : 'bg-ground-sunk text-ink-secondary'
                                    )}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge size="sm" variant="neutral">{total} item{total === 1 ? '' : 's'}</Badge>
                    {items.length > 0 && (
                        <button type="button"
                            onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i._id)))}
                            className="text-[11px] font-medium text-studio-terracotta hover:underline cursor-pointer">
                            {selected.size === items.length ? 'Clear selection' : 'Select all'}
                        </button>
                    )}
                </div>
            </div>

            {/* --------------------------------------------------- bulk strip */}
            <Collapse open={selected.size > 0}>
                <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-studio-terracotta/30 bg-studio-obsidian p-2.5 text-white shadow-lg">
                    <span className="px-1 text-xs font-medium">{selected.size} selected</span>
                    {/* Tag ids; the server skips items a tag cannot apply to and says so. */}
                    <select value={bulkTag} onChange={(e) => setBulkTag(e.target.value)}
                        className="h-7 rounded-lg border border-white/15 bg-white/10 px-2 text-[11px] text-white outline-none">
                        <option value="" className="text-studio-ink">Choose a tag…</option>
                        {taxonomy.groupsFor(null).filter((g) => g.key !== 'ceremony').map((g) => (
                            <optgroup key={g._id} label={g.label} className="text-studio-ink">
                                {(g.tags || []).filter((t) => !t.hidden).map((t) => <option key={t._id} value={t._id} className="text-studio-ink">{t.label}</option>)}
                            </optgroup>
                        ))}
                    </select>
                    <Button variant="secondary" size="sm" icon={TagIcon} disabled={!bulkTag}
                        onClick={() => runBulk({ tagIds: { add: [bulkTag] } })}>Add</Button>
                    <Button variant="secondary" size="sm" disabled={!bulkTag}
                        onClick={() => runBulk({ tagIds: { remove: [bulkTag] } })}>Remove</Button>

                    <span className="h-5 w-px bg-white/15" />
                    {/* Move to Ceremony Reassignment */}
                    <select
                        value={bulkCeremony}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            // Ceremony is one per item: adding one replaces the current one.
                            runBulk(val === '__none'
                                ? { tagIds: { remove: ceremonyTags.map((t) => t._id) } }
                                : { tagIds: { add: [val] } });
                            setBulkCeremony('');
                        }}
                        className="h-7 rounded-lg border border-amber-400/40 bg-white/15 px-2 text-[11px] text-amber-200 font-semibold outline-none"
                    >
                        <option value="" className="text-studio-ink font-normal">Move to Ceremony…</option>
                        {ceremonyTags.map((t) => (
                            <option key={t._id} value={t._id} className="text-studio-ink">{t.label}</option>
                        ))}
                        <option value="__none" className="text-studio-ink">No ceremony</option>
                    </select>

                    <span className="h-5 w-px bg-white/15" />
                    <Button variant="secondary" size="sm" icon={Eye} onClick={() => runBulk({ set: { status: 'Published' } })}>Publish</Button>
                    <Button variant="secondary" size="sm" icon={EyeSlash} onClick={() => runBulk({ set: { status: 'Draft' } })}>Hide</Button>
                    <span className="h-5 w-px bg-white/15" />
                    <Button variant="secondary" size="sm" onClick={() => runBulk({ shiftPriority: 10 })}>Priority +10</Button>
                    <Button variant="secondary" size="sm" onClick={() => runBulk({ shiftPriority: -10 })}>−10</Button>
                    <span className="h-5 w-px bg-white/15" />
                    <Button
                        variant="danger"
                        size="sm"
                        icon={Trash}
                        onClick={() => {
                            const target = items.filter((i) => selected.has(i._id));
                            setDeleteMediaTarget(target);
                            setShowDeleteMediaModal(true);
                        }}
                    >
                        Delete / Purge
                    </Button>
                    <Button variant="ghost" size="sm" icon={X} className="ml-auto text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() => setSelected(new Set())}>Clear</Button>
                </div>
            </Collapse>

            {/* --------------------------------------------------------- grid */}
            {loading && items.length === 0 ? (
                <div className="flex items-center justify-center py-24 text-ink-muted">
                    <CircleNotch size={22} className="animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-studio-borderStrong/60 py-16 text-center">
                    <p className="text-sm text-studio-inkSecondary">Nothing here yet.</p>
                    <p className="mt-1 text-xs text-studio-inkMuted">
                        Add films or photographs — they arrive as drafts you can review before publishing.
                    </p>
                    <Button variant="gold" size="sm" icon={Plus} className="mt-4" onClick={() => setShowUpload(true)}>
                        Add media
                    </Button>
                </div>
            ) : arranging ? (
                <ArrangePanel
                    items={items}
                    ceremonyOrder={ceremonyTags.map((t) => t.label)}
                    clientId={id}
                    onCancel={() => setArranging(false)}
                    onSaved={() => { setArranging(false); refresh(); }}
                />
            ) : (
                <div className={cn(
                    'grid gap-3 transition-[grid-template-columns] duration-300',
                    editing
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
                )}>
                    {items.map((item, i) => (
                        <Reveal key={item._id} index={i}>
                            <ItemCard
                                item={item}
                                selected={selected.has(item._id)}
                                onToggle={toggle}
                                onOpen={setEditing}
                                onDelete={(it) => {
                                    setDeleteMediaTarget([it]);
                                    setShowDeleteMediaModal(true);
                                }}
                                isCover={String(client?.cover) === String(item._id)}
                                onSetCover={setCover}
                            />
                        </Reveal>
                    ))}
                </div>
            )}

            {editing && (
                <EditDrawer
                    key={editing._id}
                    item={editing}
                    saving={saving}
                    onClose={() => setEditing(null)}
                    onDelete={(item) => {
                        setDeleteMediaTarget([item]);
                        setShowDeleteMediaModal(true);
                    }}
                    onSave={async (itemId, patch) => {
                        if (await updateItem(itemId, patch)) { setEditing(null); refresh(); }
                    }}
                    onItemChanged={(fields) => {
                        // Poster or file changed in the drawer: show it there and in the grid.
                        setEditing((prev) => (prev ? { ...prev, ...fields } : prev));
                        refresh();
                    }}
                />
            )}

            <WeddingStatusDialog
                target={statusTarget}
                liveCount={liveCount}
                loading={publishing}
                onConfirm={setWeddingStatus}
                onClose={() => setStatusTarget(null)}
            />

            <DeleteClientModal
                open={showDeleteModal}
                client={client}
                loading={deleteLoading}
                forceRequired={deleteForceRequired}
                onClose={() => { setShowDeleteModal(false); setDeleteForceRequired(null); }}
                onConfirm={confirmDelete}
            />

            <DeleteMediaModal
                open={showDeleteMediaModal}
                items={deleteMediaTarget}
                onClose={() => {
                    setShowDeleteMediaModal(false);
                    setDeleteMediaTarget([]);
                }}
                onConfirm={confirmDeleteMedia}
            />

            <ImageUploadModal
                open={showPhotoModal}
                onClose={() => {
                    setShowPhotoModal(false);
                    setStagedPhotos([]);
                }}
                initialFiles={stagedPhotos}
                clientId={id}
                defaults={uploadDefaults}
                onUploadComplete={() => {
                    setShowPhotoModal(false);
                    refresh();
                }}
            />

            <VideoUploadModal
                open={showVideoModal}
                onClose={() => {
                    setShowVideoModal(false);
                    setStagedVideos([]);
                }}
                initialFiles={stagedVideos}
                clientId={id}
                defaults={uploadDefaults}
                onUploadComplete={() => {
                    setShowVideoModal(false);
                    refresh();
                }}
            />

            <AddFilmLinkDialog
                open={showLinkDialog}
                onClose={() => setShowLinkDialog(false)}
                clientId={id}
                taxonomy={taxonomy}
                defaults={uploadDefaults}
                onAdded={() => refresh()}
            />

            {/* "Review & publish": what goes live now, what follows, what will not show. */}
            <PublishChecklistDialog
                open={showChecklist}
                clientId={id}
                publishing={publishing}
                onClose={() => setShowChecklist(false)}
                onPublish={async () => { await setWeddingStatus('Published'); setShowChecklist(false); }}
            />
        </div>
    );
}
