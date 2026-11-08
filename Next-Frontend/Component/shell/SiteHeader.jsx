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
        <Link href="/" aria-label="The Wedding Vachan — home" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/50 bg-ground-raised p-1 shadow-sm sm:h-11 sm:w-11">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={studioLogo && studioLogo !== failedLogo ? studioLogo : '/companyLogo.png'}
                    onError={() => setFailedLogo(studioLogo)} alt="" className="h-full w-full rounded-full object-contain" />
            </span>
            <span className="flex min-w-0 flex-col">
                {/* Truncates rather than running under the Get Quote button on narrow phones. */}
                <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[13px] font-semibold leading-tight tracking-[0.04em] text-ink sm:text-[19px]">
                    The Wedding Vachan
                </span>
                <span className="mt-0.5 hidden overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.17em] text-ink-muted min-[430px]:block">
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
    const isActive = (href) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <header className="fixed inset-x-0 top-0 z-header h-header border-b border-gold/30 bg-ground/95 shadow-[0_3px_20px_rgba(42,27,18,0.05)] backdrop-blur-md">
            <div className="mx-auto flex h-full max-w-wide items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
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
                                    className={`inline-flex min-h-11 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors
                                        ${active ? 'bg-accent-wash text-accent-ink' : 'text-ink-secondary hover:bg-ground-sunk hover:text-ink'}`}>
                                    {item.label}
                                </Link>
                                {item.panel && openPanel === item.label && (
                                    <div className="absolute left-0 top-full pt-3" onMouseEnter={() => hold(item.label)} onMouseLeave={release}>
                                        <div className="min-w-[230px] rounded-panel border border-gold/35 bg-ground-raised p-2 shadow-overlay">
                                            {item.panel.map((sub) => (
                                                <Link key={sub.href} href={sub.href} onClick={() => setOpenPanel(null)}
                                                    className="flex min-h-11 flex-col justify-center rounded-control px-3 py-2 hover:bg-ground-sunk">
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
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                    {/* Below 420px the full label and the brand name cannot both fit, so
                        the button says "Quote"; its accessible name stays "Get Quote". */}
                    <Link href={PRIMARY_CTA.href} aria-label={PRIMARY_CTA.label}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-accent px-3.5 text-[12px] font-semibold text-ink-onAccent shadow-sm transition-colors hover:bg-accent-hover sm:gap-1.5 sm:px-5 sm:text-[13px]">
                        <span aria-hidden="true" className="min-[420px]:hidden">Quote</span>
                        <span aria-hidden="true" className="hidden min-[420px]:inline">{PRIMARY_CTA.label}</span>
                        <FiArrowUpRight aria-hidden="true" className="hidden h-4 w-4 min-[420px]:block" />
                    </Link>
                    <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}
                        className="grid h-11 w-11 place-items-center rounded-control text-ink hover:bg-ground-sunk lg:hidden">
                        <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]"><span className="h-px w-full bg-current"/><span className="h-px w-full bg-current"/><span className="h-px w-3/5 bg-current"/></span>
                    </button>
                </div>
            </div>
            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </header>
    );
}
