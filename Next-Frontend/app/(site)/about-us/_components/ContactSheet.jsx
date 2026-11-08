import Image from 'next/image';
import Button from '@/Component/ui/Button.jsx';
import { CONTACT_SHEET } from './storyData.js';

/**
 * 05 · Contact sheet. Real frames from real weddings, numbered like a film
 * contact sheet, with the editor's red grease-pencil circle on the pick.
 * Desktop shows the whole sheet; mobile swipes through it.
 */
export default function ContactSheet() {
    return (
        <section aria-labelledby="sheet-title" className="bg-ground-deep py-section">
            <div className="mx-auto w-full max-w-content px-5 md:px-8 lg:px-6">
                <p className="t-label !text-gold">Contact sheet</p>
                <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <h2 id="sheet-title" className="t-display-1 !text-ink-onDeep">Real weddings. No stock photos.</h2>
                    <Button href="/photos" variant="onMedia" className="hidden !text-ink-onDeep md:inline-flex">
                        See full galleries <span aria-hidden="true">→</span>
                    </Button>
                </div>
            </div>

            <ul
                className="relative mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:px-8 lg:mx-auto lg:grid lg:max-w-content lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-6"
                aria-label="Frames from recent weddings"
            >
                {CONTACT_SHEET.map((frame) => (
                    <li key={frame.frame} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
                        <figure>
                            <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-ground-sunk/10 lg:aspect-[3/2]">
                                <Image src={frame.src} alt={frame.alt} fill sizes="(min-width: 970px) 380px, 78vw" className="object-cover" />
                                {frame.circled && (
                                    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-[6%] h-[88%] w-[88%]">
                                        <ellipse cx="50" cy="50" rx="46" ry="44" fill="none" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" transform="rotate(-4 50 50)" />
                                    </svg>
                                )}
                            </div>
                            <figcaption aria-hidden="true" className="mt-2 flex justify-between font-mono text-[11px] tracking-[0.15em] text-ink-onDeep/70">
                                <span>{frame.frame}</span>
                            </figcaption>
                        </figure>
                    </li>
                ))}
            </ul>

            <div className="mx-auto mt-6 max-w-content px-5 md:hidden">
                <Button href="/photos" variant="onMedia" className="w-full !text-ink-onDeep">
                    See full galleries <span aria-hidden="true">→</span>
                </Button>
            </div>
        </section>
    );
}
