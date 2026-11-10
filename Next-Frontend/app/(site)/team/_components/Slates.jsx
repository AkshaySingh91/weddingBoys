/**
 * Leadership as film slates. Each leader is a slate card: a striped clapper
 * bar hinged at the left sits slightly open above the portrait and claps shut
 * when the card enters view (and on hover / focus). The label reads like a
 * slate: SCENE 01 · FOUNDER.
 *
 * Server component: the clap is CSS (globals.css › /team › .slate), driven by
 * the page's RevealObserver (`data-in`) and :hover/:focus-within.
 */
import { PortraitImage } from '@/Component/team/Portrait.jsx';
import ClapObserver from './ClapObserver.jsx';
import { ChapterHead, CARD, CARD_DEEP } from '@/Component/home/Chapter.jsx';

const pad = (n) => String(n).padStart(2, '0');

function Clapper({ deep }) {
    return (
        <div aria-hidden="true" className="relative h-7">
            {/* the hinge claps on entry; the bar inside re-claps on hover / focus */}
            <span className="slate-arm absolute inset-x-0 top-0 h-[22px]">
                <span className={`slate-bar absolute inset-0 rounded-[6px] ${deep ? 'slate-stripes-deep' : 'slate-stripes'}`} />
            </span>
            {/* the seam where the arm meets the board: a gold flash on the clap */}
            <span className="slate-seam absolute inset-x-1 bottom-[3px] h-[2px] rounded-full bg-gold" />
            {/* the hinge pin */}
            <span className={`absolute bottom-0.5 left-1.5 h-2 w-2 rounded-full ${deep ? 'bg-gold' : 'bg-ink'}`} />
        </div>
    );
}

function SlateLabel({ scene, role, deep }) {
    return (
        <p className={`flex items-center justify-between gap-3 px-1 pb-2 pt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] tabular-nums
                       ${deep ? 'text-ink-onDeep/60' : 'text-ink-muted'}`}>
            <span>Scene {pad(scene)}</span>
            <span className={deep ? 'text-gold' : 'text-accent-ink'}>{role}</span>
        </p>
    );
}

export default function Slates({ founders, md }) {
    if (!founders.length && !md) return null;
    return (
        <section id="leadership" className="relative isolate">
            <ClapObserver />
            <div className="mx-auto w-full max-w-wide px-5 pb-10 pt-12 sm:pb-14 sm:pt-16 md:px-8 lg:px-10 lg:pt-20">
                <ChapterHead label="Leadership" title={<>Above the <em className="font-display font-medium italic tracking-normal text-accent-ink">line</em></>}
                    lead="On a film set, the people who shape the whole production are “above the line”. Here that is the two founders, who still shoot, and the managing director who runs the studio." />

                <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
                    {founders.map((p, k) => (
                        <article key={p.id} data-clap="" tabIndex={0} aria-label={`${p.name}, ${p.role}`}
                            className={`slate group relative p-2 outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-2.5 lg:col-span-4 ${CARD}`}>
                            <Clapper />
                            <SlateLabel scene={k + 1} role={p.role} />
                            <div className="slate-shot relative aspect-[3/4] overflow-hidden rounded-[20px] bg-ground-deep sm:rounded-[22px] lg:aspect-[4/5]">
                                <div className="wv-settle absolute inset-0">
                                    <PortraitImage person={p} sizes="(max-width: 1024px) 46vw, 400px" className="object-[50%_26%]" />
                                </div>
                            </div>
                            <div className="px-1 pb-1 pt-3">
                                <h3 className="truncate text-[17px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[22px]">{p.name}</h3>
                                <p className="mt-0.5 text-[12.5px] text-ink-muted sm:text-[14px]">Co-founder · behind the camera</p>
                            </div>
                        </article>
                    ))}

                    {md && (
                        <article data-clap="" tabIndex={0} aria-label={`${md.name}, ${md.role}`}
                            className={`slate group relative col-span-2 p-2 outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-2.5 lg:col-span-4 ${CARD_DEEP}`}>
                            <Clapper deep />
                            <SlateLabel scene={founders.length + 1} role={md.role} deep />
                            <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 lg:grid-cols-1 lg:gap-0">
                                <div className="slate-shot relative aspect-[3/4] overflow-hidden rounded-[20px] bg-black/30 lg:aspect-[4/5] lg:rounded-[22px]">
                                    <div className="wv-settle absolute inset-0">
                                        <PortraitImage person={md} sizes="(max-width: 1024px) 45vw, 400px" className="object-[50%_18%]" />
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end pb-2 pr-2 lg:px-1 lg:pb-1 lg:pt-3">
                                    <h3 className="text-[24px] font-semibold leading-none tracking-[-0.02em] sm:text-[30px] lg:text-[22px]">{md.name}</h3>
                                    {md.line && <p className="mt-2.5 text-[13.5px] leading-snug text-ink-onDeep/70 sm:text-[15px] lg:text-[14px]">{md.line}</p>}
                                </div>
                            </div>
                        </article>
                    )}
                </div>
            </div>
        </section>
    );
}
