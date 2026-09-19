'use client';

/**
 * SiteHeader.
 *
 * Replaces a masthead that shipped three defects at once: three of its four
 * primary items were `#fragment` links whose targets exist only on the home
 * page, so they did nothing on 13 of 14 pages (R-07); its list disagreed with
 * the footer's (R-39); and a hamburger rendered beside an already-visible nav
 * between `md` and `xl`.
 *
 * Nav now comes from `lib/navigation.js` — the same file the footer reads — and
 * collapses at exactly one breakpoint (1024px). Above it, a full nav; below it,
 * a menu. Nothing in between.
 *
 * Scroll behaviour is one transition, at 72px: 96px tall and transparent
 * becomes 64px tall and near-opaque with a blur. It does not hide on scroll-down
 * — reclaiming 64px is an app pattern that costs more in orientation than it
 * returns on a site people browse rather than operate.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV, PRIMARY_CTA } from '@/lib/navigation.js';
import Button from '@/Component/ui/Button.jsx';
import MobileMenu from './MobileMenu.jsx';

/**
 * The wordmark stands alone.
 *
 * A first pass set a tracked-out uppercase descriptor beneath it — which is the
 * eyebrow-label anti-pattern this system bans, self-inflicted. The corrected
 * positioning line (R-08) lives in the footer, where it has room to be a
 * sentence rather than a label. One mark, no caption.
 */
function Wordmark({ condensed }) {
    return (
        <Link
            href="/"
            className="flex min-h-[44px] items-center leading-none"
            aria-label="The Wedding Boys — home"
        >
            <span
                className={`font-display font-semibold tracking-[0.16em] text-ink transition-all
                            duration-ui ease-standard ${condensed ? 'text-[16px]' : 'text-[19px]'}`}
            >
                THE WEDDING BOYS
            </span>
        </Link>
    );
}

export default function SiteHeader() {
    const [condensed, setCondensed] = useState(false);
    const [openPanel, setOpenPanel] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const closeTimer = useRef(null);
    const pathname = usePathname();

    useEffect(() => {
        const onScroll = () => setCondensed(window.scrollY > 72);
        /*
          Deferred to a frame rather than called inline: the React Compiler
          rejects a synchronous setState in an effect body, and a restored scroll
          position (back-navigation) still needs the condensed state on arrival.
        */
        const raf = requestAnimationFrame(onScroll);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    /*
      Route change closes everything — a panel left open across a navigation is
      the classic "menu stuck open" bug.

      Adjusted during render rather than in an effect. React sanctions this for
      resetting state when a prop changes, and it avoids the extra commit an
      effect would cause; the React Compiler rejects a synchronous setState in an
      effect body outright.
    */
    const [lastPath, setLastPath] = useState(pathname);
    if (lastPath !== pathname) {
        setLastPath(pathname);
        setOpenPanel(null);
        setMenuOpen(false);
    }

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') { setOpenPanel(null); setMenuOpen(false); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* Panels open on hover but close on a short delay, so the diagonal travel
       from trigger to panel content does not dismiss them. */
    const hold = (label) => { clearTimeout(closeTimer.current); setOpenPanel(label); };
    const release = () => { closeTimer.current = setTimeout(() => setOpenPanel(null), 180); };

    const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-header transition-all duration-ui ease-standard
                        ${condensed
                            ? 'h-[var(--header-height-condensed)] bg-ground/92 backdrop-blur-md border-b border-gold/40'
                            : 'h-header bg-transparent border-b border-transparent'}`}
        >
            <div className="mx-auto flex h-full max-w-wide items-center justify-between gap-6 px-5 md:px-8 lg:px-12">
                <Wordmark condensed={condensed} />

                <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
                    {PRIMARY_NAV.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <div
                                key={item.label}
                                className="relative"
                                onMouseEnter={item.panel ? () => hold(item.label) : undefined}
                                onMouseLeave={item.panel ? release : undefined}
                            >
                                <Link
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    aria-expanded={item.panel ? openPanel === item.label : undefined}
                                    onFocus={item.panel ? () => hold(item.label) : undefined}
                                    className={`relative flex min-h-[44px] items-center px-3.5 text-[14px]
                                                transition-colors duration-micro ease-standard
                                                ${active ? 'text-ink' : 'text-ink-secondary hover:text-ink'}`}
                                >
                                    {item.label}
                                    {/* Active mark is a gold thread, not a colour swap —
                                        it reads at a glance without shouting. */}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute inset-x-3.5 bottom-2 h-px bg-gold-strong transition-transform
                                                    duration-micro ease-standard origin-left
                                                    ${active ? 'scale-x-100' : 'scale-x-0'}`}
                                    />
                                </Link>

                                {item.panel && openPanel === item.label && (
                                    <div
                                        onMouseEnter={() => hold(item.label)}
                                        onMouseLeave={release}
                                        className="absolute left-0 top-full min-w-[248px] border border-gold/40
                                                   bg-ground-raised p-2 shadow-overlay rounded-panel"
                                    >
                                        {item.panel.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className="flex min-h-[44px] flex-col justify-center rounded-control px-3 py-2
                                                           transition-colors duration-micro ease-standard
                                                           hover:bg-ground-sunk"
                                            >
                                                <span className="text-[14px] text-ink">{sub.label}</span>
                                                {sub.note && (
                                                    <span className="t-caption mt-0.5">{sub.note}</span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    <Button href={PRIMARY_CTA.href} variant="primary" size="md" className="hidden sm:inline-flex">
                        {PRIMARY_CTA.label}
                    </Button>

                    {/* One menu control, below 1024 only. */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={menuOpen}
                        className="grid h-11 w-11 place-items-center rounded-control text-ink
                                   transition-colors duration-micro ease-standard hover:bg-ground-sunk lg:hidden"
                    >
                        <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
                            <span className="h-px w-full bg-current" />
                            <span className="h-px w-full bg-current" />
                            <span className="h-px w-3/5 bg-current" />
                        </span>
                    </button>
                </div>
            </div>

            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </header>
    );
}
