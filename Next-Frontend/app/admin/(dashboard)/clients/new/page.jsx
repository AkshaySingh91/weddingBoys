'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ArrowRight, Check, CircleNotch, MapPin, Star, FilmSlate,
    ImageSquare, WarningCircle, Sparkle, PencilSimple, ArrowSquareOut, Trash,
    UploadSimple, Plus, Heart, Eye, CalendarBlank, Users, FolderSimple
} from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { formatBytes } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import MediaDetailsPanel from './_components/MediaDetailsPanel.jsx';
import DeleteClientModal from '../_components/DeleteClientModal.jsx';
import ImageUploadModal from '../_components/ImageUploadModal.jsx';
import VideoUploadModal from '../_components/VideoUploadModal.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const STEPS = [
    { key: 'couple', label: '1. Couple & Location' },
    { key: 'ingest', label: '2. Ingest & Ceremony Clusters' },
];

const CEREMONY_PRESETS = [
    'Haldi',
    'Mehendi',
    'Sangeet',
    'Wedding / Pheras',
    'Reception',
    'Pre-Wedding',
    'Candid & Portraits',
];

const field = 'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none transition-colors focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 placeholder:text-stone-400';
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-600';

const DRAFT_KEY = 'wb_new_wedding_intake_draft';

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

export default function AddClientWizard() {
    const router = useRouter();
    const [step, setStep] = useState(0);

    // Couple & Location Profile
    const [bride, setBride] = useState('');
    const [groom, setGroom] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [season, setSeason] = useState('');
    const [weddingDate, setWeddingDate] = useState('');
    const [city, setCity] = useState('');
    const [venue, setVenue] = useState('');
    const [isInMap, setIsInMap] = useState(false);
    const [coordinate, setCoordinate] = useState({ latitude: '', longitute: '' });

    const [clientId, setClientId] = useState(null);
    const [hasStoredDraft, setHasStoredDraft] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [discarding, setDiscarding] = useState(false);

    // Staging Modals State
    const [stagedPhotos, setStagedPhotos] = useState([]);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [stagedVideos, setStagedVideos] = useState([]);
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Drag-over states for dropzones
    const [photoDragOver, setPhotoDragOver] = useState(false);
    const [videoDragOver, setVideoDragOver] = useState(false);
    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // Staged portfolio items for this wedding
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [details, setDetails] = useState({}); // mediaId -> metadata
    const [editing, setEditing] = useState(null); // mediaId
    const [vocabulary, setVocabulary] = useState([]);
    const [btsRoles, setBtsRoles] = useState([]);
    const [publishing, setPublishing] = useState(false);
    const loadedRef = useRef(false);

    // Restore draft from sessionStorage
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(DRAFT_KEY);
            if (saved) {
                const p = JSON.parse(saved);
                if (p.bride || p.groom || p.clientId) {
                    setHasStoredDraft(true);
                }
                if (p.bride) setBride(p.bride);
                if (p.groom) setGroom(p.groom);
                if (p.startDate) setStartDate(p.startDate);
                if (p.endDate) setEndDate(p.endDate);
                if (p.season) setSeason(p.season);
                if (p.weddingDate) setWeddingDate(p.weddingDate);
                if (p.city) setCity(p.city);
                if (p.venue) setVenue(p.venue);
                if (p.isInMap !== undefined) setIsInMap(p.isInMap);
                if (p.coordinate) setCoordinate(p.coordinate);
                if (p.clientId) {
                    setClientId(p.clientId);
                    setStep(1);
                }
            }
        } catch { /* ignore */ }
    }, []);

    // Persist draft to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({
                    bride, groom, startDate, endDate, season, weddingDate: startDate || weddingDate, city, venue, isInMap, coordinate, clientId,
                })
            );
        } catch { /* ignore */ }
    }, [bride, groom, startDate, endDate, season, weddingDate, city, venue, isInMap, coordinate, clientId]);

    // Load tag vocabulary and BTS schema
    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        (async () => {
            try {
                const [tagRes, btsRes] = await Promise.all([
                    fetch(`${api_url}/api/get-all-tags`, { credentials: 'include' }),
                    fetch(`${api_url}/api/bts-schema/`, { credentials: 'include' }),
                ]);
                if (tagRes.ok) {
                    const { allTags = [] } = await tagRes.json();
                    setVocabulary([...new Set(allTags.flatMap((g) => g.tags || []))].sort());
                }
                if (btsRes.ok) setBtsRoles((await btsRes.json()).schema || []);
            } catch { /* tags can still be typed manually */ }
        })();
    }, []);

    // Load existing portfolio items if clientId was restored
    useEffect(() => {
        if (!clientId) return;
        (async () => {
            try {
                const res = await fetch(`${api_url}/api/admin/portfolio?client=${clientId}&limit=200`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.items?.length) {
                        setPortfolioItems(data.items);
                    }
                }
            } catch { /* ignore */ }
        })();
    }, [clientId]);

    const photoItems = useMemo(() => portfolioItems.filter((i) => i.kind === 'Photo'), [portfolioItems]);
    const filmItems = useMemo(() => portfolioItems.filter((i) => i.kind === 'Video'), [portfolioItems]);
    const totalStorageBytes = useMemo(() => portfolioItems.reduce((acc, i) => acc + (i.media?.fileSize || 0), 0), [portfolioItems]);
    const spanDisplay = useMemo(() => computeSpanDisplay(startDate, endDate, season), [startDate, endDate, season]);

    // Dynamic ceremony clusters grouping
    const ceremonyClusters = useMemo(() => {
        const clusters = {};
        for (const item of portfolioItems) {
            const group = item.eventGroup?.trim() || (item.kind === 'Video' ? 'Films & Cinema' : 'Untagged');
            if (!clusters[group]) clusters[group] = [];
            clusters[group].push(item);
        }
        return clusters;
    }, [portfolioItems]);

    // Discard draft wedding
    const handleDiscardClient = async () => {
        if (!clientId) {
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
            router.push('/admin/clients');
            return;
        }
        setDiscarding(true);
        try {
            const res = await fetch(`${api_url}/api/admin/clients/${clientId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not discard draft');
            fireMessage('Draft wedding discarded', 'success');
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
            setShowDiscardModal(false);
            router.push('/admin/clients');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setDiscarding(false);
        }
    };

    // Initialize client record
    const createClient = async () => {
        if (!bride.trim() || !groom.trim()) {
            fireMessage('Both bride and groom names are required', 'error');
            return;
        }
        setCreating(true);
        const spanDisplay = computeSpanDisplay(startDate, endDate, season);
        try {
            const res = await fetch(`${api_url}/api/admin/clients`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bride: bride.trim(),
                    groom: groom.trim(),
                    status: 'Draft',
                    weddingDate: startDate || weddingDate || null,
                    celebrationDates: {
                        startDate: startDate ? new Date(startDate) : null,
                        endDate: endDate ? new Date(endDate) : null,
                        season: season?.trim() || '',
                        spanDisplay,
                    },
                    isInMap,
                    coordinate: isInMap
                        ? { latitude: Number(coordinate.latitude), longitute: Number(coordinate.longitute) }
                        : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not create the client');
            setClientId(data.clientId);
            fireMessage(`Initialized draft archive for ${bride} & ${groom}`, 'success');
            setStep(1);
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    // Callback when ImageUploadModal finishes uploading items
    const handlePhotoUploadComplete = (newPlacements = []) => {
        setPortfolioItems((prev) => {
            const knownIds = new Set(prev.map((p) => p._id));
            return [...prev, ...newPlacements.filter((p) => !knownIds.has(p._id))];
        });
        setDetails((prev) => {
            const next = { ...prev };
            for (const item of newPlacements) {
                const key = item.mediaId || item.media?._id || item._id;
                next[key] = {
                    tags: item.tags || [],
                    eventGroup: item.eventGroup || '',
                    shootDate: item.shootDate || startDate || weddingDate || '',
                    location: item.location || (city ? { city, venue } : {}),
                    isHero: Boolean(item.isHero),
                    heroPriority: item.heroPriority || 0,
                    generalPriority: item.generalPriority || 0,
                    credits: item.credits || [],
                    caption: item.caption || '',
                };
            }
            return next;
        });
        setShowPhotoModal(false);
        setStagedPhotos([]);
    };

    // Callback when VideoUploadModal finishes uploading items
    const handleVideoUploadComplete = (newPlacements = []) => {
        setPortfolioItems((prev) => {
            const knownIds = new Set(prev.map((p) => p._id));
            return [...prev, ...newPlacements.filter((p) => !knownIds.has(p._id))];
        });
        setDetails((prev) => {
            const next = { ...prev };
            for (const item of newPlacements) {
                const key = item.mediaId || item.media?._id || item._id;
                next[key] = {
                    tags: item.tags || [],
                    eventGroup: item.eventGroup || 'Highlights Film',
                    shootDate: item.shootDate || startDate || weddingDate || '',
                    location: item.location || (city ? { city, venue } : {}),
                    isHero: Boolean(item.isHero),
                    heroPriority: item.heroPriority || 0,
                    generalPriority: item.generalPriority || 0,
                    credits: item.credits || [],
                    caption: item.caption || '',
                };
            }
            return next;
        });
        setShowVideoModal(false);
        setStagedVideos([]);
    };

    // File selection handlers for Photo Dropzone
    const onPhotoFilesChosen = (fileList) => {
        const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) {
            fireMessage('Please select valid image files (JPG, PNG, WebP, HEIC)', 'error');
            return;
        }
        setStagedPhotos(files);
        setShowPhotoModal(true);
    };

    // File selection handlers for Video Dropzone
    const onVideoFilesChosen = (fileList) => {
        const files = Array.from(fileList || []).filter((f) => f.type.startsWith('video/'));
        if (!files.length) {
            fireMessage('Please select valid video files (MP4, MOV, WebM)', 'error');
            return;
        }
        setStagedVideos(files);
        setShowVideoModal(true);
    };

    // Save individual detail edit from MediaDetailsPanel
    const handleSaveDetail = async (key, updatedVal) => {
        setDetails((prev) => ({ ...prev, [key]: updatedVal }));
        const item = portfolioItems.find((a) => (a.mediaId || a._id) === key);
        if (item) {
            try {
                await fetch(`${api_url}/api/admin/portfolio/${item._id}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventGroup: updatedVal.eventGroup,
                        tags: updatedVal.tags,
                        shootDate: updatedVal.shootDate || undefined,
                        location: updatedVal.location,
                        caption: updatedVal.caption,
                        credits: updatedVal.credits,
                        isHero: item.kind === 'Video' ? Boolean(updatedVal.isHero) : false,
                    }),
                });
                setPortfolioItems((prev) =>
                    prev.map((i) => (i._id === item._id ? { ...i, ...updatedVal } : i))
                );
            } catch (e) {
                console.error('Failed to sync item update', e);
            }
        }
    };

    // Save as Draft & Exit to Workspace
    const handleSaveAsDraftAndExit = async () => {
        try {
            if (clientId) {
                await fetch(`${api_url}/api/admin/clients/${clientId}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Draft' }),
                });
            }
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
            fireMessage('Saved draft wedding showcase. Access anytime in directory.', 'success');
            router.push(`/admin/clients/${clientId}`);
        } catch (err) {
            fireMessage(err.message, 'error');
        }
    };

    // Publish Wedding Showcase & Exit to Workspace
    const handlePublishAndFinish = async () => {
        setPublishing(true);
        try {
            // Ensure all items are in Published status
            const unpublishedIds = portfolioItems.filter((i) => i.status !== 'Published').map((i) => i._id);
            if (unpublishedIds.length > 0) {
                await fetch(`${api_url}/api/admin/portfolio/bulk`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ids: unpublishedIds,
                        set: { status: 'Published' },
                    }),
                });
            }
            if (clientId) {
                await fetch(`${api_url}/api/admin/clients/${clientId}`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Published', publishAllItems: true }),
                });
            }
            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
            fireMessage(`Wedding showcase published with ${portfolioItems.length} captures!`, 'success');
            router.push(`/admin/clients/${clientId}`);
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setPublishing(false);
        }
    };

    const editingItem = portfolioItems.find((a) => (a.mediaId || a._id) === editing);
    const editingDetails = editing ? (details[editing] || {
        tags: editingItem?.tags || [],
        eventGroup: editingItem?.eventGroup || '',
        shootDate: editingItem?.shootDate || '',
        location: editingItem?.location || {},
        isHero: Boolean(editingItem?.isHero),
        heroPriority: editingItem?.heroPriority || 0,
        generalPriority: editingItem?.generalPriority || 0,
        credits: editingItem?.credits || [],
        caption: editingItem?.caption || '',
    }) : null;

    return (
        <div className="space-y-6 font-sans pb-16">
            <PageHeader
                title="New Wedding Shoot Ingest"
                subtitle="Initialize the couple's archive, stage photographs and films with ceremony theming, and publish to the studio showcase."
                breadcrumbs={[
                    { label: 'Admin', href: '/admin/dashboard' },
                    { label: 'Weddings', href: '/admin/clients' },
                    { label: 'New Wedding' },
                ]}
            />

            {/* Studio Profile Strip (Renders when clientId exists) */}
            {clientId && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 font-serif text-sm font-bold text-amber-300 shadow-xs">
                            {(bride[0] || 'B').toUpperCase()}&amp;{(groom[0] || 'G').toUpperCase()}
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-stone-900 truncate">
                                    {bride} &amp; {groom}
                                </h3>
                                <Badge size="sm" variant="neutral">Active Ingest Studio</Badge>
                                {city && <Badge size="sm" variant="terracotta">{city}</Badge>}
                            </div>
                            <p className="text-xs text-stone-500">
                                {portfolioItems.length} items staged · {formatBytes(totalStorageBytes)} R2 storage used
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href={`/admin/clients/${clientId}`}
                            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                            <span>Open Client Workspace</span>
                            <ArrowSquareOut size={13} />
                        </Link>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={Trash}
                            onClick={() => setShowDiscardModal(true)}
                            className="text-xs font-medium"
                        >
                            Discard Draft
                        </Button>
                    </div>
                </div>
            )}

            {/* Draft Resume Alert */}
            {!clientId && hasStoredDraft && (bride || groom) && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
                            <Sparkle size={18} weight="fill" />
                        </span>
                        <div>
                            <p className="text-xs font-bold text-amber-950">
                                Unsaved Draft in Progress: {bride || 'Bride'} &amp; {groom || 'Groom'}
                            </p>
                            <p className="text-[11px] text-amber-800">
                                You have form data saved in this browser session. You can continue editing or reset.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
                            setBride('');
                            setGroom('');
                            setStartDate('');
                            setEndDate('');
                            setSeason('');
                            setCity('');
                            setVenue('');
                            setHasStoredDraft(false);
                            fireMessage('Draft reset. Starting fresh.', 'info');
                        }}
                        className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 transition cursor-pointer"
                    >
                        Reset &amp; Start Fresh
                    </button>
                </div>
            )}

            {/* Stepper Navigation */}
            <ol className="flex flex-wrap items-center gap-2">
                {STEPS.map((s, i) => {
                    const done = i < step;
                    const active = i === step;
                    return (
                        <li key={s.key} className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={i > step || (!clientId && i > 0)}
                                onClick={() => i < step && setStep(i)}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all',
                                    active
                                        ? 'bg-stone-900 text-white shadow-xs'
                                        : done
                                            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer'
                                            : 'bg-stone-50 text-stone-400 cursor-not-allowed',
                                )}
                            >
                                <span className={cn(
                                    'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                                    active ? 'bg-amber-400 text-stone-900' : done ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500',
                                )}>
                                    {done ? <Check size={10} weight="bold" /> : i + 1}
                                </span>
                                {s.label}
                            </button>
                            {i < STEPS.length - 1 && <span className="h-px w-6 bg-stone-200" />}
                        </li>
                    );
                })}
            </ol>

            {/* ========================================================== PHASE 0: Couple & Location Profile */}
            {step === 0 && (
                <section className="max-w-2xl mx-auto space-y-5 rounded-3xl border border-[#E8DDD1] bg-[#FFFCF8] p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-[#E8DDD1] pb-5">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-2xs">
                            <Heart size={22} weight="fill" />
                        </span>
                        <div>
                            <h2 className="font-serif text-lg font-bold text-stone-900">
                                Initialize Couple Profile
                            </h2>
                            <p className="text-xs text-stone-500">
                                Enter the couple&apos;s names, wedding dates, and destination details.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Bride&apos;s Name</label>
                            <input
                                className={field}
                                value={bride}
                                onChange={(e) => setBride(e.target.value)}
                                placeholder="e.g. Ananya"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Groom&apos;s Name</label>
                            <input
                                className={field}
                                value={groom}
                                onChange={(e) => setGroom(e.target.value)}
                                placeholder="e.g. Kabir"
                            />
                        </div>
                    </div>

                    {/* Celebration Dates & Span */}
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                                <CalendarBlank size={16} className="text-amber-600" />
                                Celebration Dates &amp; Span
                            </span>
                            {spanDisplay && (
                                <Badge size="sm" variant="gold" className="font-semibold">
                                    {spanDisplay}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className={labelCls}>Start Date / Day 1</label>
                                <input
                                    type="date"
                                    className={field}
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        if (!endDate) setEndDate(e.target.value);
                                    }}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>End Date / Finale</label>
                                <input
                                    type="date"
                                    className={field}
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Season / Month (Optional)</label>
                                <input
                                    type="text"
                                    className={field}
                                    placeholder="e.g. Winter 2026 / Dec"
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Quick preset duration buttons */}
                        {startDate && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-stone-500">
                                <span className="font-medium">Quick duration:</span>
                                <button
                                    type="button"
                                    onClick={() => setEndDate(startDate)}
                                    className={cn(
                                        'rounded-md px-2 py-0.5 font-medium transition cursor-pointer',
                                        endDate === startDate ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                    )}
                                >
                                    1 Day
                                </button>
                                {[2, 3, 4, 5].map((days) => {
                                    const d = new Date(startDate + 'T00:00:00');
                                    d.setDate(d.getDate() + days - 1);
                                    const targetStr = d.toISOString().split('T')[0];
                                    return (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => setEndDate(targetStr)}
                                            className={cn(
                                                'rounded-md px-2 py-0.5 font-medium transition cursor-pointer',
                                                endDate === targetStr ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                            )}
                                        >
                                            {days} Days
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-[11px] text-stone-500 bg-amber-50/60 rounded-xl p-2.5 border border-amber-200/50">
                            <span className="font-semibold text-amber-900">Ritual Scheduling:</span> Specific ritual dates (Haldi, Mehendi, Sangeet, Pheras, Reception) can be fine-tuned per ceremony cluster during media ingest in Step 2.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>City / Region</label>
                            <input
                                type="text"
                                className={field}
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Udaipur"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Venue / Palace</label>
                            <input
                                type="text"
                                className={field}
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                placeholder="e.g. Jagmandir Island Palace"
                            />
                        </div>
                    </div>

                    {/* Destination Map Pinning */}
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
                        <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-stone-800">
                            <input
                                type="checkbox"
                                checked={isInMap}
                                className="h-4 w-4 rounded accent-stone-900 cursor-pointer"
                                onChange={(e) => setIsInMap(e.target.checked)}
                            />
                            <MapPin size={16} className="text-amber-700" />
                            Pin this wedding on the global destination map
                        </label>
                        {isInMap && (
                            <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                                <div>
                                    <span className={labelCls}>Latitude</span>
                                    <input
                                        type="number"
                                        step="any"
                                        className={field}
                                        value={coordinate.latitude}
                                        placeholder="e.g. 24.5764"
                                        onChange={(e) => setCoordinate((c) => ({ ...c, latitude: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <span className={labelCls}>Longitude</span>
                                    <input
                                        type="number"
                                        step="any"
                                        className={field}
                                        value={coordinate.longitute}
                                        placeholder="e.g. 73.6835"
                                        onChange={(e) => setCoordinate((c) => ({ ...c, longitute: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#E8DDD1]">
                        <Button
                            type="button"
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => router.push('/admin/clients')}
                            className="text-stone-600 hover:text-stone-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            loading={creating}
                            disabled={!bride.trim() || !groom.trim()}
                            iconRight={ArrowRight}
                            onClick={createClient}
                            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                        >
                            Create &amp; Start Ingest Studio
                        </Button>
                    </div>
                </section>
            )}

            {/* ========================================================== PHASE 1: Master Ingest & Ceremony Clusters */}
            {step === 1 && (
                <section className="space-y-6">
                    {/* Dual Separated Ingest Zones: Photographs vs Films */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Zone 1: Photographs & Stills */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                            onDragLeave={() => setPhotoDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setPhotoDragOver(false);
                                onPhotoFilesChosen(e.dataTransfer.files);
                            }}
                            className={cn(
                                'flex flex-col justify-between rounded-3xl border-2 p-6 transition-all bg-[#FFFDF9]',
                                photoDragOver
                                    ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                                    : 'border-amber-200/90 hover:border-amber-300'
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                                        <ImageSquare size={24} weight="bold" />
                                    </span>
                                    <Badge size="sm" variant="terracotta">Stills Only</Badge>
                                </div>
                                <div>
                                    <h3 className="font-sans text-sm sm:text-base font-bold text-stone-900">
                                        Photographs &amp; Stills
                                    </h3>
                                    <p className="text-xs text-stone-500">
                                        Portraits, rituals, candids, decor (JPG, PNG, WebP, HEIC).
                                    </p>
                                </div>
                            </div>

                            <div className="my-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300/80 bg-white/70 px-4 py-8 text-center">
                                <UploadSimple size={28} className="text-amber-700 mb-2" />
                                <p className="text-xs font-semibold text-stone-800">
                                    Drop wedding photos here
                                </p>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                    Opens single-step curation drawer with Haldi, Mehendi, Sangeet &amp; BTS crew roles
                                </p>
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/avif,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                                    multiple
                                    hidden
                                    onChange={(e) => onPhotoFilesChosen(e.target.files)}
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

                            <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-amber-100 pt-3">
                                <span>Multi-resolution R2 concurrent pipeline</span>
                                <span className="font-semibold text-amber-900">{photoItems.length} uploaded</span>
                            </div>
                        </div>

                        {/* Zone 2: Films & Cinema */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
                            onDragLeave={() => setVideoDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setVideoDragOver(false);
                                onVideoFilesChosen(e.dataTransfer.files);
                            }}
                            className={cn(
                                'flex flex-col justify-between rounded-3xl border-2 p-6 transition-all bg-[#FFFCF8]',
                                videoDragOver
                                    ? 'border-stone-800 bg-stone-100 scale-[1.01]'
                                    : 'border-stone-200/90 hover:border-stone-400'
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-amber-300 shadow-xs">
                                        <FilmSlate size={24} weight="bold" />
                                    </span>
                                    <Badge size="sm" variant="neutral">Cinema Only</Badge>
                                </div>
                                <div>
                                    <h3 className="font-sans text-sm sm:text-base font-bold text-stone-900">
                                        Films &amp; Cinema
                                    </h3>
                                    <p className="text-xs text-stone-500">
                                        Teasers, highlights, 4K reels, master films (MP4, MOV, WebM).
                                    </p>
                                </div>
                            </div>

                            <div className="my-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/70 px-4 py-8 text-center">
                                <UploadSimple size={28} className="text-stone-700 mb-2" />
                                <p className="text-xs font-semibold text-stone-800">
                                    Drop wedding films here
                                </p>
                                <p className="text-[11px] text-stone-500 mt-0.5">
                                    Includes interactive playable previews, 8s loop generation &amp; hero star
                                </p>
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.mkv,.webm"
                                    multiple
                                    hidden
                                    onChange={(e) => onVideoFilesChosen(e.target.files)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    icon={Plus}
                                    onClick={() => videoInputRef.current?.click()}
                                    className="mt-3 border-stone-300 text-stone-900 hover:bg-stone-50 text-xs font-semibold"
                                >
                                    Stage Films
                                </Button>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100 pt-3">
                                <span>Background FFmpeg worker transcode</span>
                                <span className="font-semibold text-stone-900">{filmItems.length} uploaded</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Ceremony Clusters Breakdown */}
                    {portfolioItems.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                                        <FolderSimple size={20} className="text-amber-600" />
                                        <span>Ceremony Clusters ({Object.keys(ceremonyClusters).length} events)</span>
                                    </h3>
                                    <p className="text-xs text-stone-500">
                                        All staged captures are clustered by wedding ceremony. Click any item to fine-tune metadata.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge size="sm" variant="terracotta">{photoItems.length} Photos</Badge>
                                    <Badge size="sm" variant="neutral">{filmItems.length} Films</Badge>
                                    <Badge size="sm" variant="neutral">{formatBytes(totalStorageBytes)}</Badge>
                                </div>
                            </div>

                            {/* Ceremony Sections */}
                            <div className="space-y-5">
                                {Object.entries(ceremonyClusters).map(([clusterName, clusterItems]) => (
                                    <div
                                        key={clusterName}
                                        className="rounded-3xl border border-stone-200 bg-white p-5 space-y-3.5 shadow-xs"
                                    >
                                        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <Badge size="sm" variant="gold" className="font-semibold">
                                                    {clusterName}
                                                </Badge>
                                                <span className="text-xs text-stone-500 font-medium">
                                                    {clusterItems.length} capture{clusterItems.length === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {clusterItems.map((item) => {
                                                const poster = item.render?.posterUrl || item.render?.imageUrl || item.media?.cdnUrl || item.media?.publicUrl;
                                                const isVideo = item.kind === 'Video';

                                                return (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => setEditing(item.mediaId || item._id)}
                                                        className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 text-left transition-all hover:border-stone-400 hover:shadow-xs cursor-pointer select-none"
                                                    >
                                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                                                            {poster ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={poster}
                                                                    alt={item.title || 'Portfolio item'}
                                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-stone-400">
                                                                    {isVideo ? <FilmSlate size={24} /> : <ImageSquare size={24} />}
                                                                </div>
                                                            )}
                                                            {item.isHero && (
                                                                <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-xs">
                                                                    <Star size={8} weight="fill" /> hero
                                                                </span>
                                                            )}
                                                            <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-black/60 px-1.5 py-0.5 text-[9px] text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100 flex items-center gap-1">
                                                                <PencilSimple size={9} /> edit
                                                            </span>
                                                        </div>
                                                        <div className="p-2 space-y-0.5">
                                                            <p className="truncate text-[11px] font-medium text-stone-900" title={item.title}>
                                                                {item.title || item.media?.originalFileName || item._id}
                                                            </p>
                                                            <div className="flex items-center justify-between text-[10px] text-stone-500">
                                                                <span>{formatBytes(item.media?.fileSize || 0)}</span>
                                                                {(item.tags || []).length > 0 && (
                                                                    <span className="text-amber-800 font-medium">#{item.tags[0]}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 py-16 text-center space-y-2">
                            <p className="text-sm font-semibold text-stone-800">No media staged yet</p>
                            <p className="text-xs text-stone-500 max-w-sm mx-auto">
                                Drop photos or films above into their designated zones to begin building the wedding archive.
                            </p>
                        </div>
                    )}

                    {/* Bottom Action Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
                        <Button
                            type="button"
                            variant="ghost"
                            icon={ArrowLeft}
                            onClick={() => setStep(0)}
                        >
                            Back to Profile
                        </Button>

                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveAsDraftAndExit}
                                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                            >
                                Save as Draft &amp; View Workspace
                            </Button>

                            <Button
                                type="button"
                                variant="gold"
                                loading={publishing}
                                disabled={portfolioItems.length === 0}
                                iconRight={ArrowRight}
                                onClick={handlePublishAndFinish}
                                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-6 py-2.5 shadow-xs"
                            >
                                Publish Wedding Showcase ({portfolioItems.length})
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Metadata Detail Panel for Individual Tweaks */}
            {editingItem && editingDetails && (
                <MediaDetailsPanel
                    media={editingItem.media || editingItem}
                    value={editingDetails}
                    vocabulary={vocabulary}
                    btsRoles={btsRoles}
                    onChange={(updatedVal) => handleSaveDetail(editing, updatedVal)}
                    onClose={() => setEditing(null)}
                />
            )}

            {/* Discard Confirmation Modal */}
            <DeleteClientModal
                open={showDiscardModal}
                client={{ clientId, clientName: { Bride: bride, Groom: groom } }}
                loading={discarding}
                onClose={() => setShowDiscardModal(false)}
                onConfirm={handleDiscardClient}
            />

            {/* Photo Staging Modal */}
            <ImageUploadModal
                open={showPhotoModal}
                onClose={() => {
                    setShowPhotoModal(false);
                    setStagedPhotos([]);
                }}
                initialFiles={stagedPhotos}
                clientId={clientId}
                onUploadComplete={handlePhotoUploadComplete}
            />

            {/* Video Staging Modal */}
            <VideoUploadModal
                open={showVideoModal}
                onClose={() => {
                    setShowVideoModal(false);
                    setStagedVideos([]);
                }}
                initialFiles={stagedVideos}
                clientId={clientId}
                onUploadComplete={handleVideoUploadComplete}
            />
        </div>
    );
}
