'use client';

/**
 * Your selects — the pill, and the contact sheet it opens.
 *
 * The sheet is the studio's light table: warm, lit paper with your selects laid
 * on it as prints (white borders, a hand-placed tilt, a soft shadow), each
 * circled and numbered in red grease pencil (the loops draw in one after
 * another as it opens). Below, the lookbook: a
 * small preview of the PDF's cover (the studio's invitation-card design with
 * your selects), your names for it, and Download — or Share, which on phones
 * hands the PDF itself to WhatsApp and family. Then: Ask us about these.
 *
 * Phones: a bottom sheet. Desktop: a drawer from the right. Native <dialog>;
 * solid scrim (no blur); one-shot motion only while opening.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiX, FiDownload, FiShare2 } from 'react-icons/fi';
import { useSelects, selectsHref } from './selects.js';
import { GreasePencil } from './PhotoTile.jsx';
import { contactHref } from '@/lib/contact.js';

const api = () => (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'));
const absolute = (p) => (typeof window === 'undefined' ? p : new URL(p, window.location.origin).toString());
const NAMES_KEY = 'twv.selects.names';

export default function SelectsTray({ studioPhone = null }) {
    const { list, remove, clear } = useSelects();
    const [open, setOpen] = useState(false);
    const [names, setNames] = useState('');
    const [making, setMaking] = useState(null);   // 'download' | 'share' | null
    const [error, setError] = useState('');
    const dialog = useRef(null);

    useEffect(() => { try { setNames(localStorage.getItem(NAMES_KEY) || ''); } catch { /* none */ } }, []); // eslint-disable-line react-hooks/set-state-in-effect
    useEffect(() => {
        const d = dialog.current;
        if (!d) return;
        if (open && !d.open) d.showModal();
        if (!open && d.open) d.close();
    }, [open]);

    const n = list.length;
    const ids = list.slice(0, 30).map((x) => x.id).join(',');
    const link = absolute(selectsHref(list));
    const studio = studioPhone
        ? `https://wa.me/${String(studioPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, we're planning our wedding and loved these photographs: ${link}`)}`
        : contactHref({ from: 'selects', selects: list.map((x) => x.id) });
    const saveNames = (v) => { setNames(v); try { localStorage.setItem(NAMES_KEY, v); } catch { /* private mode */ } };

    /** Make the lookbook on the server and hand it over (download or share the file). */
    const lookbook = async (mode) => {
        setError(''); setMaking(mode);
        try {
            const res = await fetch(`${api()}/api/photos/selects.pdf?ids=${ids}${names.trim() ? `&names=${encodeURIComponent(names.trim())}` : ''}`);
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            const name = `the-wedding-vachan-selects${names.trim() ? `-${names.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : ''}.pdf`;
            const file = new File([blob], name, { type: 'application/pdf' });
            if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Our wedding selects', text: `Our favourite wedding photographs: ${link}` }).catch(() => {});
            } else if (mode === 'share') {
                window.open(`https://wa.me/?text=${encodeURIComponent(`Our favourite wedding photographs so far: ${link}`)}`, '_blank', 'noopener');
            } else {
                const url = URL.createObjectURL(blob);
                const a = Object.assign(document.createElement('a'), { href: url, download: name });
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);
            }
        } catch {
            setError('The lookbook could not be made just now. Please try again.');
        } finally {
            setMaking(null);
        }
    };

    return (
        <>
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
                aria-labelledby="selects-title" className="sheet-dialog m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgba(28,17,10,0.55)]">
                <div className="sheet-panel light-table flex flex-col text-ink">
                    <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-6">
                        <div>
                            <h2 id="selects-title" className="font-display text-[32px] leading-none text-ink">Your selects</h2>
                            <p className="mt-2 text-[14px] text-ink-muted">
                                {n ? `${n} frame${n === 1 ? '' : 's'} circled, kept on this device.` : 'Circle the frames you would want for your own day. They stay on this device.'}
                            </p>
                        </div>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink hover:bg-ink/5 focus-ring">
                            <FiX aria-hidden="true" className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {n > 0 && (
                            <div className="mx-1 sm:mx-2">
                                {n > 3 && <p className="px-4 text-[12px] text-ink-muted lg:hidden">Swipe through all {n}.</p>}
                                {/* Prints laid on the light table. Phones: one row to swipe — the sheet keeps
                                    its size however many are circled. Desktop drawer: rows that scroll. */}
                                <ul className="proofs flex snap-x gap-3 overflow-x-auto px-4 pb-4 pt-3 scrollbar-none lg:grid lg:max-h-[46vh] lg:grid-cols-4 lg:overflow-y-auto lg:overflow-x-hidden">
                                    {list.map((x, i) => (
                                        <li key={x.id} className="proof w-[88px] shrink-0 snap-start lg:w-auto" style={{ '--i': Math.min(i, 11), '--tilt': `${[-1.6, 1.1, -0.6, 1.8, -1.2, 0.7][i % 6]}deg` }}>
                                            <Link href={`/photos/${x.id}`} prefetch={false} onClick={() => setOpen(false)}
                                                className="print relative block aspect-[4/5] focus-ring">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={x.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                                                <GreasePencil id={x.id} a={0.8} fresh={open} />
                                            </Link>
                                            <span aria-hidden="true" className="print-no">{String(i + 1).padStart(2, '0')}</span>
                                            <button type="button" onClick={() => remove(x.id)} aria-label={`Remove frame ${i + 1} from your selects`}
                                                className="absolute -right-1 -top-1 grid h-11 w-11 cursor-pointer place-items-center focus-ring">
                                                <span className="grid h-7 w-7 place-items-center rounded-full bg-ground-raised text-ink shadow-[0_2px_8px_-2px_rgba(51,22,26,0.45)] ring-1 ring-ink/10"><FiX aria-hidden="true" className="h-3.5 w-3.5" /></span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {n > 0 && (
                            /* The lookbook: what they will get, and their names for its cover */
                            <section aria-labelledby="lookbook-title" className="mx-4 mt-2 flex gap-4 rounded-[18px] bg-ground-raised p-4 text-ink shadow-[0_10px_30px_-22px_rgba(51,22,26,0.5)] ring-1 ring-gold/30 sm:mx-5">
                                <div aria-hidden="true" className="lookbook-cover shrink-0">
                                    <span className="lookbook-mono">TWV</span>
                                    <span className="lookbook-collage">
                                        {list.slice(0, 3).map((x) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={x.id} src={x.src} alt="" />
                                        ))}
                                    </span>
                                    <span className="lookbook-title">{names.trim() || 'Our selects'}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 id="lookbook-title" className="text-[15px] font-semibold">Your lookbook</h3>
                                    <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                                        {n > 30 ? `Your first 30 frames, in a PDF to keep, print or send to family.` : 'Every frame you circled, in a PDF to keep, print or send to family.'}
                                    </p>
                                    <label className="mt-3 block">
                                        <span className="text-[12px] font-semibold text-ink-secondary">Names for the cover (optional)</span>
                                        <input value={names} onChange={(e) => saveNames(e.target.value.slice(0, 60))} placeholder="Riya & Arjun" autoComplete="off"
                                            className="mt-1 h-11 w-full rounded-[12px] bg-ground-raised px-3 text-[16px] text-ink ring-1 ring-ink/15 placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50" />
                                    </label>
                                </div>
                            </section>
                        )}
                        {error && <p role="alert" className="mx-5 mt-3 text-[13.5px] text-accent-ink">{error}</p>}
                    </div>

                    <div className="space-y-2 border-t border-ink/10 bg-ground-raised/70 px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4 sm:px-6">
                        {n > 0 ? (
                            <>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => lookbook('download')} disabled={Boolean(making)} aria-busy={making === 'download'}
                                        className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-ground hover:bg-ink/90 focus-ring disabled:cursor-wait disabled:opacity-80">
                                        <FiDownload aria-hidden="true" className="h-[18px] w-[18px]" />
                                        {making === 'download' ? 'Making your lookbook…' : 'Download the lookbook'}
                                    </button>
                                    <button type="button" onClick={() => lookbook('share')} disabled={Boolean(making)} aria-label="Share with family"
                                        className="flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold text-ink ring-1 ring-ink/20 hover:bg-ink/5 focus-ring disabled:cursor-wait">
                                        <FiShare2 aria-hidden="true" className="h-[18px] w-[18px]" />
                                        <span className="hidden sm:inline">{making === 'share' ? 'Preparing…' : 'Share'}</span>
                                    </button>
                                </div>
                                <a href={studio} target={studioPhone ? '_blank' : undefined} rel={studioPhone ? 'noopener noreferrer' : undefined}
                                    className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring">
                                    Ask us about these
                                </a>
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
