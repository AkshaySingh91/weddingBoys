/**
 * The team — "scale spine": hierarchy told by size, joined by one gold thread.
 *
 *   ┃ 01 Founders           two portrait cards, the largest on the page
 *   ┃ 02 Managing Director  a wine-black card with the full-length portrait inset
 *   ┃ 03 The crew           a compact rail of square headshots, names beneath
 *
 * Phones: the thread runs down the left gutter with a node at each tier, so the
 * whole team fits in ~560px (it was ~1,500px as three stacked tiers). From md
 * the founders and the MD share one row and the crew sit six across beneath.
 * Card size steps down 1 → 2 → 3, so rank reads before any label does.
 *
 * Server component; entrances via the page's RevealObserver (data-rise).
 * Concept from the creative-section-designer review (film billing blocks:
 * rank by row and size, everything visible without interaction).
 */
import Image from 'next/image';
import { FOUNDERS, MANAGING_DIRECTOR, CREW } from '@/lib/team.js';
import { CARD_DEEP } from './Chapter.jsx';

/** Tier label; on phones its node sits on the gold thread. */
function Tier({ n, children, className = '' }) {
    return (
        <p className={`relative flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted ${className}`}>
            <span aria-hidden="true"
                className="absolute -left-[27px] top-1/2 grid h-[18px] w-[18px] -translate-y-1/2 place-items-center rounded-full bg-ground ring-1 ring-gold md:hidden">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            <span className="tabular-nums text-gold-strong">{n}</span>
            {children}
        </p>
    );
}

function FounderCard({ f, d }) {
    return (
        <figure data-rise="" style={{ '--d': d }}
            className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-ground-deep shadow-[0_18px_36px_-22px_rgba(51,22,26,0.6)] md:aspect-[3/4] md:rounded-[28px]">
            <Image src={f.image} alt={`${f.name}, ${f.role}`} fill placeholder="blur"
                sizes="(max-width: 768px) 45vw, 360px" className="object-cover object-[50%_26%]" />
            <figcaption className="absolute inset-x-1.5 bottom-1.5 rounded-[18px] bg-white/80 px-2.5 py-2 backdrop-blur-md md:inset-x-2 md:bottom-2 md:px-4 md:py-3">
                <span className="block truncate text-[13.5px] font-semibold leading-tight text-ink md:text-[18px]">{f.name}</span>
                <span className="block truncate text-[11px] text-ink-muted md:text-[13px]">{f.role}<span className="hidden md:inline"> · on set since 2015</span></span>
            </figcaption>
        </figure>
    );
}

export default function StudioTeam() {
    const md = MANAGING_DIRECTOR;
    return (
        <div className="relative mt-8 pl-8 sm:mt-12 md:pl-0">
            {/* The thread (phones). */}
            <span aria-hidden="true" data-rise="draw-y"
                className="absolute bottom-16 left-[8px] top-2 w-px bg-gradient-to-b from-gold via-gold/60 to-gold/0 md:hidden" />

            <div className="lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-5">
            <div className="md:grid md:grid-cols-[1fr_1fr_0.9fr] md:gap-4 lg:col-span-9">
                <div className="md:col-span-2">
                    <Tier n="01">Founders</Tier>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5 md:mt-3 md:gap-4">
                        {FOUNDERS.map((f, k) => <FounderCard key={f.name} f={f} d={k} />)}
                    </div>
                </div>

                <div className="mt-5 flex flex-col md:mt-0">
                    <Tier n="02">Managing Director</Tier>
                    <div data-rise="" style={{ '--d': 2 }}
                        className={`mt-2.5 grid flex-1 grid-cols-[84px_1fr] items-end gap-3 p-2 md:mt-3 md:grid-cols-1 md:items-stretch md:gap-0 md:p-2 ${CARD_DEEP}`}>
                        <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-ground-deep md:aspect-auto md:min-h-[260px] md:flex-1 md:rounded-[22px]">
                            <Image src={md.image} alt={`${md.name}, ${md.role}`} fill placeholder="blur"
                                sizes="(max-width: 768px) 84px, 300px" className="object-cover object-top" />
                        </div>
                        <div className="pb-1.5 pr-2 md:p-4">
                            <span className="inline-flex rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ground-deep">
                                {md.role}
                            </span>
                            <p className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em] md:text-[30px]">{md.name}</p>
                            <p className="mt-2 text-[13px] leading-snug text-ink-onDeep/70 md:text-[14px]">{md.line}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3">
            <Tier n="03" className="mt-5 md:mt-8 lg:mt-0">The crew</Tier>
            <ul className="-mr-5 mt-2.5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-5 scrollbar-none
                           md:mr-0 md:mt-3 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:pr-0 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-4">
                {CREW.map((c, k) => (
                    <li key={c.name} data-rise="" style={{ '--d': (k % 3) + 1 }} className="w-[88px] shrink-0 snap-start md:w-auto">
                        <div className="relative aspect-square overflow-hidden rounded-[18px] bg-ground-deep md:rounded-[22px]">
                            <Image src={c.image} alt={`${c.name}, ${c.role}`} fill placeholder="blur"
                                sizes="(max-width: 768px) 88px, 200px" className="object-cover object-[50%_22%]" />
                        </div>
                        <p className="mt-1.5 truncate text-[12.5px] font-semibold leading-tight text-ink md:mt-2 md:text-[14px] lg:text-[12.5px]">{c.name}</p>
                        <p className="truncate text-[11px] text-ink-muted md:text-[12.5px] lg:text-[11px]">{c.role}</p>
                    </li>
                ))}
            </ul>
            </div>
            </div>
        </div>
    );
}
