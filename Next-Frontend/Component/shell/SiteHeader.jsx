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
 * The bar is ALWAYS on a solid ground. A first pass made it transparent until
 * 72px of scroll, which looked clean on a pale page and was unreadable on the
 * home page — the hero video sits directly beneath it, so dark ink on a
 * transparent bar over dark footage left the navigation invisible. A masthead
 * that disappears over certain content is not a style, it is a bug.
 *
 * Height is 72px, condensing to 58px past 72px of scroll. The first attempt at
 * 96px was simply too tall: it ate the top of every hero for no gain.
 *
 * It does not hide on scroll-down — reclaiming 58px is an app pattern that costs
 * more in orientation than it returns on a site people browse rather than
 * operate.
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
                /*
                  Sized down hard on a phone. At 16px with 0.15em tracking the
                  wordmark needs ~184px, which against a 110px CTA and a 44px
                  menu button in 350px of usable width wrapped it onto two lines
                  and burst the 72px bar.
                */
                className={`whitespace-nowrap font-display font-semibold text-accent-ink transition-all
                            duration-ui ease-standard
                            tracking-[0.1em] sm:tracking-[0.15em]
                            ${condensed
                                ? 'text-[12px] sm:text-[15px] lg:text-[16px]'
                                : 'text-[13px] sm:text-[16px] lg:text-[18px]'}`}
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
            className={`fixed inset-x-0 top-0 z-header border-b transition-all duration-ui ease-standard
                        ${condensed
                            ? 'h-[var(--header-height-condensed)] bg-ground border-gold/45 shadow-panel'
                            : 'h-header bg-accent-tint border-gold/30'}`}
        >
            <div className="mx-auto flex h-full max-w-wide items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 md:px-8 lg:px-12">
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
                                    className={`relative flex min-h-[44px] items-center px-3 text-[14px]
                                                transition-colors duration-micro ease-standard
                                                ${active ? 'text-accent-ink' : 'text-ink-secondary hover:text-accent-ink'}`}
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

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Visible at every width — on a phone this is the whole
                        purpose of the bar, and hiding it behind the menu buried
                        the studio's only conversion action. */}
                    <Button href={PRIMARY_CTA.href} variant="primary" size="sm" className="shrink-0">
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
