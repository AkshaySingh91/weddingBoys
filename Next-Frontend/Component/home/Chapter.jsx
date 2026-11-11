/**
 * Home kit — the frame and small parts every home section after the hero uses.
 *
 * Visual language (the studio's reference boards: app-grade cards on a website):
 *   - soft rounded cards (24–32px) floating on a warm ivory ground with quiet
 *     peach/gold glows behind them — never full-width boxed panels
 *   - glass overlays on photographs (frosted info bars, floating chips)
 *   - round ↗ buttons, pill chips with count badges, icon tiles
 *   - one wine-black card per bento where a section needs weight
 *   - headlines in the sans with one word in the display italic (<Em>)
 *
 * The thread that connects the page: every chapter opens with the same numbered
 * pill ("01 · Films"). Numbering is a CSS counter (`.chapters` on the page
 * wrapper, globals.css), so it follows whatever order the CMS sets.
 */
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';

/** One word of a headline in the display italic: <Em>films</Em>. */
export function Em({ children }) {
    return <em className="font-display font-medium italic tracking-normal text-accent-ink">{children}</em>;
}

const ARROW_TONES = {
    light: 'bg-ink/[0.05] text-ink group-hover:bg-ink group-hover:text-ground',
    glass: 'bg-white/90 text-ink group-hover:bg-white',
    accent: 'bg-accent text-ink-onAccent group-hover:bg-accent-hover',
    ink: 'bg-ink text-ground',
    onDeep: 'bg-ink-onDeep/10 text-ink-onDeep group-hover:bg-ink-onDeep group-hover:text-ground-deep',
};
const ARROW_SIZES = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };

/** Round ↗ badge. Decorative: the link around it carries the name. */
export function ArrowDot({ tone = 'light', size = 'md', className = '' }) {
    return (
        <span aria-hidden="true"
            className={`grid shrink-0 place-items-center rounded-full transition-colors duration-ui ease-standard ${ARROW_SIZES[size]} ${ARROW_TONES[tone]} ${className}`}>
            <FiArrowUpRight className="h-4 w-4 transition-transform duration-ui ease-standard group-hover:-translate-y-px group-hover:translate-x-px" />
        </span>
    );
}

/** Chip for use over photographs. Solid, not frosted: a backdrop-filter per chip
 *  made each one a GPU layer, and a page of them blanked tiles while scrolling. */
export function GlassChip({ children, className = '' }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-ink
                          shadow-[0_4px_14px_-6px_rgba(51,22,26,0.35)] ${className}`}>
            {children}
        </span>
    );
}

/** "View all ●↗" pill — the section-level action. */
export function ViewAll({ href, label = 'View all', className = '' }) {
    return (
        <Link href={href}
            className={`group inline-flex h-12 shrink-0 items-center gap-3 rounded-full bg-ground-raised pl-5 pr-1.5 text-[14px] font-semibold text-ink
                        ring-1 ring-ink/[0.07] shadow-[0_8px_20px_-14px_rgba(51,22,26,0.45)] transition-[box-shadow,transform] duration-ui ease-standard motion-safe:active:scale-[0.97]
                        hover:shadow-[0_12px_26px_-14px_rgba(51,22,26,0.55)] focus-ring ${className}`}>
            {label}
            <ArrowDot tone="accent" size="md" className="h-9 w-9" />
        </Link>
    );
}

/** Card surfaces. */
export const CARD = 'rounded-[28px] bg-ground-raised ring-1 ring-ink/[0.06] shadow-[0_14px_34px_-22px_rgba(51,22,26,0.35)]';
export const CARD_DEEP = 'rounded-[28px] bg-ground-deep text-ink-onDeep shadow-[0_22px_44px_-24px_rgba(51,22,26,0.7)]';
export const CARD_TINT = 'rounded-[28px] bg-gradient-to-br from-accent-tint via-accent-wash to-ground-raised ring-1 ring-accent/10';

/** Quiet warm glows behind a chapter — static and decorative. */
function Glow({ side }) {
    const left = side === 'left';
    return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <span className={`absolute top-16 h-[380px] w-[380px] rounded-full bg-accent-tint blur-[100px] ${left ? '-left-44' : '-right-44'}`} />
            <span className={`absolute -bottom-10 h-[300px] w-[300px] rounded-full bg-gold/20 blur-[100px] ${left ? 'right-[-120px]' : 'left-[-120px]'}`} />
        </span>
    );
}

export function ChapterHead({ label, title, lead, action, className = '' }) {
    return (
        <header className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
            <div className="min-w-0 max-w-2xl">
                <p data-rise="" style={{ '--d': 0 }} className="inline-flex items-center gap-2 rounded-full bg-ground-raised py-1 pl-1 pr-3.5 text-[12.5px] font-semibold text-ink
                              ring-1 ring-ink/[0.07] shadow-[0_4px_14px_-10px_rgba(51,22,26,0.4)]">
                    <span aria-hidden="true" className="chapter-no__n grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-[10.5px] tabular-nums text-ground" />
                    {label}
                </p>
                {title && (
                    <h2 data-rise="" style={{ '--d': 1 }} className="mt-4 text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[48px]">
                        {title}
                    </h2>
                )}
                {lead && <p data-rise="" style={{ '--d': 2 }} className="mt-3 max-w-lg text-[15.5px] leading-relaxed text-ink-secondary sm:text-[16px]">{lead}</p>}
            </div>
            {action && <ViewAll href={action.href} label={action.label} className="hidden sm:inline-flex" />}
        </header>
    );
}

/** The section action on phones, full width under the content. */
export function ChapterAction({ action, className = '' }) {
    if (!action) return null;
    return (
        <div className={`sm:hidden ${className}`}>
            <ViewAll href={action.href} label={action.label} className="w-full justify-between" />
        </div>
    );
}

export default function Chapter({ id, label, title, lead, action, glow, children, className = '', ...rest }) {
    return (
        <section id={id} className={`chapter relative isolate ${className}`} {...rest}>
            {glow && <Glow side={glow} />}
            <div className="mx-auto w-full max-w-wide px-5 py-12 sm:py-16 md:px-8 lg:px-6 lg:py-20">
                <ChapterHead label={label} title={title} lead={lead} action={action} />
                {children}
            </div>
        </section>
    );
}
