import Link from 'next/link';
import { FiArrowUpRight, FiInstagram, FiYoutube, FiFacebook } from 'react-icons/fi';
import { FOOTER_NAV, BRAND_DESCRIPTION, BRAND_TAGLINE } from '@/lib/navigation.js';
import FooterCta from './FooterCta.jsx';
import { SOCIAL_LINKS } from '@/lib/siteConfig.js';

// Two Instagram accounts, so those two carry their city as visible text.
const SOCIALS = [
    { label: 'Instagram, Mumbai', place: 'Mumbai', href: SOCIAL_LINKS.instagramMumbai, Icon: FiInstagram },
    { label: 'Instagram, Varanasi', place: 'Varanasi', href: SOCIAL_LINKS.instagramVaranasi, Icon: FiInstagram },
    { label: 'YouTube', href: SOCIAL_LINKS.youtube, Icon: FiYoutube },
    { label: 'Facebook', href: SOCIAL_LINKS.facebook, Icon: FiFacebook },
];

export default function SiteFooter() {
    return (
        // relative + z-10: pages with a sticky or fixed hero must never paint over the footer.
        <footer className="relative z-10 bg-ground-deep text-ink-onDeep">
            <div className="mx-auto max-w-wide px-5 pb-8 pt-12 sm:px-8 lg:px-12 lg:pb-10 lg:pt-16">
                {/* Call to action, as a card — not on /contact itself. */}
                <FooterCta />

                <div className="grid grid-cols-2 gap-x-6 gap-y-9 py-12 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] lg:gap-8">
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="font-display text-xl font-semibold tracking-wide">The Wedding Vachan</Link>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-gold">{BRAND_TAGLINE}</p>
                        <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-onDeep/70">{BRAND_DESCRIPTION}</p>
                    </div>
                    {FOOTER_NAV.map((column) => (
                        <nav key={column.title} aria-label={column.title} className="min-w-0">
                            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">{column.title}</h3>
                            <ul className="mt-2">
                                {column.links.map((link) => <li key={link.href}>
                                    <Link href={link.href} className="inline-flex min-h-10 items-center text-[14px] text-ink-onDeep/75 transition-colors hover:text-ink-onDeep">{link.label}</Link>
                                </li>)}
                            </ul>
                        </nav>
                    ))}
                    <div className="min-w-0">
                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">The journal</h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-ink-onDeep/75">Real weddings, places and stories from behind the lens.</p>
                        <Link href="/blogs" className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-ink-onDeep underline decoration-gold/60 underline-offset-4 hover:decoration-ink-onDeep">
                            Read the journal <FiArrowUpRight aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-5 border-t border-ink-onDeep/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-ink-onDeep/60">© {new Date().getFullYear()} The Wedding Vachan. All rights reserved.</p>
                    <ul className="flex flex-wrap items-center gap-2">
                        {SOCIALS.map(({ label, place, href, Icon }) => <li key={label}>
                            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — opens in a new tab`}
                                className={`flex h-10 items-center justify-center gap-2 rounded-xl border border-ink-onDeep/15 text-ink-onDeep/80 transition-colors hover:border-ink-onDeep/40 hover:text-ink-onDeep focus-ring ${place ? 'px-3 text-[13px]' : 'w-10'}`}>
                                <Icon aria-hidden="true" className="h-4 w-4" />
                                {place && <span aria-hidden="true">{place}</span>}
                            </a>
                        </li>)}
                    </ul>
                </div>
            </div>
        </footer>
    );
}
