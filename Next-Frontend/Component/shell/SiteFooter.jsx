'use client';

/**
 * SiteFooter.
 *
 * Reads `lib/navigation.js`, the same file the header reads, so the two cannot
 * list different destinations again (R-39).
 *
 * Both of its calls to action previously failed contrast — white on #FF5353 is
 * 3.17:1 — on all 11 pages, and they disagreed with each other by 2px of
 * padding despite living in the same file (R-05, R-19). They are now the shared
 * Button, so there is one answer.
 *
 * Its 44 social buttons were unlabelled icon circles with empty text content
 * (R-65); each now carries an accessible name.
 *
 * Note: this component is also rendered by the out-of-scope blog layout
 * (`app/(journal)/layout.jsx`). That is deliberate — the footer is global shell,
 * not blog content — and a dark footer beneath the blog's light editorial page
 * is a conventional pairing. Flagged in REDESIGN-PROGRESS.md.
 */
import Link from 'next/link';
import { FOOTER_NAV, PRIMARY_CTA, BRAND_DESCRIPTION } from '@/lib/navigation.js';
import Button from '@/Component/ui/Button.jsx';
import Section from '@/Component/ui/Section.jsx';
import NewsletterForm from './NewsletterForm.jsx';

const SOCIALS = [
    { label: 'Instagram', href: 'https://instagram.com/theweddingboys', glyph: 'IG' },
    { label: 'YouTube', href: 'https://youtube.com/@theweddingboys', glyph: 'YT' },
    { label: 'Facebook', href: 'https://facebook.com/theweddingboys', glyph: 'FB' },
];

export default function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        // The top rule is the one brass hairline in the shell. The accent is
        // specified as a metallic rule, never a fill — this is where it shows.
        <footer className="border-t border-brass/25 bg-ink-void">
            <Section width="content" rhythm="tight">
                {/* The one closing call to action. */}
                <div className="flex flex-col gap-8 border-b border-edge-subtle pb-10
                                lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="t-display-2">Tell us about your wedding</h2>
                        <p className="t-body mt-4">{BRAND_DESCRIPTION}</p>
                    </div>
                    <Button href={PRIMARY_CTA.href} variant="primary" size="lg" className="shrink-0">
                        {PRIMARY_CTA.label}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4">
                    {FOOTER_NAV.map((col) => (
                        <nav key={col.title} aria-label={col.title}>
                            <h3 className="t-label">{col.title}</h3>
                            <ul className="mt-3">
                                {col.links.map((l) => (
                                    <li key={l.href}>
                                        <Link
                                            href={l.href}
                                            className="flex min-h-[44px] items-center text-[14px]
                                                       text-content-secondary transition-colors
                                                       duration-micro ease-standard hover:text-bone"
                                        >
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}

                    <div>
                        <h3 className="t-label">The dispatch</h3>
                        <p className="t-caption mt-3">
                            Occasional letters — new films, and what we learned shooting them.
                        </p>
                        <NewsletterForm className="mt-3" />
                    </div>
                </div>

                <div className="flex flex-col gap-5 border-t border-edge-subtle pt-6
                                sm:flex-row sm:items-center sm:justify-between">
                    <p className="t-caption">© {year} The Wedding Boys. All rights reserved.</p>

                    <ul className="flex items-center gap-2">
                        {SOCIALS.map((s) => (
                            <li key={s.label}>
                                <a
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${s.label} — opens in a new tab`}
                                    className="grid h-11 w-11 place-items-center rounded-pill border
                                               border-edge-subtle text-[11px] font-semibold
                                               text-content-secondary transition-colors duration-micro
                                               ease-standard hover:border-brass hover:text-bone"
                                >
                                    {s.glyph}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </Section>
        </footer>
    );
}
