'use client';

import { FiFilm, FiAward, FiHeart, FiClock } from 'react-icons/fi';
import Chapter, { CARD, CARD_DEEP } from '@/Component/home/Chapter.jsx';

/**
 * The studio's track record: the CMS `stats` block (Admin › Content › Home).
 *
 * This was `TrackRecord`, hardcoded inside "Our packages", while the CMS block
 * drew the same four figures again, off-design, at the foot of the page. The
 * figures render once now, from the block, in this design (plan phase 7).
 *
 * `items`: { title: '1000+', subtitle: 'Weddings Captured', body?: 'Magical moments preserved' }.
 * Values show as written (a figure like 1000 is formatted 1,000).
 */
const DEFAULT_ITEMS = [
    { title: 'Wedding films', subtitle: 'Stories in motion', body: 'Cinematic memories of your celebration' },
    { title: 'Photography', subtitle: 'Moments preserved', body: 'Details, portraits, and candid emotion' },
    { title: 'Your people', subtitle: 'At the heart of the story', body: 'Family and friends, together' },
    { title: 'Your traditions', subtitle: 'Thoughtfully captured', body: 'The ceremonies that matter to you' },
];
const DEFAULT_TITLE = 'Wedding stories, thoughtfully captured';
const DEFAULT_LEAD = 'Photography and films shaped around your people, your traditions, and your celebration.';

function parseFigure(value = '') {
    const m = String(value).trim().match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return null;
    const number = Number(m[2].replace(/,/g, ''));
    return Number.isFinite(number) ? { prefix: m[1], number, suffix: m[3] } : null;
}

const ICONS = [FiFilm, FiAward, FiHeart, FiClock];
const HATCH = 'repeating-linear-gradient(-45deg, rgb(var(--gold-rgb) / 0.55) 0 2px, transparent 2px 7px)';
const show = (stat) => {
    const f = parseFigure(stat.title);
    return f ? `${f.prefix}${f.number.toLocaleString('en-IN')}${f.suffix}` : stat.title;
};

/**
 * The numbers — a bento: the lead figure on a wine-black card with a hatched
 * bar, the rest on light cards with an icon tile. Figures show as written in
 * the CMS (Admin › Content › Home › stats).
 */
export default function StatsBand({ title, subtitle, items }) {
    const stats = (items?.length ? items : DEFAULT_ITEMS).filter((it) => it?.title || it?.subtitle);
    if (!stats.length) return null;
    const heading = title || DEFAULT_TITLE;
    const lead = title ? subtitle : DEFAULT_LEAD;
    const [first, ...rest] = stats;

    return (
        <Chapter label="By the numbers" glow="right" title={heading} lead={lead}>
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 lg:grid-cols-4 lg:gap-4">
                <div data-rise="" className={`col-span-2 flex flex-col p-6 sm:p-7 lg:row-span-2 lg:justify-center ${CARD_DEEP}`}>
                    <dt className="order-2 mt-3 text-[16px] font-semibold">{first.subtitle}</dt>
                    <dd className="order-1 text-[56px] font-light leading-none tracking-[-0.04em] text-gold tabular-nums sm:text-[72px]">{show(first)}</dd>
                    {first.body && <dd className="order-3 mt-1 text-[14px] text-ink-onDeep/65">{first.body}</dd>}
                    <dd aria-hidden="true" className="order-4 mt-6 flex h-9 gap-1.5">
                        <span data-rise="draw" style={{ '--d': 2 }} className="w-[62%] rounded-full bg-gold" />
                        <span className="flex-1 rounded-full ring-1 ring-gold/30" style={{ background: HATCH }} />
                    </dd>
                </div>
                {rest.map((stat, k) => {
                    const Icon = ICONS[(k + 1) % ICONS.length];
                    return (
                        <div key={stat._id || k} data-rise="" style={{ '--d': (k + 1) % 2 }}
                            className={`flex flex-col p-5 sm:p-6 ${CARD} ${rest.length % 2 === 1 && k === rest.length - 1 ? 'col-span-2' : ''}`}>
                            <dt className="order-3 mt-1 text-[14.5px] font-semibold leading-snug text-ink">{stat.subtitle}</dt>
                            <dd aria-hidden="true" className="order-1 grid h-11 w-11 place-items-center rounded-2xl bg-accent-wash text-accent-ink"><Icon className="h-5 w-5" /></dd>
                            <dd className="order-2 mt-6 text-[40px] font-light leading-none tracking-[-0.03em] text-ink tabular-nums sm:text-[48px]">{show(stat)}</dd>
                            {stat.body && <dd className="order-4 text-[13px] text-ink-muted">{stat.body}</dd>}
                        </div>
                    );
                })}
            </dl>
        </Chapter>
    );
}
