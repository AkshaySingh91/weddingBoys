import Image from 'next/image';
import { FOUNDERS } from './storyData.js';

/**
 * 04 · The founders, each on a film slate: a real photograph on set, then the
 * three facts a family wants — who, what they do, how long they have done it.
 */
export default function Founders() {
    return (
        <section aria-labelledby="founders-title" className="bg-ground py-section">
            <div className="mx-auto w-full max-w-content px-5 md:px-8 lg:px-6">
                <p className="t-label !text-accent-ink">The founders</p>
                <h2 id="founders-title" className="t-display-1 mt-3">The two people behind every film.</h2>

                <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:mt-14 lg:gap-8">
                    {FOUNDERS.map((f) => (
                        <li key={f.name} className="overflow-hidden rounded-media bg-ground-raised shadow-panel">
                            <div className="relative aspect-[4/5] md:aspect-[5/6]">
                                <Image
                                    src={f.image}
                                    alt={f.alt}
                                    fill
                                    placeholder="blur"
                                    unoptimized
                                    sizes="(min-width: 970px) 560px, (min-width: 720px) 50vw, 100vw"
                                    className="object-cover"
                                />
                            </div>
                            {/* Clapper stripe */}
                            <div
                                aria-hidden="true"
                                className="h-4"
                                style={{ background: 'repeating-linear-gradient(-45deg, var(--ground-deep) 0 14px, var(--ground) 14px 28px)' }}
                            />
                            <dl className="divide-y divide-edge-subtle px-5 lg:px-6">
                                <SlateRow label="Founder"><span className="font-display text-[24px] text-ink">{f.name}</span></SlateRow>
                                <SlateRow label="Department">{f.department}</SlateRow>
                                <SlateRow label="On set since">{f.since}</SlateRow>
                            </dl>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

function SlateRow({ label, children }) {
    return (
        <div className="grid grid-cols-[120px_1fr] items-center gap-4 py-3 lg:grid-cols-[150px_1fr]">
            <dt className="t-label">{label}</dt>
            <dd className="font-display text-[19px] text-ink">{children}</dd>
        </div>
    );
}
