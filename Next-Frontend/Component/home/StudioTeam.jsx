/**
 * The studio, in black & white — the team as a hierarchy you can read at a
 * glance, without drawing an org chart.
 *
 *   01 Founders           two seated portraits, side by side, the largest cards
 *        └──┬──┘          a gold bracket joins them and drops to…
 *   02 Managing Director  the standing full-length portrait in a wine-black card
 *           │
 *   03 The crew           matching studio headshots, a swipe rail on phones
 *
 * Data: lib/team.js. Server component — nothing here needs state; entrances come
 * from the page's RevealObserver (data-rise).
 */
import Image from 'next/image';
import { FOUNDERS, MANAGING_DIRECTOR, CREW } from '@/lib/team.js';
import { GlassChip, CARD_DEEP } from './Chapter.jsx';

function Tier({ n, children }) {
    return (
        <p data-rise="" className="relative z-10 mx-auto flex w-fit items-center gap-2 rounded-full bg-ground-raised py-1 pl-1 pr-3.5 text-[12.5px] font-semibold
                                   text-ink ring-1 ring-ink/[0.07] shadow-[0_4px_14px_-10px_rgba(51,22,26,0.4)]">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-gold text-[10.5px] tabular-nums text-ground-deep">{n}</span>
            {children}
        </p>
    );
}

/** Gold connector: a bracket joining the two founders, or a plain drop. */
function Thread({ bracket = false }) {
    return (
        <div aria-hidden="true" className={`relative mx-auto ${bracket ? 'h-12 w-1/2' : 'h-8 w-px'}`}>
            {bracket && <span data-rise="draw" className="absolute inset-x-0 top-0 h-5 rounded-b-2xl border-x border-b border-gold/60" />}
            <span className={`absolute left-1/2 w-px -translate-x-1/2 bg-gold/60 ${bracket ? 'top-5 h-7' : 'inset-y-0'}`} />
        </div>
    );
}

export default function StudioTeam() {
    const md = MANAGING_DIRECTOR;
    return (
        <div className="mt-8 sm:mt-12">
            <Tier n="01">Founders</Tier>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:mx-auto lg:max-w-4xl">
                {FOUNDERS.map((f, k) => (
                    <li key={f.name} data-rise="" style={{ '--d': k }}>
                        <figure className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-ground-deep shadow-[0_22px_44px_-24px_rgba(51,22,26,0.6)]">
                            <Image src={f.image} alt={`${f.name}, ${f.role}`} fill placeholder="blur"
                                sizes="(max-width: 1024px) 50vw, 440px" className="object-cover object-[50%_28%]" />
                            <span className="absolute left-2.5 top-2.5"><GlassChip>{f.role}</GlassChip></span>
                            <figcaption className="absolute inset-x-2 bottom-2 rounded-[20px] bg-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
                                <span className="block text-[14.5px] font-semibold leading-tight text-ink sm:text-[18px]">{f.name}</span>
                                <span className="block text-[11.5px] text-ink-muted sm:text-[13px]">On set since 2015</span>
                            </figcaption>
                        </figure>
                    </li>
                ))}
            </ul>

            <Thread bracket />
            <Tier n="02">Managing Director</Tier>
            <div data-rise="fade" className={`mx-auto mt-4 grid max-w-3xl grid-cols-[0.85fr_1fr] gap-2 p-2 ${CARD_DEEP}`}>
                <div className="relative aspect-[9/14] overflow-hidden rounded-[22px] bg-ground-deep">
                    <Image src={md.image} alt={`${md.name}, ${md.role}`} fill placeholder="blur"
                        sizes="(max-width: 768px) 45vw, 340px" className="object-cover object-top" />
                </div>
                <div className="flex flex-col justify-end p-3 sm:p-7">
                    <span className="w-fit rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ground-deep">
                        {md.role}
                    </span>
                    <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em] sm:text-[44px]">{md.name}</p>
                    <p className="mt-3 text-[13.5px] leading-snug text-ink-onDeep/70 sm:text-[16px]">{md.line}</p>
                </div>
            </div>

            <Thread />
            <Tier n="03">The crew</Tier>
            <ul className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 scrollbar-none
                           sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 lg:gap-4">
                {CREW.map((c, k) => (
                    <li key={c.name} data-rise="" style={{ '--d': k % 3 }} className="w-[44vw] shrink-0 snap-start sm:w-auto">
                        <figure className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-ground-deep">
                            <Image src={c.image} alt={`${c.name}, ${c.role}`} fill placeholder="blur"
                                sizes="(max-width: 640px) 44vw, (max-width: 1024px) 33vw, 220px" className="object-cover object-[50%_20%]" />
                            <figcaption className="absolute inset-x-1.5 bottom-1.5 rounded-2xl bg-white/80 px-2.5 py-2 backdrop-blur-md">
                                <span className="block truncate text-[13px] font-semibold leading-tight text-ink">{c.name}</span>
                                <span className="block truncate text-[11.5px] text-ink-muted">{c.role}</span>
                            </figcaption>
                        </figure>
                    </li>
                ))}
            </ul>
        </div>
    );
}
