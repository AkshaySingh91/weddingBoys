'use client';

/**
 * /photos/selects?ids=… — a shortlist someone shared (usually into a family
 * WhatsApp group). The same contact sheet as the gallery; "Keep all of these"
 * copies them into this device's selects (each can also be circled alone).
 */
import Link from 'next/link';
import PhotoTile, { aspectOf } from '@/Component/photos/PhotoTile.jsx';
import SelectsTray from '@/Component/photos/SelectsTray.jsx';
import { useSelects } from '@/Component/photos/selects.js';
import { stillLadder } from '@/lib/films.js';
import { gradeOf, GOLD } from '@/lib/grades.js';

const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c);

export default function SharedSelects({ photos = [], studioPhone = null }) {
    const selects = useSelects();
    const missing = photos.filter((p) => !selects.has(p._id));
    const keepAll = () => missing.forEach((p) => selects.toggle({ id: p._id, src: stillLadder(p.url, { width: p.width, cap: 640 })?.src || p.url, a: aspectOf(p) }));

    return (
        <div className="mx-auto w-full max-w-wide px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pt-12">
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <h1 className="font-display text-[44px] leading-[0.95] text-ink sm:text-[60px]">Selected photographs</h1>
                    <p className="mt-3 text-[16px] text-ink-secondary">
                        {photos.length ? `${photos.length} frame${photos.length === 1 ? '' : 's'} circled from our weddings.` : 'This link has no photographs in it any more.'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {missing.length > 0 && (
                        <button type="button" onClick={keepAll} className="h-12 cursor-pointer rounded-full bg-ink px-5 text-[15px] font-semibold text-ground focus-ring">
                            Keep all of these
                        </button>
                    )}
                    <Link href="/photos" className="inline-flex h-12 items-center rounded-full px-5 text-[15px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                        See every photograph
                    </Link>
                </div>
            </div>

            {photos.length > 0 && (
                <ul className="pgrid mt-8">
                    {photos.map((p, i) => (
                        <PhotoTile key={p._id} p={p} i={i} priority={i === 0} tint={p.eventGroup ? gradeOf({ label: rite(p.eventGroup) }) : GOLD}
                            selected={selects.has(p._id)} onSelect={selects.toggle} />
                    ))}
                </ul>
            )}
            <SelectsTray studioPhone={studioPhone} />
        </div>
    );
}
