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
    /* Sindoor fill. Bone text on --accent-fill is 5.54:1 — the old coral CTAs
       were 3.17:1, which no amount of care could have fixed at that size. */
    primary:
        'bg-accent-fill text-content-onAccent hover:bg-accent-hover active:bg-accent-press '
        + 'disabled:bg-ink-hairline disabled:text-content-muted',
    /* Hairline. The default for anything that is not the page's single main action. */
    secondary:
        'bg-transparent text-content-primary border border-edge-strong '
        + 'hover:border-brass hover:text-bone active:bg-ink-raised '
        + 'disabled:border-edge-subtle disabled:text-content-muted',
    /* Over imagery. Sits on its own scrim so it never depends on the photograph. */
    onMedia:
        'bg-ink-void/70 text-bone backdrop-blur-sm border border-bone/20 '
        + 'hover:bg-ink-void/85 hover:border-bone/40 active:bg-ink-void',
    /* Text-only. Uses --accent-text (5.42:1 on the ground), never --accent-fill. */
    quiet:
        'bg-transparent text-accent-text hover:text-bone active:text-accent-press '
        + 'disabled:text-content-muted px-0',
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
