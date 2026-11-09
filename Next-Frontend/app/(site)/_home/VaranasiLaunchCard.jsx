'use client';

/**
 * Varanasi launch card.
 *
 * The illustration is the best asset on the home page and is untouched.
 *
 * Colour: red is the primary brand colour here — gold and cream are ornament
 * and ground, not substitutes for it. The failing `#eb4b55` (white on it
 * measured 3.70:1, and as text on the card 3.43:1) is replaced by the red
 * tokens that pass: `--accent` for fills, `--accent-ink` for red *as text*.
 * Same colour family, same intent, legible.
 *
 * Offers use an explicit deadline; an unconfigured offer shows availability instead.
 */
import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiClock, FiArrowUpRight, FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';
import varanasiCity from '@/Asset/Home/v1.png';
import Chapter, { Em, GlassChip, CARD } from '@/Component/home/Chapter.jsx';

const DEADLINE = Date.parse(process.env.NEXT_PUBLIC_VARANASI_OFFER_ENDS_AT || '');
const OFFER_LABEL = process.env.NEXT_PUBLIC_VARANASI_OFFER_LABEL || 'Varanasi booking offer';

const UNIT_LABEL = { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' };

/**
 * Isolated so the interval re-renders four digits rather than the whole card.
 * Previously the `next/image` hero and every node beside it reconciled once a
 * second for as long as the page stayed open.
 */
const LaunchCountdown = memo(function LaunchCountdown() {
    const [timeLeft, setTimeLeft] = useState(null);
    useEffect(() => {
        if (!Number.isFinite(DEADLINE)) return;
        const timer = setInterval(() => {
            const seconds = Math.max(0, Math.floor((DEADLINE - Date.now()) / 1000));
            setTimeLeft(seconds === 0 ? false : {
                days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24,
                minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60,
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    if (!Number.isFinite(DEADLINE) || timeLeft === false) {
        return null;
    }

    return (
        <div className="w-full">
            <p className="flex items-center gap-2 text-[12.5px] font-medium text-ink-secondary">
                <FiClock aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                {OFFER_LABEL} ends {new Date(DEADLINE).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {Object.entries(timeLeft || {}).map(([unit, value]) => (
                    <div key={unit} className="rounded-2xl bg-ground py-3 ring-1 ring-ink/[0.06]">
                        <p className="text-[24px] font-light leading-none tabular-nums text-ink">{value.toString().padStart(2, '0')}</p>
                        <p className="mt-1 text-[11px] text-ink-muted">{UNIT_LABEL[unit]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

const FACTS = [
    { Icon: FiMapPin, k: 'City', v: 'Varanasi' },
    { Icon: FiCalendar, k: 'Dates', v: 'Limited' },
    { Icon: FiUsers, k: 'Crew', v: 'Same team' },
];

function VaranasiLaunchCard() {
    return (
        <Chapter label="New city" glow="right"
            title={<>Now filming in <Em>Varanasi</Em></>}
            lead="Our cinematic weddings, on the ghats of the sacred city.">
            <div data-rise="" className={`mt-8 grid overflow-hidden p-2 sm:mt-12 md:grid-cols-[1.1fr_1fr] md:gap-2 ${CARD}`}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-accent-wash md:aspect-auto md:min-h-[420px]">
                    <Image src={varanasiCity} alt="Illustration of the Varanasi ghats" fill placeholder="blur"
                        sizes="(max-width: 768px) 100vw, 640px" className="object-cover object-center" />
                    <span className="absolute left-3 top-3">
                        <GlassChip>
                            <span aria-hidden="true" className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                            </span>
                            Booking this season
                        </GlassChip>
                    </span>
                </div>
                <div className="flex flex-col p-4 sm:p-6 md:p-8">
                    <ul className="grid grid-cols-3 gap-2">
                        {FACTS.map(({ Icon, k, v }) => (
                            <li key={k} className="rounded-2xl bg-accent-wash px-3 py-3">
                                <Icon aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                                <p className="mt-2 text-[11.5px] font-medium text-ink-muted">{k}</p>
                                <p className="text-[14px] font-semibold leading-tight text-ink">{v}</p>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-5 text-[15.5px] leading-relaxed text-ink-secondary">
                        The same team and crew, now taking a limited number of weddings in Varanasi.
                        Tell us your date and we&apos;ll confirm availability within a day.
                    </p>
                    <div className="mt-5"><LaunchCountdown /></div>
                    <Link href="/varanasi"
                        className="group mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-full bg-accent pl-5 pr-1.5 text-[14.5px]
                                   font-semibold text-ink-onAccent transition-colors duration-micro ease-standard hover:bg-accent-hover focus-ring md:mt-auto md:w-fit">
                        Explore Varanasi packages
                        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><FiArrowUpRight className="h-4 w-4" /></span>
                    </Link>
                </div>
            </div>
        </Chapter>
    );
}

export default memo(VaranasiLaunchCard);
