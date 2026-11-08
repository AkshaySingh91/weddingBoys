'use client';

/**
 * MobileMenu — the single navigation pattern below 1024px.
 *
 * Reads the same `lib/navigation.js` as the header and footer, so the three
 * surfaces cannot disagree (R-39).
 *
 * Focus is trapped while open and returned to the trigger on close; the page
 * behind is locked. None of that existed before — the previous menu was a
 * div that appeared beside an already-visible desktop nav.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FiChevronRight, FiInstagram, FiYoutube, FiFacebook } from 'react-icons/fi';
import { PRIMARY_NAV, PRIMARY_CTA, BRAND_TAGLINE } from '@/lib/navigation.js';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import Button from '@/Component/ui/Button.jsx';
import NavIcon from './NavIcon.jsx';
import { SOCIAL_LINKS } from '@/lib/siteConfig.js';

// Two Instagram accounts, so those two carry their city as visible text.
const SOCIALS = [
    { label: 'Instagram, Mumbai', place: 'Mumbai', href: SOCIAL_LINKS.instagramMumbai, Icon: FiInstagram },
    { label: 'Instagram, Varanasi', place: 'Varanasi', href: SOCIAL_LINKS.instagramVaranasi, Icon: FiInstagram },
    { label: 'YouTube', href: SOCIAL_LINKS.youtube, Icon: FiYoutube },
    { label: 'Facebook', href: SOCIAL_LINKS.facebook, Icon: FiFacebook },
];

export default function MobileMenu({ open, onClose }) {
    const { studioLogo } = useStudioDetails();
    const [failedLogo, setFailedLogo] = useState(null);
    const panelRef = useRef(null);
    const restoreTo = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        const panel = panelRef.current;
        const focusables = () => panel?.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [];

        // Move focus into the panel on the next frame, once it is painted.
        const raf = requestAnimationFrame(() => focusables()[0]?.focus());

        const onKey = (e) => {
            if (e.key !== 'Tab') return;
            const items = [...focusables()];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    // Rendered on <body>, not inside the header: the header's backdrop-filter makes it
    // the containing block for fixed children, which squeezed this full-screen menu
    // into the 72px header (links collapsed to nothing, page showing beneath).
    return createPortal(
        <div className="fixed inset-0 z-modal lg:hidden">
            <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="absolute inset-0 h-full w-full bg-ink/45 backdrop-blur-sm"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                /* Full width on a phone. A 380px panel on a 390px screen left a 10px
                   sliver of the page showing, which reads as a rendering fault rather
                   than a deliberate reveal. */
                className="absolute inset-y-0 right-0 flex w-full flex-col border-l
                           border-edge-subtle bg-ground sm:max-w-[400px]"
            >
                {/* The brand, not the word "Menu". A drawer that opens on a
                    label tells you where you are in the UI; one that opens on the
                    studio's mark tells you whose site you are in. */}
                <div className="flex items-center justify-between gap-3 border-b border-gold/30
                                bg-accent-tint px-5 py-4">
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill
                                         bg-ground-raised ring-1 ring-gold/60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={studioLogo && studioLogo !== failedLogo ? studioLogo : '/companyLogo.png'}
                                 onError={() => setFailedLogo(studioLogo)} alt=""
                                 className="h-full w-full rounded-pill object-contain p-1" />
                        </span>
                        <span className="flex min-w-0 flex-col leading-none">
                            <span className="font-display text-[16px] font-semibold tracking-[0.06em] text-accent-ink">
                                The Wedding Vachan
                            </span>
                            <span className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                                {BRAND_TAGLINE}
                            </span>
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="grid h-11 w-11 place-items-center rounded-control text-ink
                                   transition-colors duration-micro ease-standard hover:bg-ground-sunk"
                    >
                        <span aria-hidden="true" className="relative block h-4 w-4">
                            <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
                            <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
                        </span>
                    </button>
                </div>

                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                    {PRIMARY_NAV.map((item) => (
                        <div key={item.label} className="mb-1">
                            <Link
                                href={item.href}
                                onClick={onClose}
                                className="group flex min-h-[54px] items-center gap-3 rounded-control px-3
                                           transition-colors duration-micro ease-standard hover:bg-accent-wash"
                            >
                                <NavIcon name={item.icon} className="h-5 w-5 shrink-0 text-gold-strong" />
                                <span className="flex-1 font-display text-[19px] text-ink">{item.label}</span>
                                <FiChevronRight
                                    aria-hidden="true"
                                    className="h-4 w-4 shrink-0 text-ink-muted transition-transform
                                               duration-micro ease-standard group-hover:translate-x-0.5"
                                />
                            </Link>

                            {/* Sub-destinations hang off a gold thread with a node
                                at each stop — the ornament earns its place by
                                showing they belong to the item above. */}
                            {item.panel && (
                                <ul className="relative mb-2 ml-[34px] pl-4">
                                    <span
                                        aria-hidden="true"
                                        className="absolute left-0 top-2 bottom-2 w-px bg-gold/45"
                                    />
                                    {item.panel.map((sub) => (
                                        <li key={sub.href} className="relative">
                                            <span
                                                aria-hidden="true"
                                                className="absolute -left-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2
                                                           rotate-45 bg-gold"
                                            />
                                            <Link
                                                href={sub.href}
                                                onClick={onClose}
                                                className="flex min-h-[44px] items-center rounded-control px-2
                                                           text-[15px] text-ink-secondary transition-colors
                                                           duration-micro ease-standard
                                                           hover:bg-accent-wash hover:text-accent-ink"
                                            >
                                                {sub.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="border-t border-gold/30 bg-ground-sunk p-5">
                    <Button href={PRIMARY_CTA.href} variant="primary" size="lg"
                            className="w-full !rounded-pill" onClick={onClose}>
                        {PRIMARY_CTA.label}
                    </Button>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        {SOCIALS.map(({ label, place, href, Icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${label} — opens in a new tab`}
                                className={`flex h-11 items-center justify-center gap-2 rounded-pill border border-gold/40
                                           text-ink-secondary transition-colors duration-micro ease-standard
                                           hover:border-gold hover:bg-accent-wash hover:text-accent-ink
                                           ${place ? 'px-4 text-[13px] font-medium' : 'w-11'}`}
                            >
                                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                                {place && <span aria-hidden="true">{place}</span>}
                            </a>
                        ))}
                    </div>

                    <div className="rule-ornament mt-5" aria-hidden="true" />
                    <p className="mt-4 text-center text-[9.5px] font-semibold uppercase
                                  tracking-[0.18em] text-ink-muted">
                        Real people · Extraordinary stories
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}
