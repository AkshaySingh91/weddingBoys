'use client';

/** The footer's call to action — hidden on /contact, where it would point at itself. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiArrowUpRight } from 'react-icons/fi';
import { PRIMARY_CTA } from '@/lib/navigation.js';
import { contactHref } from '@/lib/contact.js';

export default function FooterCta() {
    const pathname = usePathname();
    if (pathname === '/contact') return null;
    return (
            <div className="flex flex-col gap-5 rounded-2xl border border-ink-onDeep/10 bg-ink-onDeep/[0.04] p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Begin your story</p>
                    <h2 className="mt-2 max-w-2xl text-balance font-display text-[26px] leading-tight sm:text-4xl">
                        Every wedding deserves to be remembered beautifully.
                    </h2>
                    <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-onDeep/70">Tell us what you are planning. We would love to hear about it.</p>
                </div>
                <Link href={contactHref({ from: 'footer' })}
                    className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[14px] font-semibold text-ink-onAccent transition-colors hover:bg-accent-hover focus-ring sm:w-fit">
                    {PRIMARY_CTA.label}<FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
            </div>
    );
}
