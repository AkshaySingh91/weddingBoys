import { FOUNDERS, PROMISES } from './storyData.js';

/**
 * 06 · Our Vachan. A vachan is a promise: four plain commitments, numbered,
 * signed by both founders. It answers the question an Indian family actually
 * asks before booking — "what happens if something goes wrong?"
 */
export default function OurVachan() {
    return (
        <section aria-labelledby="vachan-title" className="bg-ground-sunk py-section">
            <div className="mx-auto w-full max-w-content px-5 md:px-8 lg:px-6">
                <div className="mx-auto max-w-[880px] border border-gold/60 bg-ground-raised p-6 md:p-10 lg:p-14">
                    <p className="t-label !text-accent-ink">Our vachan</p>
                    <h2 id="vachan-title" className="t-display-1 mt-3">A vachan is a promise. We put ours in writing.</h2>
                    <div aria-hidden="true" className="mt-6 h-px w-24 bg-gold" />

                    <ol className="mt-8 grid gap-6 md:grid-cols-2 md:gap-x-10 md:gap-y-8">
                        {PROMISES.map((p, i) => (
                            <li key={p.title} className="flex gap-4">
                                <span className="w-10 shrink-0 font-display text-[28px] leading-none text-gold-strong">{String(i + 1).padStart(2, '0')}</span>
                                <div>
                                    <p className="text-[17px] font-semibold leading-snug text-ink">{p.title}</p>
                                    <p className="t-body-sm mt-1">{p.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className="mt-10 grid grid-cols-2 gap-6 md:max-w-[520px]">
                        {FOUNDERS.map((f) => (
                            <div key={f.name}>
                                <p className="border-b border-ink/30 pb-1 font-display text-[22px] italic text-ink md:text-[26px]">{f.name}</p>
                                <p className="t-label mt-2">Founder</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
