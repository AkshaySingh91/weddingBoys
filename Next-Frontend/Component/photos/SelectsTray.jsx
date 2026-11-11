'use client';

/**
 * Your selects — the pill (always reachable once something is selected) and
 * the sheet it opens: a contact sheet of the frames you circled, to send to
 * family (WhatsApp share), to the studio (WhatsApp to the studio's number) or
 * as an enquiry. Phones: a bottom sheet. Desktop: a drawer from the right.
 * Solid scrim, no blur; the sheet is a native <dialog> (focus trap, Esc).
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import { useSelects, selectsHref } from './selects.js';

const absolute = (path) => (typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString());

export default function SelectsTray({ studioPhone = null }) {
    const { list, remove, clear } = useSelects();
    const [open, setOpen] = useState(false);
    const dialog = useRef(null);

    useEffect(() => {
        const d = dialog.current;
        if (!d) return;
        if (open && !d.open) d.showModal();
        if (!open && d.open) d.close();
    }, [open]);

    const n = list.length;
    const link = absolute(selectsHref(list));
    const family = `https://wa.me/?text=${encodeURIComponent(`Our favourite wedding photographs so far: ${link}`)}`;
    const studio = studioPhone
        ? `https://wa.me/${String(studioPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, we're planning our wedding and loved these photographs: ${link}`)}`
        : null;

    return (
        <>
            {/* the pill: appears with the first select */}
            <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" data-selects-target=""
                className={`fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 z-40 flex h-12 cursor-pointer items-center gap-3 rounded-full bg-ground-deep py-1.5 pl-1.5 pr-5 text-[14px] font-semibold text-ink-onDeep shadow-[0_14px_34px_-14px_rgba(51,22,26,0.75)] transition-[opacity,transform] duration-ui ease-entrance focus-ring lg:left-auto lg:right-6
                            ${n ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
                <span className="flex -space-x-3">
                    {list.slice(0, 3).map((x) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={x.id} src={x.src} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-ground-deep" />
                    ))}
                </span>
                Your selects
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-accent px-2 text-[13px] tabular-nums text-ink-onAccent">{n}</span>
            </button>

            <dialog ref={dialog} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === dialog.current) setOpen(false); }}
                aria-labelledby="selects-title"
                className="sheet-dialog m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgba(28,17,10,0.5)]">
                <div className="sheet-panel flex flex-col bg-ground text-ink">
                    <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
                        <div>
                            <h2 id="selects-title" className="font-display text-[30px] leading-none">Your selects</h2>
                            <p className="mt-2 text-[14px] text-ink-muted">{n ? `${n} photograph${n === 1 ? '' : 's'}, kept on this device.` : 'Circle the frames you would want for your own day. They stay on this device.'}</p>
                        </div>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-ink/5 focus-ring">
                            <FiX aria-hidden="true" className="h-5 w-5" />
                        </button>
                    </div>

                    {n > 0 && (
                        <ul className="grid flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto px-5 pb-4 sm:grid-cols-3 sm:px-6">
                            {list.map((x) => (
                                <li key={x.id} className="relative">
                                    <Link href={`/photos/${x.id}`} prefetch={false} onClick={() => setOpen(false)} className="block overflow-hidden rounded-[6px] bg-ground-deep focus-ring">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={x.src} alt="" loading="lazy" className="aspect-[4/5] h-full w-full object-cover" />
                                    </Link>
                                    <button type="button" onClick={() => remove(x.id)} aria-label="Remove from your selects"
                                        className="absolute right-0 top-0 grid h-11 w-11 cursor-pointer place-items-center focus-ring">
                                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-ink shadow"><FiX aria-hidden="true" className="h-3.5 w-3.5" /></span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="space-y-2 border-t border-ink/10 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4 sm:px-6">
                        {n > 0 ? (
                            <>
                                <a href={family} target="_blank" rel="noopener noreferrer"
                                    className="flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-ground hover:bg-ink/90 focus-ring">
                                    Send to family on WhatsApp
                                </a>
                                {studio ? (
                                    <a href={studio} target="_blank" rel="noopener noreferrer"
                                        className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring">
                                        Ask us about these
                                    </a>
                                ) : (
                                    <Link href={`/contact?selects=${list.map((x) => x.id).join(',')}`}
                                        className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring">
                                        Ask us about these
                                    </Link>
                                )}
                                <div className="flex justify-between pt-1 text-[14px]">
                                    <Link href={selectsHref(list)} prefetch={false} onClick={() => setOpen(false)} className="font-semibold text-accent-ink hover:text-accent">Open as a page</Link>
                                    <button type="button" onClick={clear} className="cursor-pointer text-ink-muted hover:text-ink">Clear all</button>
                                </div>
                            </>
                        ) : (
                            <button type="button" onClick={() => setOpen(false)}
                                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-ground focus-ring">
                                Browse photographs
                            </button>
                        )}
                    </div>
                </div>
            </dialog>
        </>
    );
}
