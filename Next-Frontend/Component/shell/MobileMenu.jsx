'use client';

/**
 * MobileMenu — the navigation below the `lg` breakpoint.
 *
 * A dropdown panel that hangs under the floating header, not a full-screen
 * drawer: the page stays visible (dimmed) around it, so opening the menu does
 * not feel like leaving the page. The header sits ABOVE this layer, so the same
 * button that opened the menu closes it.
 *
 * Reads `lib/navigation.js` like the header and footer, so the three surfaces
 * cannot disagree. The quote button lives in the header and the socials in the
 * footer; the menu is only navigation.
 *
 * Escape (handled in SiteHeader), a tap outside, or choosing a link closes it.
 * Focus moves to the first link on open and back to the trigger on close.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';
import { PRIMARY_NAV } from '@/lib/navigation.js';
import NavIcon from './NavIcon.jsx';

export default function MobileMenu({ open, onClose }) {
    const pathname = usePathname();
    const reduceMotion = useReducedMotion();
    const panelRef = useRef(null);
    const restoreTo = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        const raf = requestAnimationFrame(() => panelRef.current?.querySelector('a[href]')?.focus({ preventScroll: true }));
        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.({ preventScroll: true });
        };
    }, [open]);

    const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

    // Nothing is portalled until the menu has been opened once: the server (and
    // hydration) render nothing here, and after that the portal stays mounted so
    // AnimatePresence can play the closing animation.
    const [armed, setArmed] = useState(false);
    if (open && !armed) setArmed(true);
    if (!armed) return null;

    // Rendered on <body>: the header's backdrop-filter would otherwise become the
    // containing block for these fixed layers and squeeze them into the header.
    // z-[199] — directly under the header (z-header = 200).
    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[199] lg:hidden">
                    <motion.button
                        type="button"
                        aria-label="Close menu"
                        tabIndex={-1}
                        onClick={onClose}
                        className="absolute inset-0 h-full w-full cursor-default bg-ink/30 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    />

                    <motion.nav
                        id="site-menu"
                        ref={panelRef}
                        aria-label="Menu"
                        className="absolute inset-x-2.5 top-[calc(var(--header-height)-2px)] max-h-[calc(100svh-var(--header-height)-12px)]
                                   origin-top overflow-y-auto overscroll-contain rounded-2xl border border-ink/[0.08]
                                   bg-ground-raised p-1.5 shadow-overlay sm:left-auto sm:right-4 sm:w-[380px]"
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <ul className="divide-y divide-ink/[0.06]">
                            {PRIMARY_NAV.map((item) => {
                                const active = isActive(item.href) && !item.panel?.some((sub) => sub.href !== item.href && isActive(sub.href));
                                return (
                                    <li key={item.label} className="py-1 first:pt-0 last:pb-0">
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            aria-current={active ? 'page' : undefined}
                                            className={`group flex min-h-[56px] items-center gap-3 rounded-xl px-2.5 py-2 transition-colors
                                                        duration-micro ease-standard focus-ring
                                                        ${active ? 'bg-accent-wash' : 'hover:bg-ink/[0.04]'}`}
                                        >
                                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl
                                                              ${active ? 'bg-accent text-ink-onAccent' : 'bg-ink/[0.05] text-ink'}`}>
                                                <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
                                            </span>
                                            <span className="flex min-w-0 flex-1 flex-col">
                                                <span className="text-[15px] font-semibold leading-tight text-ink">{item.label}</span>
                                                {item.note && <span className="mt-0.5 truncate text-[12.5px] text-ink-muted">{item.note}</span>}
                                            </span>
                                            <FiChevronRight aria-hidden="true"
                                                className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-micro ease-standard group-hover:translate-x-0.5" />
                                        </Link>

                                        {/* Sub-pages as a compact two-column grid under their parent. */}
                                        {item.panel && (
                                            <ul className="grid grid-cols-2 gap-1 px-1.5 pb-1.5 pt-0.5 pl-[58px]">
                                                {item.panel.map((sub) => {
                                                    const on = pathname === sub.href;
                                                    return (
                                                        <li key={sub.href}>
                                                            <Link
                                                                href={sub.href}
                                                                onClick={onClose}
                                                                aria-current={on ? 'page' : undefined}
                                                                className={`flex min-h-[44px] flex-col justify-center rounded-lg border px-2.5 py-1.5
                                                                            transition-colors duration-micro ease-standard focus-ring
                                                                            ${on ? 'border-accent/40 bg-accent-wash' : 'border-ink/[0.07] hover:border-ink/20 hover:bg-ink/[0.03]'}`}
                                                            >
                                                                <span className="text-[13px] font-medium leading-tight text-ink">{sub.label}</span>
                                                                {sub.note && <span className="mt-0.5 truncate text-[11px] leading-tight text-ink-muted">{sub.note}</span>}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.nav>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
