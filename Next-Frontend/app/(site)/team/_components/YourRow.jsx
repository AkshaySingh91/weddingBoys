/**
 * The close: a call-sheet row left blank for the couple. Every crew member is
 * already on the sheet; the only missing line is theirs. Server component.
 */
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import { FiArrowUpRight } from 'react-icons/fi';
import { PortraitImage } from '@/Component/team/Portrait.jsx';
import { CARD_DEEP } from '@/Component/home/Chapter.jsx';

export default function YourRow({ people, crewCount, whatsapp }) {
    const faces = people.slice(0, 8);
    return (
        <section aria-labelledby="your-row-title" className="mx-auto w-full max-w-wide px-5 pb-16 pt-14 sm:pb-20 md:px-8 lg:px-10 lg:pb-24 lg:pt-20">
            <div data-rise="sheet" className={`relative overflow-hidden p-5 sm:p-8 lg:p-10 ${CARD_DEEP}`}>
                <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-[90px]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">That&rsquo;s a wrap</p>
                <h2 id="your-row-title" className="mt-3 max-w-2xl text-balance text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
                    One line on the sheet is still <em className="font-display font-medium italic tracking-normal text-gold">blank</em>.
                </h2>

                {/* the blank row */}
                <dl className="mt-7 grid grid-cols-1 overflow-hidden rounded-[18px] ring-1 ring-white/10 sm:grid-cols-3">
                    {[['Couple', 'You'], ['Date', 'Your day'], ['Crew', `${crewCount} on call`]].map(([k, v], i) => (
                        <div key={k} className={`flex items-baseline justify-between gap-4 bg-white/[0.04] px-4 py-3.5 sm:block ${i ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}>
                            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink-onDeep/55">{k}</dt>
                            <dd className="text-[17px] font-semibold sm:mt-1.5 sm:text-[20px]">
                                <span className={`relative inline-block pb-0.5 ${i < 2 ? 'wv-write' : ''}`} style={{ '--w': i }}>{v}</span>
                                <span aria-hidden="true" data-rise="draw" style={{ '--d': i }} className="block h-px w-full border-b border-dashed border-gold/60 sm:mt-0.5" />
                            </dd>
                        </div>
                    ))}
                </dl>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-5">
                    <ul className="flex -space-x-3" aria-label="The crew">
                        {faces.map((p, k) => (
                            <li key={p.id} data-rise="pop" style={{ '--d': k }} title={p.name}
                                className="relative h-11 w-11 overflow-hidden rounded-full bg-black/30 ring-2 ring-ground-deep sm:h-12 sm:w-12">
                                <PortraitImage person={p} sizes="48px" className="object-[50%_22%]" />
                                <span className="sr-only">{p.name}</span>
                            </li>
                        ))}
                        {people.length > faces.length && (
                            <li className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-[12px] font-semibold ring-2 ring-ground-deep sm:h-12 sm:w-12">
                                +{people.length - faces.length}
                            </li>
                        )}
                    </ul>
                    <div className="grid w-full grid-cols-1 gap-2.5 sm:flex sm:w-auto">
                        <Link href="/contact"
                            className="group inline-flex h-12 items-center justify-between gap-3 whitespace-nowrap rounded-full bg-accent pl-5 pr-1.5 text-[14.5px] font-semibold text-ink-onAccent
                                       transition-[background-color,transform] duration-ui ease-standard hover:bg-accent-hover motion-safe:active:scale-[0.97] focus-ring sm:flex-none">
                            Check your date
                            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
                                <FiArrowUpRight className="h-4 w-4 transition-transform duration-ui group-hover:-translate-y-px group-hover:translate-x-px" />
                            </span>
                        </Link>
                        {whatsapp && (
                            <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[14.5px] font-semibold text-ink-onDeep ring-1 ring-white/20
                                           transition-colors duration-ui hover:bg-white/10 motion-safe:active:scale-[0.97] focus-ring">
                                <FaWhatsapp aria-hidden="true" className="h-[18px] w-[18px]" /> WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
