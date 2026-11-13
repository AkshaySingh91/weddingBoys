'use client';

/**
 * /invite/<code> — the invitation a couple sent their partner.
 *
 * It arrives sealed: the red TWV seal lifts and the card rises, in the light
 * the couple chose. Then the studio's photographs (chosen when the invitation
 * was made) are dealt from the card onto the light table; the partner circles
 * the ones they love (the same red grease-pencil Select as the gallery) and
 * sends their circles to the studio, keeps them as a lookbook, or makes an
 * invitation of their own. The couple's contact details and note never appear.
 *
 * Phones: the card, then the photographs, a bar under the thumb. Desktop: the
 * card stays on the left while the photographs fill the table on the right.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import PhotoTile, { aspectOf } from '@/Component/photos/PhotoTile.jsx';
import { useSelects } from '@/Component/photos/selects.js';
import { justify } from '@/lib/justify.js';
import { gradeOf, GOLD, lookOf } from '@/lib/grades.js';
import { stillLadder } from '@/lib/films.js';
import { SITE_URL } from '@/lib/siteConfig.js';

const api = () => (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'));
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const whenText = (w) => {
    if (!w) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(w)) { const [y, m, d] = w.split('-').map(Number); return `on ${d} ${MONTHS[m - 1]} ${y}`; }
    return w === 'Not fixed yet' ? 'on a date still to be fixed' : `in ${w}`;
};

export default function InviteView({ invitation: inv, studioPhone = null }) {
    const selects = useSelects();
    const names = [inv.names?.a, inv.names?.b].filter(Boolean).join(' & ');
    const look = lookOf(inv.grade);
    const layout = useMemo(() => justify(inv.photos.map(aspectOf)), [inv.photos]);
    const ids = useMemo(() => new Set(inv.photos.map((p) => p._id)), [inv.photos]);
    const circled = selects.list.filter((x) => ids.has(x.id));
    const windowPhoto = inv.photos.find((p) => Number(p.aspectRatio) < 1) || inv.photos[0];
    const [making, setMaking] = useState(false);
    const card = useRef(null);
    const table = useRef(null);

    // The photographs are dealt from the card onto the table, once (on screen, ≤ 12).
    useEffect(() => {
        const ul = table.current; const from = card.current;
        if (!ul || !from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const c = from.getBoundingClientRect();
        const fx = c.left + c.width / 2; const fy = c.top + c.height / 3;
        [...ul.children].slice(0, 12).forEach((li, n) => {
            const r = li.getBoundingClientRect();
            if (r.top > window.innerHeight) return;
            li.animate([
                { transform: `translate(${fx - (r.left + r.width / 2)}px, ${fy - (r.top + r.height / 2)}px) scale(0.3) rotate(${n % 2 ? 6 : -6}deg)`, opacity: 0 },
                { transform: 'none', opacity: 1 },
            ], { duration: 640, delay: 900 + n * 45, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
        });
    }, []);

    const message = `Hi The Wedding Vachan! I'm looking at ${names ? `${names}'s` : 'our'} invitation (${inv.code}). We circled these: ${circled.map((x) => `${SITE_URL}/photos/${x.id}`).join(' ')}`;
    const sendCircles = () => {
        // Keep a record with the invitation (fire and forget), then hand over to WhatsApp.
        fetch(`${api()}/api/invites/${inv.code}/reply`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ circled: circled.map((x) => x.id) }) }).catch(() => {});
    };
    const lookbook = async () => {
        setMaking(true);
        try {
            const res = await fetch(`${api()}/api/photos/selects.pdf?ids=${circled.map((x) => x.id).join(',')}${names ? `&names=${encodeURIComponent(names)}` : ''}`);
            if (!res.ok) throw new Error();
            const url = URL.createObjectURL(await res.blob());
            const a = Object.assign(document.createElement('a'), { href: url, download: 'the-wedding-vachan-selects.pdf' });
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
        } catch { /* the button stays; they can try again */ } finally { setMaking(false); }
    };

    return (
        <div className="relative isolate">
            <span aria-hidden="true" style={{ '--grade': look.rgb }} className="scene-grade pointer-events-none fixed inset-0 -z-10" />
            <div className="mx-auto w-full max-w-wide px-4 pb-36 pt-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:px-8 lg:pt-10">
                <div className="lg:sticky lg:top-[calc(var(--header-height)+16px)] lg:self-start">
                    <article ref={card} data-look={inv.grade} style={{ '--grade': look.rgb }} className="invite-card invite-arrive" aria-label={`${names}'s invitation`}>
                        <span aria-hidden="true" className="invite-seal invite-seal-lift">TWV</span>
                        {windowPhoto ? (
                            <span aria-hidden="true" className="invite-window">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={stillLadder(windowPhoto.url, { width: windowPhoto.width, cap: 640 })?.src || windowPhoto.url} alt="" />
                            </span>
                        ) : <span aria-hidden="true" className="invite-mono">TWV</span>}
                        <p className="invite-line text-[11.5px] font-semibold uppercase tracking-[0.22em] text-gold">Together with their families</p>
                        <h1 className="mt-4 font-display text-[40px] leading-[1.05] text-ink sm:text-[48px]">{names}</h1>
                        <p className="invite-line mt-5">invite The Wedding Vachan to their {(inv.kind || 'wedding').toLowerCase()}</p>
                        {(inv.when || inv.city) && (
                            <p className="mt-3 font-display text-[28px] leading-tight text-ink">
                                {[whenText(inv.when), inv.city && `in ${inv.city}`].filter(Boolean).join(', ').replace(/^./, (c) => c.toUpperCase())}
                            </p>
                        )}
                        <p className="mx-auto mt-6 max-w-sm text-[14.5px] leading-relaxed text-ink-secondary">
                            {inv.names?.a} sent you this, with {inv.photos.length} of our photographs. Circle the ones you love.
                        </p>
                    </article>
                </div>

                <section aria-labelledby="table-title" className="mt-12 lg:mt-0">
                    <h2 id="table-title" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">From The Wedding Vachan</h2>
                    <p className="mt-2 text-[15px] text-ink-muted">Tap the + on any photograph to circle it.</p>
                    <div className="jwrap mt-5">
                        <ul ref={table} className="jgrid">
                            {inv.photos.map((p, i) => (
                                <PhotoTile key={p._id} p={p} i={i} layout={layout[i]} tint={p.eventGroup ? gradeOf({ label: rite(p.eventGroup) }) : GOLD}
                                    selected={selects.has(p._id)} onSelect={selects.toggle} />
                            ))}
                        </ul>
                    </div>
                </section>
            </div>

            {/* the bar: what to do with the circles */}
            <div className="invite-bar is-float">
                {circled.length > 0 ? (
                    <>
                        {studioPhone && (
                            <a href={`https://wa.me/${String(studioPhone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" onClick={sendCircles}
                                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring">
                                <FaWhatsapp aria-hidden="true" className="h-5 w-5" />Send your {circled.length} to the studio
                            </a>
                        )}
                        <button type="button" onClick={lookbook} disabled={making} aria-label="Download them as a lookbook"
                            className="flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-4 text-[15px] font-semibold text-ground hover:bg-ink/90 focus-ring disabled:cursor-wait">
                            <FiDownload aria-hidden="true" className="h-[18px] w-[18px]" /><span className="hidden sm:inline">{making ? 'Making it…' : 'Lookbook'}</span>
                        </button>
                    </>
                ) : (
                    <>
                        <p className="flex flex-1 items-center text-[14px] text-ink-secondary">Circle a few you love.</p>
                        <Link href="/contact?from=invite" className="flex h-12 shrink-0 items-center rounded-full px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                            Make your own invitation
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
