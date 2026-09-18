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
    { name: 'Pinterest', icon: PinterestLogo, color: 'text-red-600', example: 'pinterest.com/pin/...' },
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
            author: 'The Wedding Boys',
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
                <DialogHeader className="border-b border-[#E5DCD3] pb-3">
                    <DialogTitle className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                        <Sparkle size={18} className="text-[#8C532B]" />
                        Embed Rich Media
                    </DialogTitle>
                    <DialogDescription className="text-xs text-stone-500">
                        Embed streaming videos, Instagram reels, Spotify soundtracks, Google Maps venues, or studio portfolio films with performance-safe facades.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs Header */}
                <div className="flex items-center gap-1 border-b border-[#E5DCD3] pt-1">
                    <button
                        type="button"
                        onClick={() => setTab('link')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            tab === 'link'
                                ? 'border-[#8C532B] text-[#8C532B]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
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
                                ? 'border-[#8C532B] text-[#8C532B]'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
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
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                Media URL
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="Paste YouTube, Vimeo, Instagram Reel, Spotify, or Google Maps URL..."
                                    className="w-full rounded-xl border border-[#E5DCD3] bg-stone-50 px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:border-[#8C532B] pr-8"
                                    autoFocus
                                />
                                {resolving && (
                                    <CircleNotch size={15} className="animate-spin text-[#8C532B] absolute right-2.5 top-2.5" />
                                )}
                            </div>
                        </div>

                        {/* Supported Providers Pills */}
                        {!resolvedData && !resolveError && (
                            <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-3">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                                    Supported Platforms &amp; Facades
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {PROVIDER_HINTS.map((h) => {
                                        const Icon = h.icon;
                                        return (
                                            <span
                                                key={h.name}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200 px-2 py-1 text-[11px] text-stone-700 shadow-sm"
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
                            <div className="rounded-xl border border-[#E5DCD3] bg-stone-50/60 p-3.5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="success" size="sm" className="capitalize">
                                        {resolvedData.provider} Detected
                                    </Badge>
                                    <span className="text-[10px] text-stone-400 font-mono">
                                        Facade Ready
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-[#E5DCD3]">
                                    {resolvedData.thumbnail && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={resolvedData.thumbnail}
                                            alt="preview"
                                            className="h-14 w-20 rounded-md object-cover bg-stone-100 shrink-0"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold text-[#1C1917] truncate">
                                            {resolvedData.title}
                                        </h4>
                                        <p className="text-[11px] text-stone-500 truncate">
                                            {resolvedData.author || resolvedData.provider}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                            Caption (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="e.g. Sangeet entry song"
                                            className="w-full rounded-lg border border-[#E5DCD3] bg-white px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8C532B]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                            Aspect Ratio
                                        </label>
                                        <select
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                            className="w-full rounded-lg border border-[#E5DCD3] bg-white px-2.5 py-1.5 text-xs text-[#1C1917] font-medium focus:outline-none focus:border-[#8C532B]"
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
                            <MagnifyingGlass size={15} className="absolute left-3 top-2.5 text-stone-400" />
                            <input
                                type="text"
                                value={clientQuery}
                                onChange={(e) => setClientQuery(e.target.value)}
                                placeholder="Search couples (e.g. Rhea & Kabir) or venue..."
                                className="w-full rounded-xl border border-[#E5DCD3] bg-stone-50 pl-9 pr-3 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#8C532B]"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                            {loadingClients ? (
                                <div className="py-8 text-center text-xs text-stone-400">
                                    Searching studio portfolio...
                                </div>
                            ) : clients.length === 0 ? (
                                <div className="py-8 text-center text-xs text-stone-400">
                                    No client films found. Create client profiles in Website Setting &gt; Clients.
                                </div>
                            ) : (
                                clients.map((c) => {
                                    const hasVideos = c.videos?.length > 0;
                                    if (!hasVideos) return null;

                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-xl border border-[#E5DCD3] bg-stone-50/50 p-3 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-playfair text-sm font-bold text-[#1C1917]">
                                                    {c.title}
                                                </h4>
                                                <span className="text-[10px] text-stone-400 font-mono">
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
                                                                    ? 'border-[#8C532B] bg-white ring-1 ring-[#8C532B]/20'
                                                                    : 'border-[#E5DCD3]/60 bg-white hover:border-stone-400'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#8C532B]/10 text-[#8C532B] shrink-0">
                                                                    <Play size={12} weight="fill" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold truncate text-[#1C1917]">
                                                                        {vid.title}
                                                                    </div>
                                                                    {vid.venue && (
                                                                        <div className="text-[10px] text-stone-500 truncate">
                                                                            📍 {vid.venue}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <Check size={14} weight="bold" className="text-[#8C532B] shrink-0 ml-2" />
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
                                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                                    Showcase Caption
                                </label>
                                <input
                                    type="text"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="e.g. Highlights from Rhea & Kabir’s Udaipur Palace Celebration"
                                    className="w-full rounded-lg border border-[#E5DCD3] bg-white px-2.5 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8C532B]"
                                />
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 border-t border-[#E5DCD3] pt-3">
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
