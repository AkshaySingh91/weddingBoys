/**
 * Our story — a bento: the photograph with the founders on a glass bar, the
 * studio's timeline as connected step pills, and a wine-black card of the four
 * promises (checked, like a completed list).
 *
 * Facts only (PRODUCT.md › Confirmed): the founders have filmed together since
 * 2015, the studio opened in 2020, and they are on set. The wedding count lives
 * once on the page, in the stats chapter. Founder initials, not portraits: one
 * portrait is AI-generated and not yet cleared for wider use.
 */
import Image from 'next/image';
import { FiCheck, FiAperture, FiFeather, FiBookOpen, FiHeart } from 'react-icons/fi';
import img from '@/Asset/Home/homepage_short_story.jpg';
import Chapter, { Em, GlassChip, CARD, CARD_DEEP } from '@/Component/home/Chapter.jsx';

const MILESTONES = [
    { when: '2015', what: 'Aman & Suraj start filming together' },
    { when: '2020', what: 'The studio opens in Mumbai' },
    { when: 'Today', what: 'Mumbai, Varanasi & beyond' },
];

const PROMISES = [
    { Icon: FiAperture, text: 'Artistic excellence in every frame' },
    { Icon: FiFeather, text: 'A quiet camera that lets moments happen' },
    { Icon: FiBookOpen, text: 'A deep understanding of your traditions' },
    { Icon: FiHeart, text: 'Personal service for every couple' },
];

export default function OurStory() {
    return (
        <Chapter label="Our story" glow="left" action={{ href: '/about-us', label: 'Read our story' }}
            title={<>Founders behind the <Em>camera</Em></>}
            lead="Filming weddings together since 2015 — and still on set at yours.">
            <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-12 md:grid-cols-2 lg:gap-4">
                {/* Photograph + founders */}
                <figure className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-ground-sunk shadow-[0_22px_44px_-24px_rgba(51,22,26,0.6)] md:row-span-2 md:aspect-auto md:min-h-[520px]">
                    <Image src={img} alt="A wedding moment filmed by The Wedding Vachan" fill placeholder="blur"
                        sizes="(max-width: 768px) 100vw, 600px" className="object-cover object-top" />
                    <span className="absolute left-3 top-3"><GlassChip>Since 2015</GlassChip></span>
                    <figcaption className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-[22px] bg-white/80 p-3 pl-4 backdrop-blur-md">
                        <span className="flex -space-x-2" aria-hidden="true">
                            {['AS', 'SS'].map((i, k) => (
                                <span key={i} className={`grid h-10 w-10 place-items-center rounded-full text-[12px] font-semibold ring-2 ring-white
                                                          ${k ? 'bg-ink text-ground' : 'bg-accent text-ink-onAccent'}`}>{i}</span>
                            ))}
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[15px] font-semibold leading-tight text-ink">Aman Singh & Suraj Singh</span>
                            <span className="block text-[12.5px] text-ink-muted">Founders · personally on set</span>
                        </span>
                    </figcaption>
                </figure>

                {/* Timeline */}
                <div className={`p-5 sm:p-6 ${CARD}`}>
                    <p className="text-[13px] font-semibold text-ink-muted">Our journey</p>
                    <p className="mt-1 text-[16px] leading-snug text-ink">
                        We started with one idea: a wedding film should feel like cinema, not a recap.
                    </p>
                    <ol className="relative mt-6 grid grid-cols-3 gap-2">
                        <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-[22px] border-t-2 border-dashed border-ink/15" />
                        {MILESTONES.map((m, i) => (
                            <li key={m.when} className="relative flex flex-col items-center text-center">
                                <span className={`relative z-10 grid h-11 min-w-[64px] place-items-center rounded-full px-3 text-[14px] font-semibold
                                                  ${i === MILESTONES.length - 1 ? 'bg-ink text-ground' : 'bg-ground ring-1 ring-ink/[0.08] text-ink'}`}>
                                    {m.when}
                                </span>
                                <span className="mt-2.5 text-[12.5px] leading-snug text-ink-secondary">{m.what}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Promises */}
                <div className={`p-5 sm:p-6 ${CARD_DEEP}`}>
                    <div className="flex items-start justify-between">
                        <p className="text-[18px] font-semibold leading-tight">What we promise</p>
                        <p className="text-[34px] font-light leading-none tracking-[-0.03em] text-gold tabular-nums">
                            {PROMISES.length}/{PROMISES.length}
                        </p>
                    </div>
                    <ul className="mt-5 space-y-2.5">
                        {PROMISES.map(({ Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 rounded-2xl bg-ink-onDeep/[0.06] p-2 pr-3">
                                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-onDeep/10 text-ink-onDeep">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className="flex-1 text-[14px] leading-snug text-ink-onDeep">{text}</span>
                                <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-ground-deep">
                                    <FiCheck className="h-3.5 w-3.5" strokeWidth={3} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Chapter>
    );
}
