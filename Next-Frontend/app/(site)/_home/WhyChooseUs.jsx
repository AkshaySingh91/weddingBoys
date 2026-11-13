/**
 * Why us — six reasons as a bento of feature cards (icon tile, title, one
 * line), closed by a wine-black quote card. Two columns on a phone, three from
 * lg. Replaces six full-width stacked cards (~2,000px), a typewriter quote that
 * retyped itself every few seconds, and floating hearts.
 */
import { FiCalendar, FiAperture, FiGlobe, FiSliders, FiFilm, FiHeart } from 'react-icons/fi';
import Chapter, { Em, CARD, CARD_DEEP } from '@/Component/home/Chapter.jsx';

const REASONS = [
    { Icon: FiCalendar, title: 'Planned around your day', body: 'Venue, light and rituals mapped in advance.' },
    { Icon: FiAperture, title: 'Artistic storytelling', body: 'Candid, editorial and fine-art, combined.' },
    { Icon: FiGlobe, title: 'At home anywhere', body: 'Palaces, ghats, beaches and rooftops.' },
    { Icon: FiSliders, title: 'Packages that bend', body: 'Shaped to your events and budget.' },
    { Icon: FiFilm, title: 'Cinematic, not a recap', body: 'The emotional arc of the day, on film.' },
    { Icon: FiHeart, title: 'Real emotion', body: 'An eye for the unplanned moments.' },
];

export default function WhyChooseUs() {
    return (
        <Chapter id="whyToChooseUs" label="Why us" glow="right"
            title={<>Why couples <Em>choose</Em> us</>}
            lead="Six promises we keep at every wedding.">
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 lg:grid-cols-3 lg:gap-4">
                {REASONS.map(({ Icon, title, body }, k) => (
                    <li key={title} data-rise="" style={{ '--d': k % 2 }} className={`flex flex-col p-4 sm:p-6 ${CARD}`}>
                        <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-wash text-accent-ink sm:h-12 sm:w-12">
                            <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="mt-6 text-[15.5px] font-semibold leading-snug text-ink sm:mt-10 sm:text-[18px]">{title}</h3>
                        <p className="mt-1 text-[13.5px] leading-snug text-ink-muted sm:text-[15px]">{body}</p>
                    </li>
                ))}
                <li data-rise="" className={`col-span-2 flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-3 lg:flex-row lg:items-end ${CARD_DEEP}`}>
                    <p className="max-w-3xl font-display text-[24px] font-medium italic leading-snug sm:text-[32px]">
                        “We make the film you will still be watching in twenty years.”
                    </p>
                    <p className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.14em] text-gold">The Wedding Vachan</p>
                </li>
            </ul>
        </Chapter>
    );
}
