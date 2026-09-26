'use client';

import { useState } from 'react';
import { FiPlay } from 'react-icons/fi';
import Media from '@/Component/ui/Media.jsx';
import FilmLightbox from '@/Component/FilmLightbox.jsx';
import Videoplayer from '@/Component/Videoplayer.jsx';

const sourceOf = (f) => f.webUrl || f.sourceUrl || f.embedUrl;

const duration = (sec) => {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * The wedding's films: the lead film plays in place, the rest open in the
 * lightbox. A YouTube / Vimeo film loads its player only when pressed — until
 * then it is a poster, so the page sends nothing to those hosts on arrival.
 */
export default function StoryFilms({ films, couple }) {
    const [playing, setPlaying] = useState(false);
    const [open, setOpen] = useState(null);
    const [lead, ...rest] = films;
    if (!lead) return null;

    return (
        <div className="space-y-6">
            <div className="overflow-hidden border border-gold/45 bg-black">
                {playing ? (
                    lead.embedUrl ? (
                        <div className="relative aspect-video w-full">
                            <iframe
                                src={`${lead.embedUrl}${lead.embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                                title={`${couple} — wedding film`}
                                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                                allowFullScreen
                                className="absolute inset-0 h-full w-full border-0"
                            />
                        </div>
                    ) : (
                        <Videoplayer src={sourceOf(lead)} />
                    )
                ) : (
                    <button type="button" onClick={() => setPlaying(true)} className="group relative block w-full text-left"
                        aria-label={`Play the film — ${couple}`}>
                        <Media src={lead.posterUrl} alt={`${couple}, wedding film`} ratio="film" scrim="bottom" priority
                            blurDataURL={lead.blurDataURL} dominantColor={lead.dominantColor}
                            sizes="(max-width: 1180px) 100vw, 1180px"
                            overlay={
                                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-8">
                                    <div style={{ color: 'var(--ink-on-deep)' }}>
                                        {lead.caption && <p className="t-heading-2" style={{ color: 'inherit' }}>{lead.caption}</p>}
                                        {duration(lead.durationSec) && <p className="t-caption mt-1" style={{ color: 'inherit', opacity: 0.85 }}>{duration(lead.durationSec)}</p>}
                                    </div>
                                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-pill border border-gold/70 bg-ink/45 text-white backdrop-blur-sm transition-colors duration-micro group-hover:bg-accent">
                                        <FiPlay className="ml-0.5 h-6 w-6" aria-hidden="true" />
                                    </span>
                                </div>
                            } />
                    </button>
                )}
            </div>

            {rest.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((f) => (
                        <li key={f._id}>
                            <button type="button" onClick={() => setOpen(f)} className="group block w-full text-left" aria-label={`Play ${f.caption || 'film'}`}>
                                <Media src={f.posterUrl} alt={f.caption || `${couple}, film`} ratio="film" scrim="bottom"
                                    blurDataURL={f.blurDataURL} dominantColor={f.dominantColor}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                                    overlay={
                                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                                            <p className="t-body-sm truncate" style={{ color: 'var(--ink-on-deep)' }}>{f.caption || f.ceremony || 'Film'}</p>
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill border border-gold/70 bg-ink/45 text-white group-hover:bg-accent">
                                                <FiPlay className="ml-0.5 h-4 w-4" aria-hidden="true" />
                                            </span>
                                        </div>
                                    } />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {open && <FilmLightbox src={sourceOf(open)} title={open.caption || couple} onClose={() => setOpen(null)} />}
        </div>
    );
}
