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
 * The countdown's behaviour is deliberately unchanged — it is a decided
 * product choice, recorded in REDESIGN-PROGRESS.md. What changed is that it no
 * longer re-renders the whole card, image included, once a second: it is its
 * own component now, so the tick is scoped to the digits.
 */
import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { FiClock, FiArrowRight } from 'react-icons/fi';
import varanasiCity from '@/Asset/Home/v1.png';
import Section from '@/Component/ui/Section.jsx';
import Button from '@/Component/ui/Button.jsx';

/** Where the countdown starts. Unchanged. */
const START = { days: 10, hours: 14, minutes: 59, seconds: 59 };

const UNIT_LABEL = { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' };

/**
 * Isolated so the interval re-renders four digits rather than the whole card.
 * Previously the `next/image` hero and every node beside it reconciled once a
 * second for as long as the page stayed open.
 */
const LaunchCountdown = memo(function LaunchCountdown() {
    const [timeLeft, setTimeLeft] = useState(START);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                let { days, hours, minutes, seconds } = prev;
                if (seconds > 0) seconds--;
                else {
                    seconds = 59;
                    if (minutes > 0) minutes--;
                    else {
                        minutes = 59;
                        if (hours > 0) hours--;
                        else {
                            hours = 23;
                            if (days > 0) days--;
                        }
                    }
                }
                return { days, hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-fit rounded-media border border-gold/40 bg-ground-raised p-5 shadow-panel">
            <p className="t-label flex items-center gap-2 text-ink">
                <FiClock aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                Launch offer: 20% off ends in
            </p>

            <div className="mt-3 flex items-center gap-3 text-center md:gap-4">
                {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="flex flex-col">
                        <div
                            className="grid h-14 w-14 place-items-center rounded-panel border border-accent/20
                                       bg-accent-wash font-display text-[26px] font-semibold text-accent-ink
                                       md:h-16 md:w-16 md:text-[30px]"
                        >
                            {value.toString().padStart(2, '0')}
                        </div>
                        <span className="t-caption mt-2">{UNIT_LABEL[unit]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

function VaranasiLaunchCard() {
    return (
        <Section width="wide" rhythm="tight">
            <div className="relative overflow-hidden rounded-media border border-gold/35 bg-accent-wash shadow-panel">
                {/* The illustration, untouched. */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={varanasiCity}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(max-width: 768px) 100vw, 1180px"
                        className="object-cover object-center opacity-90"
                    />
                    {/* The desktop scrim was commented out, so the headline sat
                        on bare artwork and was legible only because this
                        particular illustration happens to be pale on the left.
                        A scrim makes that a guarantee rather than a coincidence.

                        It is placed, not blanket. The text column ends at 56%
                        of the card, so the wash is solid to 35% and gone by 70%
                        — a 14% buffer past the last glyph and nothing beyond
                        it. Earlier attempts at 90% via and at to-80% both left
                        the ghats a ghost; the artwork is the best asset on this
                        page and the scrim has no business hiding it. Those
                        percentages must stay on
                        Tailwind's 5-step scale — from-42%/to-78% compiled to
                        nothing and silently produced a full-width wash. A first
                        attempt used
                        via-accent-wash/90 with the falloff at the very edge and
                        washed the ghats out to a ghost — the artwork is the best
                        asset on this page and the scrim has no business hiding
                        it. */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 z-10 bg-accent-wash/90 md:bg-transparent
                                   md:bg-gradient-to-r md:from-accent-wash md:from-35%
                                   md:to-transparent md:to-70%"
                    />
                </div>

                <div className="relative z-20 flex w-full flex-col items-start p-6 sm:p-8 md:min-h-[450px] md:w-[62%] md:justify-center md:p-14">
                    {/* Badge kept, faults fixed: sentence case, accent token,
                        and the pulse is motion-safe so it stops for anyone who
                        has asked for reduced motion. */}
                    <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-pill border border-accent/25
                                  bg-ground-raised px-4 py-1.5 shadow-panel">
                        <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full rounded-pill bg-accent opacity-75
                                             motion-safe:animate-ping" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-pill bg-accent" />
                        </span>
                        <span className="text-[12px] font-semibold text-accent-ink">New branch alert</span>
                    </p>

                    {/* Display face, and Varanasi in red — but --accent-ink
                        (5.99:1), not the fill red, which measured 3.43:1 as
                        text here and did not pass. */}
                    <h2 className="t-display-2">
                        Mumbai&apos;s Premier Storytellers{' '}
                        <br className="hidden md:block" />
                        are now in <span className="text-accent-ink">Varanasi</span>
                    </h2>
                    <div className="rule-ornament mt-3 w-36" aria-hidden="true" />

                    <p className="t-body-lead mt-4 max-w-prose">
                        Experience our signature cinematic wedding filmmaking in the Sacred City.
                        We are taking limited bookings for the upcoming wedding season.
                    </p>

                    <div className="mt-8">
                        <LaunchCountdown />
                    </div>

                    {/* Was a <button onClick={router.push('/varanasi')}> — a
                        destination is a link, so it can be opened in a new tab,
                        middle-clicked, and read as navigation. */}
                    <Button href="/varanasi" variant="primary" size="lg" className="mt-8 rounded-pill">
                        Explore Varanasi packages
                        <FiArrowRight aria-hidden="true" className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </Section>
    );
}

export default memo(VaranasiLaunchCard);
