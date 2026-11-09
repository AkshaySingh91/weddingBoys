'use client';

/**
 * FilmLightbox — what happens when someone presses play.
 *
 * Desktop: a theatre — near-black wine ground with a soft ambient glow taken
 * from the film's poster (one blurred image, painted once — no per-frame
 * sampling), the film centred in a rounded frame, title and close above.
 *
 * Phone: a sheet that rises from the bottom with the film edge-to-edge, the
 * title and a link to the film's page beneath. Swipe it down to close; the
 * Android back button closes it too (a history entry is pushed on open).
 *
 * Both: focus moves in and is restored, the page behind is locked, Escape
 * closes, reduced motion skips the travel. The jaali mesh and gold frame are gone.
 *
 * Props: src, title, poster?, href? (film page), onClose.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { motion, MotionConfig, useMotionValue, useTransform } from 'framer-motion';
import { FiX, FiArrowUpRight } from 'react-icons/fi';
import Videoplayer from '@/Component/Videoplayer.jsx';

const EMBED = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;
const withAutoplay = (url) => `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
const EASE = [0.16, 1, 0.3, 1];

function useIsPhone() {
    const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const sync = () => setPhone(mq.matches);
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);
    return phone;
}

export default function FilmLightbox({ src, title, poster, href, onClose }) {
    const restoreTo = useRef(null);
    const closeRef = useRef(null);
    const pushed = useRef(false);
    const phone = useIsPhone();
    const y = useMotionValue(0);
    const groundOpacity = useTransform(y, [0, 320], [1, 0]);

    // Close through history when we pushed an entry, so Back and the X agree.
    const close = useCallback(() => {
        if (pushed.current) { pushed.current = false; window.history.back(); } else onClose();
    }, [onClose]);

    useEffect(() => {
        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        window.history.pushState({ film: true }, '');
        pushed.current = true;
        const onPop = () => { pushed.current = false; onClose(); };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('popstate', onPop);
        document.addEventListener('keydown', onKey);
        const raf = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('popstate', onPop);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.({ preventScroll: true });
        };
    }, [onClose, close]);

    const film = EMBED.test(src || '') ? (
        <div className="relative aspect-video w-full bg-black">
            <iframe src={withAutoplay(src)} title={title || 'Wedding film'} allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        </div>
    ) : (
        <Videoplayer src={src} poster={poster} title={title} autoPlay />
    );

    const closeBtn = (
        <button ref={closeRef} type="button" onClick={close} aria-label="Close film"
            className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur
                       transition-colors duration-micro ease-standard hover:bg-white/20 focus-ring">
            <FiX className="h-5 w-5" />
        </button>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(
        <MotionConfig reducedMotion="user">
            <div role="dialog" aria-modal="true" aria-label={title ? `${title} — film` : 'Film'} className="fixed inset-0 z-modal">
                {/* Ground + ambient glow from the poster */}
                {/* Outer: fades in on open. Inner: fades with the swipe-down on phones. */}
                <motion.div aria-hidden="true" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }} onClick={close}>
                    <motion.div className="absolute inset-0 bg-[#140A0C]" style={phone ? { opacity: groundOpacity } : undefined}>
                        {poster && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={poster} alt="" className="absolute left-1/2 top-1/2 w-[90vw] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 scale-110 opacity-35 blur-[80px]" />
                        )}
                    </motion.div>
                </motion.div>

                {phone ? (
                    /* Phone: bottom sheet, swipe down to close */
                    <motion.div className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[28px] bg-[#1C0F12] pb-[max(1rem,env(safe-area-inset-bottom))] ring-1 ring-white/10"
                        style={{ y }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
                        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 500) close(); }}
                        initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.34, ease: EASE }}>
                        <div className="flex justify-center pb-2 pt-2.5"><span aria-hidden="true" className="h-1 w-10 rounded-full bg-white/25" /></div>
                        {film}
                        <div className="flex items-start justify-between gap-3 px-5 pt-4">
                            <div className="min-w-0">
                                <p className="truncate font-display text-[22px] leading-tight text-white">{title}</p>
                                {href && (
                                    <Link href={href} onClick={() => { pushed.current = false; }}
                                        className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-semibold text-white/75 hover:text-white">
                                        View the film page <FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                            {closeBtn}
                        </div>
                    </motion.div>
                ) : (
                    /* Desktop / tablet: theatre */
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 lg:p-10">
                        <motion.div className="pointer-events-auto w-full max-w-6xl"
                            initial={{ opacity: 0, y: 16, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.52, ease: EASE }}>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate font-display text-[26px] leading-tight text-white">{title}</p>
                                    {href && (
                                        <Link href={href} onClick={() => { pushed.current = false; }}
                                            className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-semibold text-white/70 hover:text-white">
                                            View the film page <FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                                        </Link>
                                    )}
                                </div>
                                {closeBtn}
                            </div>
                            <div className="overflow-hidden rounded-[20px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10">{film}</div>
                        </motion.div>
                    </div>
                )}
            </div>
        </MotionConfig>,
        document.body,
    );
}
