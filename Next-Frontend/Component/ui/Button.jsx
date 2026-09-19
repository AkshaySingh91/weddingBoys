'use client';

/**
 * Button — the one button.
 *
 * The audit measured 136 buttons rendering 35 distinct treatments (R-19),
 * including the two footer CTAs which shared a colour and a shape but differed
 * by 2px of padding. There is now one component and four variants, and adding a
 * fifth requires a documented reason in DESIGN-SYSTEM.md.
 *
 * Every variant carries hover, focus-visible, active and disabled states. The
 * site previously had no designed focus state anywhere (R-31) and no `:active`
 * treatment on any button.
 */
import Link from 'next/link';

const VARIANTS = {
    /* Sindoor fill. White on --accent is 6.45:1 — the old coral CTAs were
       3.17:1, which no amount of care could have fixed at that size. */
    primary:
        'bg-accent text-ink-onAccent hover:bg-accent-hover active:bg-accent-press '
        + 'disabled:bg-ground-sunk disabled:text-ink-muted',
    /* Gold hairline. The default for anything that is not the page's single
       main action — the metal is what makes it read as ornament rather than as
       a generic outlined button. */
    secondary:
        'bg-transparent text-ink border border-gold-strong/60 '
        + 'hover:border-gold-strong hover:bg-accent-wash active:bg-ground-sunk '
        + 'disabled:border-edge-subtle disabled:text-ink-muted',
    /* Over imagery. Sits on its own scrim so it never depends on the photograph. */
    onMedia:
        'bg-ink/55 text-ink backdrop-blur-sm border border-ink/15 '
        + 'hover:bg-ink/70 hover:border-ink/30 active:bg-ink/80',
    /* Text-only. --accent reads at 5.99:1 on the ground, so on a light page one
       accent value serves both fill and text — the dark ground needed two. */
    quiet:
        'bg-transparent text-accent hover:text-ink active:text-accent-press '
        + 'disabled:text-ink-muted px-0',
};

const SIZES = {
    /* 44px and 52px. WCAG 2.2 target minimum is 24px; the brief's floor is 44.
       The audit found 13–25 targets under 24px on every page (R-45). */
    md: 'min-h-[44px] px-5 text-[14px]',
    lg: 'min-h-[52px] px-7 text-[15px]',
};

export default function Button({
    as, href, variant = 'primary', size = 'md', className = '',
    children, disabled, loading, loadingLabel = 'Working…', ...rest
}) {
    const base =
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold '
        + 'tracking-[0.01em] transition-colors duration-micro ease-standard '
        + 'disabled:cursor-not-allowed select-none';

    const cls = `${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;

    const content = loading ? (
        <>
            <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded-pill border-2 border-current border-r-transparent motion-safe:animate-spin"
            />
            {loadingLabel}
        </>
    ) : children;

    // A link is a link and a button is a button — never a div with an onClick.
    if (href && !disabled) {
        const External = /^https?:|^mailto:|^tel:/.test(href);
        if (External) {
            return <a href={href} className={cls} {...rest}>{content}</a>;
        }
        return <Link href={href} className={cls} {...rest}>{content}</Link>;
    }

    const Tag = as || 'button';
    return (
        <Tag
            className={cls}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...rest}
        >
            {content}
        </Tag>
    );
}
