/**
 * Love notes — a swipeable rail of quote cards.
 *
 * Each card: a red quote badge, the words at a readable size, and the couple's
 * photo, name and role. The first card is tinted so the rail has a lead. Above
 * it, an avatar stack summarises how many couples wrote in. Server-renderable:
 * the rail is plain scroll-snap, no state.
 */
import Image from 'next/image';
import { RiDoubleQuotesL } from 'react-icons/ri';
import { CARD, CARD_TINT } from './Chapter.jsx';

const mediaUrl = (m) => m?.url || m?.cdnUrl || m?.publicUrl || '';

function Quote() {
    return (
        <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-accent text-ink-onAccent">
            <RiDoubleQuotesL className="h-5 w-5" />
        </span>
    );
}

export default function ReviewsShowcase({ items = [] }) {
    if (!items.length) return null;
    const faces = items.filter((r) => mediaUrl(r.media?.[0])).slice(0, 4);

    return (
        <div className="mt-8 sm:mt-12">
            {faces.length > 1 && (
                <div className="flex items-center gap-3">
                    <span className="flex -space-x-3" aria-hidden="true">
                        {faces.map((r, k) => (
                            <span key={r._id || k} className="relative h-10 w-10 overflow-hidden rounded-full bg-ground-sunk ring-2 ring-ground">
                                <Image src={mediaUrl(r.media[0])} alt="" fill sizes="40px" className="object-cover" />
                            </span>
                        ))}
                    </span>
                    <p className="text-[14px] text-ink-secondary"><span className="font-semibold text-ink">{items.length} couples</span> shared their story</p>
                </div>
            )}

            <ul className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-4">
                {items.map((r, k) => {
                    const src = mediaUrl(r.media?.[0]);
                    return (
                        <li key={r._id || k} className={`flex w-[84vw] shrink-0 snap-start flex-col p-6 sm:w-auto ${k === 0 ? CARD_TINT : CARD}`}>
                            <Quote />
                            <blockquote className="mt-5 flex-1 text-[16.5px] leading-relaxed text-ink">{r.body}</blockquote>
                            <div className="mt-6 flex items-center gap-3 border-t border-ink/[0.07] pt-4">
                                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ground-sunk">
                                    {src
                                        ? <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                                        : <span className="grid h-full w-full place-items-center text-[14px] font-semibold text-ink-secondary">{r.title?.[0]}</span>}
                                </span>
                                <span>
                                    <span className="block text-[15px] font-semibold text-ink">{r.title}</span>
                                    {r.subtitle && <span className="block text-[13px] text-ink-muted">{r.subtitle}</span>}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
