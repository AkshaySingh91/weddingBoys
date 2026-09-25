'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { X, FilmSlate, ImageSquare, Star, MapPin, CalendarBlank } from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { indianLocations } from '@/Utils/Data.js';
import { formatBytes } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';
import AssetBreakdown from '@/app/admin/components/AssetBreakdown.jsx';

const field = 'w-full rounded-lg border border-[#E5DCD3] bg-white px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#8C532B] focus:ring-2 focus:ring-[#8C532B]/15';
const label = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500';

const isVideoFileUrl = (url) => typeof url === 'string' && /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(url);

export const posterFor = (m) => {
    const candidate = m?.video?.posterUrl || m?.posterUrl || (!m?.mediaType || m?.mediaType === 'Image' ? (m?.cdnUrl || m?.publicUrl || m?.url) : null);
    return isVideoFileUrl(candidate) ? null : candidate;
};

/**
 * Metadata for one uploaded asset.
 *
 * Keyed on `mediaId`, never on the file name. The previous forms matched
 * records with `videoDetails.find(vd => vd.video.name === videoName)`, which
 * broke outright the moment the API stopped returning that name, and silently
 * collides whenever two files share a name — routine when a camera restarts
 * its numbering.
 */
export default function MediaDetailsPanel({
    media, value, vocabulary, btsRoles, onChange, onClose,
}) {
    const [tagInput, setTagInput] = useState('');
    const isVideo = media.mediaType === 'Video';

    const [ceremonies, setCeremonies] = useState([
        'Haldi', 'Mehendi', 'Sangeet', 'Wedding / Pheras', 'Reception', 'Pre-Wedding', 'Candid & Portraits'
    ]);

    useEffect(() => {
        const api_url = process.env.NEXT_PUBLIC_API_URL;
        async function fetchCeremonies() {
            try {
                const res = await fetch(`${api_url}/api/ceremonies`, { credentials: 'include' });
                const data = await res.json();
                if (data.ceremonies?.length) {
                    setCeremonies(data.ceremonies.map((c) => c.name));
                }
            } catch { /* fallback */ }
        }
        fetchCeremonies();
    }, []);

    const cityMatches = useMemo(() => {
        const q = (value.location?.city || '').trim().toLowerCase();
        if (q.length < 2) return [];
        return indianLocations
            .filter((l) => l.city.toLowerCase().startsWith(q))
            .slice(0, 6);
    }, [value.location?.city]);

    const set = (patch) => onChange({ ...value, ...patch });
    const setLoc = (patch) => onChange({ ...value, location: { ...value.location, ...patch } });

    const addTag = (raw) => {
        const t = raw.trim();
        if (!t || value.tags.includes(t)) { setTagInput(''); return; }
        set({ tags: [...value.tags, t] });
        setTagInput('');
    };

    const toggleCredit = (role, name) => {
        const exists = value.credits.find((c) => c.role === role);
        if (exists && exists.name === name) {
            set({ credits: value.credits.filter((c) => c.role !== role) });
        } else {
            set({ credits: [...value.credits.filter((c) => c.role !== role), { role, name }] });
        }
    };

    const poster = posterFor(media);
    const videoUrl = isVideo ? (media.video?.webUrl || media.video?.sourceUrl || media.cdnUrl || media.publicUrl) : null;
    const unused = (vocabulary || []).filter((t) => !value.tags.includes(t));

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <button type="button" aria-label="Close" onClick={onClose}
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" />

            <aside className="relative flex h-full w-full max-w-md flex-col border-l border-[#E5DCD3] bg-[#FCFAF7] shadow-2xl">
                <header className="flex shrink-0 items-center justify-between border-b border-[#E5DCD3] px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">
                            {media.originalFileName || media.title}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            {isVideo ? <FilmSlate size={11} /> : <ImageSquare size={11} />}
                            {media.mediaType} · {formatBytes(media.fileSize)}
                        </p>
                    </div>
                    <Button variant="ghost" size="iconSm" onClick={onClose} aria-label="Close"><X size={15} /></Button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-stone-950">
                        {poster ? (
                            <Image src={poster} alt={media.originalFileName || 'preview'} fill unoptimized sizes="400px" className="object-cover" />
                        ) : isVideo && videoUrl ? (
                            <video
                                src={videoUrl}
                                controls
                                playsInline
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-stone-400">
                                {isVideo ? <FilmSlate size={26} /> : <ImageSquare size={26} />}
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className={label}>Event Ceremony / Theme</span>
                            {value.eventGroup && (
                                <button
                                    type="button"
                                    onClick={() => set({ eventGroup: '' })}
                                    className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                            {ceremonies.map((grp) => (
                                <button
                                    key={grp}
                                    type="button"
                                    onClick={() => set({ eventGroup: value.eventGroup === grp ? '' : grp })}
                                    className={cn(
                                        'rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition text-left border cursor-pointer',
                                        value.eventGroup === grp
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-semibold'
                                            : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                                    )}
                                >
                                    {grp}
                                </button>
                            ))}
                        </div>
                        <input
                            className={field}
                            value={value.eventGroup || ''}
                            placeholder="Or enter custom ceremony (e.g. Cocktail, Baraat)..."
                            onChange={(e) => set({ eventGroup: e.target.value })}
                        />
                    </div>

                    <div>
                        <span className={label}>Tags — these decide which rows it appears in</span>
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {(value.tags || []).map((t) => (
                                <button key={t} type="button"
                                    onClick={() => set({ tags: (value.tags || []).filter((x) => x !== t) })}
                                    className="flex items-center gap-1 rounded-md border border-[#E8D7C5] bg-[#FAF1E6] px-2 py-0.5 text-[11px] text-[#74583E] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700">
                                    {t} <X size={9} />
                                </button>
                            ))}
                            {!(value.tags || []).length && (
                                <span className="text-[11px] text-amber-700">
                                    Untagged — it will not appear anywhere on the site.
                                </span>
                            )}
                        </div>
                        <input className={field} value={tagInput} placeholder="Type a tag and press Enter"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} />
                        {unused.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {unused.slice(0, 16).map((t) => (
                                    <button key={t} type="button" onClick={() => addTag(t)}
                                        className="rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-stone-600 hover:border-[#8C532B] hover:text-[#8C532B]">
                                        + {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className={label}><CalendarBlank size={10} className="mb-px inline" /> Shoot date</span>
                            <input type="date" className={field} value={value.shootDate || ''}
                                onChange={(e) => set({ shootDate: e.target.value })} />
                        </div>
                        <div>
                            <span className={label}>Priority</span>
                            <input type="number" className={field} value={value.generalPriority}
                                onChange={(e) => set({ generalPriority: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <span className={label}><MapPin size={10} className="mb-px inline" /> Location</span>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <input className={field} placeholder="City" value={value.location?.city || ''}
                                    onChange={(e) => setLoc({ city: e.target.value })} />
                                {cityMatches.length > 0 && value.location?.city !== cityMatches[0]?.city && (
                                    <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[#E5DCD3] bg-white shadow-lg">
                                        {cityMatches.map((l) => (
                                            <li key={`${l.state}-${l.city}`}>
                                                <button type="button"
                                                    onClick={() => setLoc({ city: l.city, state: l.state, country: 'India' })}
                                                    className="block w-full px-2.5 py-1.5 text-left text-[11px] text-stone-700 hover:bg-stone-50">
                                                    {l.city} <span className="text-stone-400">· {l.state}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <input className={field} placeholder="State" value={value.location?.state || ''}
                                onChange={(e) => setLoc({ state: e.target.value })} />
                            <input className={field} placeholder="Country" value={value.location?.country || ''}
                                onChange={(e) => setLoc({ country: e.target.value })} />
                            <input className={field} placeholder="Venue" value={value.location?.venue || ''}
                                onChange={(e) => setLoc({ venue: e.target.value })} />
                        </div>
                    </div>

                    {isVideo && (
                        <div className="rounded-xl border border-[#E5DCD3] bg-white p-3">
                            <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700">
                                <input type="checkbox" checked={value.isHero} className="h-3.5 w-3.5 accent-[#8C532B]"
                                    onChange={(e) => set({ isHero: e.target.checked })} />
                                <Star size={12} weight={value.isHero ? 'fill' : 'regular'} className="text-amber-500" />
                                Show in the homepage hero carousel
                            </label>
                            {value.isHero && (
                                <div className="mt-2">
                                    <span className={label}>Hero priority</span>
                                    <input type="number" className={field} value={value.heroPriority}
                                        onChange={(e) => set({ heroPriority: e.target.value })} />
                                </div>
                            )}
                        </div>
                    )}

                    {btsRoles?.length > 0 && (
                        <div>
                            <span className={label}>Crew</span>
                            <div className="space-y-1.5">
                                {btsRoles.map((r) => {
                                    // btsRoleSchema is { title: <role>, key: <person> }.
                                    const role = r.title;
                                    const person = r.key;
                                    const on = value.credits.some((c) => c.role === role && c.name === person);
                                    return (
                                        <button key={r._id || role} type="button"
                                            onClick={() => toggleCredit(role, person)}
                                            className={cn(
                                                'flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition',
                                                on ? 'border-[#8C532B] bg-[#FAF1E6] text-[#74583E]'
                                                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400',
                                            )}>
                                            <span className="font-medium">{role}</span>
                                            <span className="text-stone-500">{person}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <span className={label}>Caption</span>
                        <textarea rows={2} className={field} value={value.caption || ''}
                            onChange={(e) => set({ caption: e.target.value })} />
                    </div>

                    <div>
                        <span className={label}>What was generated</span>
                        <AssetBreakdown media={media} compact />
                    </div>
                </div>

                <footer className="flex shrink-0 justify-end gap-2 border-t border-[#E5DCD3] bg-white px-4 py-3">
                    <Button variant="gold" size="sm" onClick={onClose}>Done</Button>
                </footer>
            </aside>
        </div>
    );
}
