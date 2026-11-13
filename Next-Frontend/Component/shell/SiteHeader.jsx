'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiArrowUpRight } from 'react-icons/fi';
import { PRIMARY_NAV, PRIMARY_CTA, BRAND_TAGLINE } from '@/lib/navigation.js';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import MobileMenu from './MobileMenu.jsx';

function BrandLockup() {
    const { studioLogo } = useStudioDetails();
    const [failedLogo, setFailedLogo] = useState(null);
    return (
        <Link href="/" aria-label="The Wedding Vachan, home" className="flex min-w-0 items-center gap-2 rounded-xl focus-ring min-[380px]:gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full min-[380px]:h-9 min-[380px]:w-9 bg-ground-raised ring-1 ring-gold/50 sm:h-10 sm:w-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={studioLogo && studioLogo !== failedLogo ? studioLogo : '/companyLogo.png'}
                    onError={() => setFailedLogo(studioLogo)} alt="" className="h-full w-full object-contain p-0.5" />
            </span>
            <span className="flex min-w-0 flex-col">
                {/* Truncates rather than running under the quote button on narrow phones. */}
                <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[14px] font-semibold leading-tight tracking-[0.01em] text-ink min-[380px]:text-[15px] min-[380px]:tracking-[0.02em] sm:text-[18px]">
                    The Wedding Vachan
                </span>
                <span className="hidden overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted sm:block">
                    {BRAND_TAGLINE}
                </span>
            </span>
        </Link>
    );
}

export default function SiteHeader() {
    const pathname = usePathname();
    const [openPanel, setOpenPanel] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const closeTimer = useRef(null);
    const [lastPath, setLastPath] = useState(pathname);
    if (lastPath !== pathname) {
        setLastPath(pathname);
        setOpenPanel(null);
        setMenuOpen(false);
    }
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') { setOpenPanel(null); setMenuOpen(false); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    useEffect(() => () => clearTimeout(closeTimer.current), []);
    const hold = (label) => { clearTimeout(closeTimer.current); setOpenPanel(label); };
    const release = () => { closeTimer.current = setTimeout(() => setOpenPanel(null), 160); };
    // The bar lifts (stronger shadow) once the page has moved under it.
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    const isActive = (href) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

    return (
        /* A floating bar inset from the screen edge, not a full-bleed strip. The
           outer header keeps the full --header-height so every page's top offset
           is unchanged. */
        <header className="pointer-events-none fixed inset-x-0 top-0 z-header h-header px-2.5 pt-2 sm:px-4 lg:px-6">
            <div className={`pointer-events-auto mx-auto flex h-[calc(var(--header-height)-14px)] max-w-wide items-center justify-between gap-2 min-[380px]:gap-3
                             rounded-2xl border border-ink/[0.08] bg-ground-raised/80 pl-2.5 pr-1.5 backdrop-blur-xl
                             transition-shadow duration-ui ease-standard sm:pl-3 sm:pr-2 lg:px-3
                             ${scrolled ? 'shadow-[0_10px_30px_-14px_rgba(42,27,18,0.35)]' : 'shadow-[0_1px_2px_rgba(42,27,18,0.06)]'}`}>
                <BrandLockup />
                <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
                    {PRIMARY_NAV.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <div key={item.label} className="relative"
                                onMouseEnter={item.panel ? () => hold(item.label) : undefined}
                                onMouseLeave={item.panel ? release : undefined}>
                                <Link href={item.href} aria-current={active ? 'page' : undefined}
                                    aria-expanded={item.panel ? openPanel === item.label : undefined}
                                    onFocus={item.panel ? () => hold(item.label) : undefined}
                                    className={`inline-flex min-h-10 items-center rounded-xl px-3.5 text-[13.5px] font-medium transition-colors focus-ring
                                        ${active ? 'bg-ink/[0.06] text-ink' : 'text-ink-secondary hover:bg-ink/[0.04] hover:text-ink'}`}>
                                    {item.label}
                                </Link>
                                {item.panel && openPanel === item.label && (
                                    <div className="absolute left-0 top-full pt-3" onMouseEnter={() => hold(item.label)} onMouseLeave={release}>
                                        <div className="min-w-[240px] rounded-2xl border border-ink/[0.08] bg-ground-raised p-1.5 shadow-overlay">
                                            {item.panel.map((sub) => (
                                                <Link key={sub.href} href={sub.href} onClick={() => setOpenPanel(null)}
                                                    className="flex min-h-11 flex-col justify-center rounded-xl px-3 py-2 hover:bg-ink/[0.04]">
                                                    <span className="text-[13px] font-medium text-ink">{sub.label}</span>
                                                    {sub.note && <span className="mt-0.5 text-[11px] text-ink-muted">{sub.note}</span>}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
                <div className="flex shrink-0 items-center gap-1">
                    <Link href={PRIMARY_CTA.href} aria-label={PRIMARY_CTA.label}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-[13px] font-semibold text-ink-onAccent shadow-sm transition-colors hover:bg-accent-hover focus-ring sm:px-4">
                        {/* "Quote" on the narrowest phones so the studio name never truncates. */}
                        <span className="min-[420px]:hidden">Quote</span>
                        <span className="hidden min-[420px]:inline">{PRIMARY_CTA.label}</span>
                        <FiArrowUpRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
                    </Link>
                    <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen} aria-controls="site-menu"
                        className="grid h-10 w-10 place-items-center rounded-xl text-ink transition-colors hover:bg-ink/[0.05] focus-ring lg:hidden">
                        <span aria-hidden="true" className="relative block h-3 w-[18px]">
                            <span className={`absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-ui ease-standard ${menuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'}`} />
                            <span className={`absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-ui ease-standard ${menuOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'}`} />
                        </span>
                    </button>
                </div>
            </div>
            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </header>
    );
}
