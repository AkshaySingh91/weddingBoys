'use client';

import Image from 'next/image';
import { FilmSlate, ImageSquare, Star, Check, WarningCircle } from '@phosphor-icons/react';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { cn } from '@/lib/utils.js';

export const posterOf = (i) => i?.render?.posterUrl || i?.render?.imageUrl || null;

export const nameOf = (i) => {
    const n = i?.client?.clientName;
    if (!n) return i?.clientNameText || 'Unassigned';
    return [n.Bride, n.Groom].filter(Boolean).join(' & ') || i?.clientNameText || 'Unassigned';
};

export default function PortfolioCard({ item, selected, onToggle, onOpen }) {
    const poster = posterOf(item);
    const isVideo = item.kind === 'Video';
    // A placement whose asset row vanished still renders — showing it is the only
    // way an admin can find and fix it.
    const orphaned = !item.media;

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-2xl border bg-white transition-all',
                selected ? 'border-[#8C532B] ring-2 ring-[#8C532B]/25' : 'border-[#E5DCD3] hover:border-stone-400',
            )}
        >
            <button
                type="button"
                onClick={() => onToggle(item._id)}
                aria-pressed={selected}
                aria-label={selected ? 'Deselect item' : 'Select item'}
                className={cn(
                    'absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-md border transition',
                    selected
                        ? 'border-[#8C532B] bg-[#8C532B] text-white'
                        : 'border-white/70 bg-black/30 text-transparent backdrop-blur-sm hover:text-white/70',
                )}
            >
                <Check size={14} weight="bold" />
            </button>

            <button
                type="button"
                onClick={() => onOpen(item)}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-100"
            >
                {poster ? (
                    <Image
                        src={poster}
                        alt={item.title || nameOf(item)}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        {...(item.render?.blurDataURL
                            ? { placeholder: 'blur', blurDataURL: item.render.blurDataURL }
                            : {})}
                    />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-stone-400">
                        {isVideo ? <FilmSlate size={30} /> : <ImageSquare size={30} />}
                    </span>
                )}

                <span className="absolute right-2 top-2 z-10 flex gap-1">
                    {item.isHero && (
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            <Star size={10} weight="fill" /> {item.heroPriority}
                        </span>
                    )}
                    {item.status !== 'Published' && (
                        <span className="rounded-md bg-stone-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {item.status}
                        </span>
                    )}
                </span>

                <span className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {isVideo ? <FilmSlate size={10} /> : <ImageSquare size={10} />}
                    P{item.generalPriority ?? 0}
                </span>
            </button>

            <div className="space-y-1.5 p-2.5">
                <p className="truncate text-xs font-medium text-stone-800">{nameOf(item)}</p>
                <div className="flex flex-wrap gap-1">
                    {(item.tags || []).slice(0, 3).map((t) => (
                        <Badge key={t} size="sm" variant="terracotta">{t}</Badge>
                    ))}
                    {!item.tags?.length && (
                        <Badge size="sm" variant="warning">No tags</Badge>
                    )}
                    {item.tags?.length > 3 && (
                        <Badge size="sm" variant="neutral">+{item.tags.length - 3}</Badge>
                    )}
                </div>
                {orphaned && (
                    <p className="flex items-center gap-1 text-[10px] font-medium text-rose-600">
                        <WarningCircle size={11} /> No linked asset
                    </p>
                )}
            </div>
        </div>
    );
}
