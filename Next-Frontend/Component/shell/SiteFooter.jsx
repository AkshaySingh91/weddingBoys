import Link from 'next/link';
import { FiArrowUpRight, FiInstagram, FiYoutube, FiFacebook } from 'react-icons/fi';
import { FOOTER_NAV, PRIMARY_CTA, BRAND_DESCRIPTION, BRAND_TAGLINE } from '@/lib/navigation.js';
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
        <footer className="border-t border-gold/35 bg-ground-deep text-ink-onDeep">
            <div className="mx-auto max-w-wide px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
                <div className="grid gap-8 border-b border-gold/25 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E9C99A]">Begin your story</p>
                        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">Every wedding deserves to be remembered beautifully.</h2>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E8D9C7]">Tell us what you are planning. We would love to hear about it.</p>
                    </div>
                    <Link href={PRIMARY_CTA.href}
                        className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-ink-onAccent transition-colors hover:bg-accent-hover">
                        {PRIMARY_CTA.label}<FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] lg:gap-8">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="font-display text-xl font-semibold tracking-wide">The Wedding Vachan</Link>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#E9C99A]">{BRAND_TAGLINE}</p>
                        <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#E8D9C7]">{BRAND_DESCRIPTION}</p>
                    </div>
                    {FOOTER_NAV.map((column) => (
                        <nav key={column.title} aria-label={column.title}>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E9C99A]">{column.title}</h3>
                            <ul className="mt-3 space-y-1">
                                {column.links.map((link) => <li key={link.href}>
                                    <Link href={link.href} className="inline-flex min-h-10 items-center text-[13px] text-[#E8D9C7] transition-colors hover:text-white">{link.label}</Link>
                                </li>)}
                            </ul>
                        </nav>
                    ))}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E9C99A]">The journal</h3>
                        <p className="mt-4 text-[13px] leading-relaxed text-[#E8D9C7]">Real weddings, places, and stories from behind the lens.</p>
                        <Link href="/blogs" className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-white underline decoration-gold/60 underline-offset-4 hover:decoration-white">
                            Read the journal <FiArrowUpRight aria-hidden="true" />
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col gap-5 border-t border-gold/25 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-[#E8D9C7]">© {new Date().getFullYear()} The Wedding Vachan. All rights reserved.</p>
                    <ul className="flex items-center gap-2">
                        {SOCIALS.map(({ label, place, href, Icon }) => <li key={label}>
                            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — opens in a new tab`}
                                className={`flex h-10 items-center justify-center gap-2 rounded-full border border-gold/35 text-[#E8D9C7] transition-colors hover:border-[#E9C99A] hover:text-white ${place ? 'px-3 text-xs' : 'w-10'}`}>
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
