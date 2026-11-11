'use client';

/**
 * One frame on the contact sheet.
 *
 *   - a real <a> to the photograph's page and a real <img> with a width ladder
 *     (640/1024 webp, never the original), sized from its own shape, so the
 *     server HTML is the gallery and slow phones fetch ~60 KB, not ~900 KB
 *   - the box is sized by aspect-ratio before the image arrives (CLS 0); its
 *     placeholder is the ceremony's tint under the photo's 100-byte blur
 *   - Select (top right, 44px): marks the frame the way a photographer marks a
 *     keeper on a contact sheet — a red grease-pencil loop draws around it, and
 *     a small copy of the photo flies to "Your selects"
 *   - nothing on the tile is a composited layer at rest: no backdrop-filter, no
 *     will-change, no running animation (see the /allfilms blanking fix)
 */
import { useState } from 'react';
import Link from 'next/link';
import { FiCheck, FiPlus } from 'react-icons/fi';
import { stillLadder } from '@/lib/films.js';
import { tileSizes } from '@/lib/justify.js';

const coupleOf = (p) => [p.clientName?.Bride, p.clientName?.Groom].filter(Boolean).join(' & ');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
export const aspectOf = (p) => Number(p.aspectRatio) || (p.width && p.height ? p.width / p.height : 1.5);
export const altOf = (p) => {
    if (p.caption) return p.caption;
    const c = coupleOf(p); const r = rite(p.eventGroup);
    if (c) return !r || r === 'Wedding' ? `${c}'s wedding` : `${r} at ${c}'s wedding`;
    return r || p.title || 'A wedding photograph';
};

/*
 * Hand-drawn loops, one family per shape (the archive is portrait 2:3 or
 * landscape 3:2), two variants each picked from the photo id — never a perfect
 * circle. The viewBox matches the frame, so no non-uniform scaling (Safari's
 * dash bug with non-scaling strokes). Each ends ~15% past its start, like a
 * real pencil.
 */
const LOOPS = {
    portrait: [
        'M40 4 C58 4 63 18 63 50 C63 82 55 97 33 96 C11 95 3 82 3 50 C3 19 12 4 35 4 C41 4 46 6 50 9',
        'M30 3 C52 2 64 14 63 47 C62 80 57 96 35 97 C12 98 2 84 3 52 C4 22 9 5 28 4 C36 3 41 5 45 8',
    ],
    landscape: [
        'M86 4 C128 4 147 14 147 50 C147 84 126 96 76 96 C27 96 3 86 3 50 C3 16 26 4 80 4 C92 4 101 6 108 9',
        'M70 3 C122 2 148 13 146 48 C145 82 128 97 78 97 C25 97 4 85 4 52 C4 18 22 4 66 4 C78 3 88 5 96 9',
    ],
};
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** The red grease-pencil loop. `fresh`: just selected here — draw it in. */
export function GreasePencil({ id, a, fresh = false }) {
    const shape = a < 1 ? 'portrait' : 'landscape';
    return (
        <svg aria-hidden="true" viewBox={shape === 'portrait' ? '0 0 66 100' : '0 0 150 100'} data-fresh={fresh || undefined}
            className="select-loop">
            <path pathLength="1" d={LOOPS[shape][hash(id) % 2]} />
        </svg>
    );
}

/** Fly a small copy of the photo to the selects tray (one Web Animation, then gone). */
export function flyToTray(img) {
    const tray = document.querySelector('[data-selects-target]');
    if (!img || !tray || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const from = img.getBoundingClientRect();
    const to = tray.getBoundingClientRect();
    const ghost = img.cloneNode();
    ghost.removeAttribute('srcset');
    ghost.src = img.currentSrc || img.src;
    Object.assign(ghost.style, {
        position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`,
        objectFit: 'cover', borderRadius: '6px', zIndex: 60, pointerEvents: 'none', margin: 0,
    });
    document.body.appendChild(ghost);
    const s = Math.min(40 / from.width, 40 / from.height);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    ghost.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 40}px) scale(${(1 + s) / 2.2})`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.2 },
    ], { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => {
        ghost.remove();
        tray.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
    };
}

/**
 * `layout`: this tile's place in a justified grid (lib/justify.js — --a and the
 * per-band --p/--k), for use inside .jwrap > .jgrid. Without it the tile keeps
 * its own aspect in the older .pgrid rows.
 */
export default function PhotoTile({ p, i = 0, tint, selected, onSelect, cap = 1024, priority = false, layout = null }) {
    const a = aspectOf(p);
    const ladder = stillLadder(p.url, { width: p.width, cap });
    const couple = coupleOf(p);
    const [fresh, setFresh] = useState(false); // selected in this visit: the loop draws in
    // Phones: a landscape spans the row, a portrait half of it. Wider: the tile's
    // own width at the row height (≈ a × 340px), with headroom.
    const sizes = layout ? tileSizes(layout) : `(max-width: 639px) ${a > 1 ? '100vw' : '50vw'}, ${Math.round(a * 340 * 1.2)}px`;
    return (
        <li className={`ptile group ${layout ? 'jt' : ''}`} style={{ '--a': a.toFixed(4), ...layout, backgroundColor: `rgb(${tint} / 0.22)`, ...(p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})` } : null) }}>
            <Link href={`/photos/${p._id}`} prefetch={false} className="block h-full w-full focus-ring" aria-label={`${altOf(p)}, open`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ladder?.src || p.url} srcSet={ladder?.srcSet} sizes={sizes} alt={altOf(p)}
                    width={p.width || undefined} height={p.height || undefined}
                    loading={i < 4 ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
                    className="block h-full w-full object-cover" />
                {couple && (
                    <span aria-hidden="true" className="ptile-cap pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-10 text-[13px] font-semibold text-white">
                        {couple}<span className="font-normal text-white/80">{p.eventGroup ? `, ${rite(p.eventGroup)}` : ''}</span>
                    </span>
                )}
            </Link>
            {selected && <GreasePencil id={p._id} a={a} fresh={fresh} />}
            <button type="button" aria-pressed={selected} aria-label={selected ? 'Remove from your selects' : 'Add to your selects'}
                onClick={(e) => {
                    const added = onSelect({ id: p._id, src: ladder?.src || p.url, a });
                    setFresh(added);
                    if (added && navigator.vibrate) navigator.vibrate(8);
                    if (added) flyToTray(e.currentTarget.closest('li')?.querySelector('img'));
                }}
                className={`absolute right-1.5 top-1.5 z-[3] grid h-11 w-11 cursor-pointer place-items-center rounded-full focus-ring motion-safe:active:scale-90
                            ${selected ? 'bg-accent text-ink-onAccent' : 'bg-white/90 text-ink shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)] ptile-select'}`}>
                {selected ? <FiCheck aria-hidden="true" className="h-[18px] w-[18px]" /> : <FiPlus aria-hidden="true" className="h-[18px] w-[18px]" />}
            </button>
        </li>
    );
}
