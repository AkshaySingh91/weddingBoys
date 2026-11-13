'use client';

/**
 * Dharaa Events — the sister studio, as a profile card in the home kit
 * (Component/home/Chapter.jsx): logo tile, one line, its services as icon
 * chips, the photograph and one action. The amber palette, floating particles,
 * pulsing ticks and wave top it used to carry were a second palette on a
 * red-and-gold site and have gone.
 */
import { FiArrowUpRight, FiClipboard, FiFeather, FiMapPin, FiClock, FiPieChart } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import dharaaStoryImg from '@/Asset/Dharaa/Client2.webp';
import dharaaLogo from '@/Asset/Dharaa/Logo.png';
import Chapter, { Em, GlassChip, CARD } from '@/Component/home/Chapter.jsx';

// Service data to be displayed
const dharaaServices = [
    { label: 'Event planning', Icon: FiClipboard },
    { label: 'Décor & design', Icon: FiFeather },
    { label: 'Venues & vendors', Icon: FiMapPin },
    { label: 'Day-of coordination', Icon: FiClock },
    { label: 'Budget consulting', Icon: FiPieChart },
];

// `react-responsive` is not installed in this project; this is a minimal
// SSR-safe stand-in for `useMediaQuery({ maxWidth })` (defaults to `false`
// on the server/first paint, then syncs on the client after mount so it
// never causes a hydration mismatch).
export default function DharaaStory() {
    return (
        <Chapter label="Sister studio" glow="left"
            title={<>Plan it all with <Em>Dharaa</Em></>}
            lead="Planning, décor and coordination, from the people behind The Wedding Vachan.">
            <div data-rise="" className={`mt-8 grid gap-2 p-2 sm:mt-12 md:grid-cols-[1fr_1.1fr] ${CARD}`}>
                <div className="flex flex-col p-3 sm:p-5">
                    <div className="flex items-center gap-3">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ground ring-1 ring-ink/[0.06]">
                            <Image src={dharaaLogo} alt="" aria-hidden="true" sizes="40px" className="h-10 w-10 object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[17px] font-semibold leading-tight text-ink">Dharaa Events</span>
                            <span className="block text-[13.5px] text-ink-muted">Event management, Mumbai</span>
                        </span>
                    </div>
                    <p className="mt-5 text-[15.5px] leading-relaxed text-ink-secondary">
                        A new event-planning studio from The Wedding Vachan, with the same care for detail
                        in everything around the camera.
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Dharaa services">
                        {dharaaServices.map(({ label, Icon }) => (
                            <li key={label} className="inline-flex items-center gap-2 rounded-full bg-ground py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-ink ring-1 ring-ink/[0.06]">
                                <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-accent-wash text-accent-ink">
                                    <Icon className="h-3.5 w-3.5" />
                                </span>
                                {label}
                            </li>
                        ))}
                    </ul>
                    <Link href="/dharaa-event-management"
                        className="group mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-full bg-ink pl-5 pr-1.5 text-[14.5px]
                                   font-semibold text-ground transition-colors duration-micro ease-standard hover:bg-ink/90 focus-ring md:mt-auto md:w-fit">
                        Visit Dharaa Events
                        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-ground/15"><FiArrowUpRight className="h-4 w-4" /></span>
                    </Link>
                </div>
                <div className="relative order-first aspect-[4/3] overflow-hidden rounded-[22px] bg-ground-sunk md:order-none md:aspect-auto md:min-h-[400px]">
                    <Image src={dharaaStoryImg} alt="A couple at a reception planned by Dharaa Events" fill placeholder="blur"
                        sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
                    <span className="absolute left-3 top-3"><GlassChip>Guided by The Wedding Vachan</GlassChip></span>
                </div>
            </div>
        </Chapter>
    );
}
