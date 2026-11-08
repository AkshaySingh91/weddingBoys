import Image from 'next/image';
import Button from '@/Component/ui/Button.jsx';
import { FOUNDERS } from './storyData.js';

/**
 * 07 · End credits. Every face in the crew, then the credits, then the last
 * line of the film: yours is next. `id="final-card"` lets StickyActions step
 * aside when the page's own actions are on screen.
 */
export default function EndCredits({ crew, whatsapp }) {
    const faces = [
        ...FOUNDERS.map((f) => ({ key: f.name, name: f.name, src: f.image })),
        ...crew.map((m) => ({ key: m.id, name: m.name, src: m.src })),
    ];

    return (
        <section aria-labelledby="credits-title" className="bg-ground-deep pb-section-loose pt-section">
            <div className="mx-auto w-full max-w-content px-5 md:px-8 lg:px-6">
                <h2 id="credits-title" className="t-label text-center !text-gold">The crew</h2>
            </div>

            <ul className="mt-8 flex snap-x gap-3 overflow-x-auto px-5 [scrollbar-width:none] md:justify-center md:px-8">
                {faces.map((f) => (
                    <li key={f.key} className="w-[132px] shrink-0 snap-start md:w-[150px]">
                        <div className="relative aspect-[4/5] overflow-hidden rounded-media bg-ink-secondary/30">
                            <Image src={f.src} alt={f.name} fill sizes="150px" unoptimized={typeof f.src !== "string"} className="object-cover" />
                        </div>
                    </li>
                ))}
            </ul>

            <dl className="mx-auto mt-12 grid max-w-[640px] gap-4 px-5 md:grid-cols-[1fr_1.4fr] md:gap-x-8">
                <Credit role="Founded by" name={FOUNDERS.map((f) => f.name).join('  &  ')} />
                {crew.map((m) => <Credit key={m.id} role={m.role} name={m.name} />)}
            </dl>

            <div aria-hidden="true" className="mx-auto mt-14 h-24 w-px bg-gold/60" />

            <div id="final-card" className="mx-auto mt-14 max-w-content px-5 text-center md:px-8">
                <p className="t-display-hero mx-auto !text-ink-onDeep">Your film is next.</p>
                <p className="t-body-lead mx-auto mt-4 !text-ink-onDeep/80">Tell us your date and city, and we will plan it with you.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button href="/contact" size="lg">Plan your wedding <span aria-hidden="true">→</span></Button>
                    {whatsapp && (
                        <Button href={whatsapp} variant="onMedia" size="lg" target="_blank" rel="noopener noreferrer" className="!text-ink-onDeep">
                            Chat on WhatsApp
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}

function Credit({ role, name }) {
    return (
        <>
            <dt className="t-label md:text-right !text-gold">{role}</dt>
            <dd className="-mt-3 font-display text-[22px] text-ink-onDeep md:mt-0 md:text-[24px]">{name}</dd>
        </>
    );
}
