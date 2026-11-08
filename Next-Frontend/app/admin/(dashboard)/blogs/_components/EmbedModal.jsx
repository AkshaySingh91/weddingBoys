'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import {
    LinkSimple,
    FilmSlate,
    InstagramLogo,
    SpotifyLogo,
    MapPin,
    PinterestLogo,
    Sparkle,
    CircleNotch,
    MagnifyingGlass,
    Check,
    Play,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const PROVIDER_HINTS = [
    { name: 'YouTube', icon: FilmSlate, color: 'text-rose-600', example: 'youtube.com/watch?v=...' },
    { name: 'Vimeo', icon: FilmSlate, color: 'text-sky-500', example: 'vimeo.com/...' },
    { name: 'Instagram', icon: InstagramLogo, color: 'text-pink-600', example: 'instagram.com/reel/...' },
    { name: 'Spotify', icon: SpotifyLogo, color: 'text-emerald-500', example: 'open.spotify.com/track/...' },
    { name: 'Google Maps', icon: MapPin, color: 'text-amber-600', example: 'maps.google.com/...' },
    { name: 'Pinterest', icon: PinterestLogo, color: 'text-accent-ink', example: 'pinterest.com/pin/...' },
    { name: 'Cloudflare', icon: FilmSlate, color: 'text-orange-500', example: 'videodelivery.net/...' },
];

export default function EmbedModal({
    open,
    onOpenChange,
    onInsert,
    defaultTab = 'link',
}) {
    const [tab, setTab] = useState(defaultTab); // 'link' | 'portfolio'
    const [url, setUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16/9');
    const [resolving, setResolving] = useState(false);
    const [resolvedData, setResolvedData] = useState(null);
    const [resolveError, setResolveError] = useState('');

    // Portfolio search state
    const [clientQuery, setClientQuery] = useState('');
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const debounceRef = useRef(null);

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setTab(defaultTab);
            setUrl('');
            setCaption('');
            setAspectRatio('16/9');
            setResolvedData(null);
            setResolveError('');
            setSelectedClient(null);
            setSelectedVideo(null);
        }
    }, [open, defaultTab]);

    // Live URL resolution (500ms debounce)
    const handleUrlChange = (val) => {
        setUrl(val);
        setResolveError('');
        setResolvedData(null);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = val.trim();
        if (!trimmed || !trimmed.startsWith('http')) return;

        debounceRef.current = setTimeout(async () => {
            setResolving(true);
            try {
                const res = await fetch(`${api_url}/api/admin/embed/resolve?url=${encodeURIComponent(trimmed)}`, {
                    credentials: 'include',
                });
                const data = await res.json();
                if (res.ok && data.provider) {
                    setResolvedData(data);
                    setAspectRatio(data.aspectRatio || '16/9');
                    setCaption(data.caption || '');
                } else {
                    setResolveError(data.error || 'Could not resolve media metadata');
                }
            } catch (err) {
                setResolveError(err.message || 'Error connecting to embed resolver');
            } finally {
                setResolving(false);
            }
        }, 500);
    };

    // Fetch portfolio clients
    const fetchPortfolioClients = useCallback(async (query = '') => {
        setLoadingClients(true);
        try {
            const res = await fetch(`${api_url}/api/admin/embed/clients?query=${encodeURIComponent(query)}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                setClients(data.clients || []);
            }
        } catch (err) {
            fireMessage('Failed to search clients', 'error');
        } finally {
            setLoadingClients(false);
        }
    }, []);

    useEffect(() => {
        if (open && tab === 'portfolio') {
            fetchPortfolioClients(clientQuery);
        }
    }, [open, tab, clientQuery, fetchPortfolioClients]);

    // Insert from Link Tab
    const handleInsertLink = () => {
        if (!resolvedData) return;
        onInsert?.({
            ...resolvedData,
            caption: caption.trim(),
            aspectRatio,
        });
        onOpenChange?.(false);
    };

    // Insert from Portfolio Tab
    const handleInsertPortfolio = () => {
        if (!selectedClient || !selectedVideo) return;
        const embedUrl = selectedVideo.streamUid
            ? `https://iframe.videodelivery.net/${selectedVideo.streamUid}`
            : selectedVideo.hlsUrl;

        onInsert?.({
            provider: 'client-showcase',
            url: embedUrl,
            embedId: selectedVideo.id,
            embedUrl,
            thumbnail: selectedVideo.poster || '',
            title: selectedVideo.title,
            author: 'The Wedding Vachan',
            aspectRatio: '16/9',
            caption: caption.trim() || `${selectedClient.title} Wedding Film`,
            clientRef: {
                id: selectedClient.id,
                title: selectedClient.title,
                bride: selectedClient.bride,
                groom: selectedClient.groom,
                venue: selectedVideo.venue || '',
                streamUid: selectedVideo.streamUid,
                poster: selectedVideo.poster,
            },
        });
        onOpenChange?.(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl font-sans">
                <DialogHeader className="border-b border-edge-subtle pb-3">
                    <DialogTitle className="text-base font-bold text-ink flex items-center gap-2">
                        <Sparkle size={18} className="text-accent-ink" />
                        Embed Rich Media
                    </DialogTitle>
                    <DialogDescription className="text-xs text-ink-muted">
                        Embed streaming videos, Instagram reels, Spotify soundtracks, Google Maps venues, or studio portfolio films with performance-safe facades.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs Header */}
                <div className="flex items-center gap-1 border-b border-edge-subtle pt-1">
                    <button
                        type="button"
                        onClick={() => setTab('link')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            tab === 'link'
                                ? 'border-accent text-accent-ink'
                                : 'border-transparent text-ink-muted hover:text-ink'
                        }`}
                    >
                        <LinkSimple size={15} />
                        <span>Universal Web Link</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('portfolio')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            tab === 'portfolio'
                                ? 'border-accent text-accent-ink'
                                : 'border-transparent text-ink-muted hover:text-ink'
                        }`}
                    >
                        <Sparkle size={15} />
                        <span>Studio Portfolio</span>
                    </button>
                </div>

                {/* Tab 1: Universal Link Input */}
                {tab === 'link' && (
                    <div className="space-y-4 py-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                                Media URL
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="Paste YouTube, Vimeo, Instagram Reel, Spotify, or Google Maps URL..."
                                    className="w-full rounded-xl border border-edge-subtle bg-ground px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent pr-8"
                                    autoFocus
                                />
                                {resolving && (
                                    <CircleNotch size={15} className="animate-spin text-accent-ink absolute right-2.5 top-2.5" />
                                )}
                            </div>
                        </div>

                        {/* Supported Providers Pills */}
                        {!resolvedData && !resolveError && (
                            <div className="rounded-xl border border-edge-subtle bg-ground/50 p-3">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                                    Supported Platforms &amp; Facades
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {PROVIDER_HINTS.map((h) => {
                                        const Icon = h.icon;
                                        return (
                                            <span
                                                key={h.name}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-edge-subtle px-2 py-1 text-[11px] text-ink-secondary shadow-sm"
                                            >
                                                <Icon size={12} className={h.color} />
                                                <span>{h.name}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Error Notice */}
                        {resolveError && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                {resolveError}
                            </div>
                        )}

                        {/* Resolved Media Preview Card */}
                        {resolvedData && (
                            <div className="rounded-xl border border-edge-subtle bg-ground/60 p-3.5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="success" size="sm" className="capitalize">
                                        {resolvedData.provider} Detected
                                    </Badge>
                                    <span className="text-[10px] text-ink-muted font-mono">
                                        Facade Ready
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-edge-subtle">
                                    {resolvedData.thumbnail && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={resolvedData.thumbnail}
                                            alt="preview"
                                            className="h-14 w-20 rounded-lg object-cover bg-ground-sunk shrink-0"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold text-ink truncate">
                                            {resolvedData.title}
                                        </h4>
                                        <p className="text-[11px] text-ink-muted truncate">
                                            {resolvedData.author || resolvedData.provider}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                                            Caption (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="e.g. Sangeet entry song"
                                            className="w-full rounded-lg border border-edge-subtle bg-white px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                                            Aspect Ratio
                                        </label>
                                        <select
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                            className="w-full rounded-lg border border-edge-subtle bg-white px-2.5 py-1.5 text-xs text-ink font-medium focus:outline-none focus:border-accent"
                                        >
                                            <option value="16/9">16:9 (Landscape Video)</option>
                                            <option value="9/16">9:16 (Vertical Reel / Shorts)</option>
                                            <option value="4/5">4:5 (Instagram Post)</option>
                                            <option value="1/1">1:1 (Square)</option>
                                            <option value="compact">Compact Audio</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Studio Portfolio Picker */}
                {tab === 'portfolio' && (
                    <div className="space-y-3 py-3">
                        <div className="relative">
                            <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-ink-muted" />
                            <input
                                type="text"
                                value={clientQuery}
                                onChange={(e) => setClientQuery(e.target.value)}
                                placeholder="Search couples (e.g. Rhea & Kabir) or venue..."
                                className="w-full rounded-xl border border-edge-subtle bg-ground pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                            {loadingClients ? (
                                <div className="py-8 text-center text-xs text-ink-muted">
                                    Searching studio portfolio...
                                </div>
                            ) : clients.length === 0 ? (
                                <div className="py-8 text-center text-xs text-ink-muted">
                                    No client films found. Create client profiles in Website Setting &gt; Clients.
                                </div>
                            ) : (
                                clients.map((c) => {
                                    const hasVideos = c.videos?.length > 0;
                                    if (!hasVideos) return null;

                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-xl border border-edge-subtle bg-ground/50 p-3 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-sans text-sm font-bold text-ink">
                                                    {c.title}
                                                </h4>
                                                <span className="text-[10px] text-ink-muted font-mono">
                                                    {c.videos.length} video{c.videos.length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5">
                                                {c.videos.map((vid) => {
                                                    const isSelected = selectedVideo?.id === vid.id;
                                                    return (
                                                        <button
                                                            key={vid.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedClient(c);
                                                                setSelectedVideo(vid);
                                                            }}
                                                            className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'border-accent bg-white ring-1 ring-accent/20'
                                                                    : 'border-edge-subtle bg-white hover:border-edge-strong'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent-ink shrink-0">
                                                                    <Play size={12} weight="fill" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold truncate text-ink">
                                                                        {vid.title}
                                                                    </div>
                                                                    {vid.venue && (
                                                                        <div className="text-[10px] text-ink-muted truncate">
                                                                            📍 {vid.venue}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <Check size={14} weight="bold" className="text-accent-ink shrink-0 ml-2" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedVideo && (
                            <div className="pt-2">
                                <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                                    Showcase Caption
                                </label>
                                <input
                                    type="text"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="e.g. Highlights from Rhea & Kabir’s Udaipur Palace Celebration"
                                    className="w-full rounded-lg border border-edge-subtle bg-white px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
                                />
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 border-t border-edge-subtle pt-3">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>
                        Cancel
                    </Button>
                    {tab === 'link' ? (
                        <Button
                            variant="gold"
                            size="sm"
                            disabled={!resolvedData}
                            onClick={handleInsertLink}
                        >
                            Insert Embed
                        </Button>
                    ) : (
                        <Button
                            variant="gold"
                            size="sm"
                            disabled={!selectedVideo}
                            onClick={handleInsertPortfolio}
                        >
                            Insert Studio Film
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
