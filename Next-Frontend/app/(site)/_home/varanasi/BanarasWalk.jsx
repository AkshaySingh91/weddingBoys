'use client';

/**
 * Phones: "Banaras bula raha hai" — walk down the ghats to the Ganga.
 *
 * A full-screen stage stays pinned (CSS sticky) while you scroll past three
 * stops: the sunrise boat, the ghats and old lanes, the Ganga Aarti. Morning
 * turns to night as you go down. Each stop: one Hinglish line that feels like
 * Banaras, one plain English sentence. Down the right edge, three diyas are the
 * ghat steps — each lights as you reach it; at the Aarti everything glows.
 * The one invitation button lives in the closing panel right below.
 *
 * Scroll position → stop: one IntersectionObserver on three invisible markers
 * (no scroll listeners). Images crossfade (opacity), text re-enters behind a
 * mask; diyas animate only while the stage is on screen. Reduced motion: the
 * same stops, without the travel. All three stops are in the server HTML.
 */
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { STOPS, Diyas } from './shared.jsx';

const STEP_SVH = 80;

function StepDiya({ lit, label }) {
    return (
        <span className="flex flex-col items-center gap-1" aria-hidden="true">
            <span className={`block h-[11px] w-[7px] rounded-[50%_50%_45%_45%] bg-[#FFD27A] transition-[opacity,transform] duration-500 ease-entrance
                              ${lit ? 'diya-flame scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
            <span className={`block h-[5px] w-[18px] rounded-b-full transition-colors duration-500 ${lit ? 'bg-[#B5652B]' : 'bg-white/25'}`} />
            <span className="sr-only">{label}</span>
        </span>
    );
}

export default function BanarasWalk() {
    const [step, setStep] = useState(0);
    const markers = useRef([]);
    const { ref, inView } = useInView();

    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) if (e.isIntersecting) setStep(Number(e.target.dataset.step));
        }, { rootMargin: '-50% 0px -50% 0px' });
        markers.current.forEach((el) => el && io.observe(el));
        return () => io.disconnect();
    }, []);

    const s = STOPS[step];
    const last = step === STOPS.length - 1;

    return (
        <div ref={ref} className="relative bg-[#140A0C] text-ink-onDeep" style={{ height: `calc(100svh + ${(STOPS.length - 1) * STEP_SVH}svh)` }}>
            {/* scroll markers: which stop the middle of the screen is on */}
            {STOPS.map((x, i) => (
                <span key={x.key} ref={(el) => { markers.current[i] = el; }} data-step={i} aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0" style={{ top: `${i * STEP_SVH}svh`, height: `${STEP_SVH}svh` }} />
            ))}

            <div data-live={inView ? '' : undefined} data-swell={last ? '' : undefined}
                className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden">
                {/* photographs: morning → night */}
                {STOPS.map((x, i) => (
                    <div key={x.key} aria-hidden={i === step ? undefined : true}
                        className={`absolute inset-0 transition-opacity duration-[900ms] ease-entrance motion-reduce:duration-0 ${i === step ? 'opacity-100' : 'opacity-0'}`}>
                        <Image src={x.tall} alt={i === step ? x.title : ''} fill placeholder="blur" sizes="100vw"
                            loading={i === 0 ? 'eager' : 'lazy'}
                            className={`object-cover ${i === step ? 'motion-safe:animate-[heroZoom_9s_ease-out_both]' : ''}`}
                            style={{ objectPosition: x.posTall }} />
                    </div>
                ))}
                {/* the light of each stop, and legibility */}
                {STOPS.map((x, i) => (
                    <span key={x.key} aria-hidden="true" className={`pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-[1200ms] ${i === step ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: x.sky }} />
                ))}
                <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ${last ? 'opacity-100' : 'opacity-0'}`}><span className="aarti-glow absolute inset-0" /></span>
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[#140A0C]/90 via-[#140A0C]/40 to-transparent" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#140A0C] via-[#140A0C]/80 to-transparent" />
                <Diyas strength={s.diyas} className="h-[18%]" />

                {/* the invitation, always at the top */}
                <div className="absolute inset-x-0 top-[calc(var(--header-height)+1rem)] px-5">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 text-[12px] font-semibold ring-1 ring-white/15 backdrop-blur-md">
                        <span aria-hidden="true" className="chapter-no__n grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[10.5px] tabular-nums text-ground-deep" />
                        Pre-wedding shoot in Banaras
                    </p>
                    <h2 id="banaras-title-m" className={`mt-3 whitespace-nowrap font-display text-[clamp(28px,8.6vw,40px)] font-medium italic leading-[1] tracking-tight text-gold transition-opacity duration-700
                                                        ${step === 0 ? 'opacity-100' : 'opacity-0'}`}>
                        Banaras bula raha hai.
                    </h2>
                    <p className={`mt-2 max-w-[19rem] text-[14.5px] leading-snug text-ink-onDeep/85 transition-opacity duration-700 ${step === 0 ? 'opacity-100' : 'opacity-0'}`}>
                        Do your pre-wedding shoot on the holy ghats of the Ganga. Scroll down the ghats with us.
                    </p>
                </div>

                {/* the ghat steps: three diyas, lit as you reach them */}
                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-5" aria-label={`Stop ${step + 1} of ${STOPS.length}`}>
                    <span aria-hidden="true" className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-gold/0 via-gold/50 to-gold/0" />
                    {STOPS.map((x, i) => <span key={x.key} className="relative"><StepDiya lit={i <= step} label={x.label} /></span>)}
                </div>

                {/* the stop */}
                <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    {STOPS.map((x, i) => (
                        <div key={x.key} hidden={i !== step} className="pr-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{i + 1} · {x.label}</p>
                            <p className="mt-2 overflow-clip">
                                <span data-step-line className="block font-display text-[34px] font-medium italic leading-[1.05] text-ink-onDeep motion-safe:animate-[wv-line_620ms_var(--ease-entrance)_backwards]">
                                    {x.hi}
                                </span>
                            </p>
                            <h3 className="mt-3 text-[17px] font-semibold leading-snug text-ink-onDeep">{x.title}</h3>
                            <p className="mt-1 text-[15px] leading-relaxed text-ink-onDeep/80">{x.line}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
