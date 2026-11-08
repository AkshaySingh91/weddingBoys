import Image from 'next/image';
import Button from '@/Component/ui/Button.jsx';
import { PHOTOS } from './storyData.js';

/**
 * 01 · Cold open. One real wedding still, letterboxed like a film frame on
 * desktop, full-screen on mobile with the action in thumb reach.
 * `id="cold-open"` is what StickyActions watches to know the hero has passed.
 */
export default function ColdOpen() {
    return (
        <section
            id="cold-open"
            aria-labelledby="story-title"
            className="relative isolate flex h-[calc(100svh_-_var(--header-height))] min-h-[560px] items-end overflow-hidden bg-ground-deep lg:max-h-[860px]"
        >
            <Image
                src={PHOTOS.amitKomal.src}
                alt={PHOTOS.amitKomal.alt}
                fill
                preload
                sizes="100vw"
                className="-z-10 object-cover object-[58%_50%]"
            />
            <div aria-hidden="true" className="scrim-hero absolute inset-0 -z-10" />

            {/* Letterbox bars: the page opens as a film frame. */}
            <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-[6%] bg-black lg:block" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-[6%] bg-black lg:block" />

            <div className="relative mx-auto w-full max-w-content px-5 pb-10 md:px-8 lg:px-6 lg:pb-[9%]">
                <p className="t-label !text-gold">Our story</p>
                <h1 id="story-title" className="t-display-hero mt-4 !text-ink-onDeep">
                    Two friends. One camera. Since 2015.
                </h1>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button href="/films" size="lg" className="w-full sm:w-auto">
                        Watch our films <span aria-hidden="true">→</span>
                    </Button>
                </div>
            </div>

            <p aria-hidden="true" className="absolute bottom-[8%] right-6 hidden font-mono text-[11px] tracking-[0.2em] text-ink-onDeep/70 lg:block">
                REEL 1 · 00:00:04:12
            </p>
        </section>
    );
}
