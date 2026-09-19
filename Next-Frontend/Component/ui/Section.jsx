/**
 * Section — the page rhythm.
 *
 * The audit found 25 distinct container max-widths and 41 spacing values, so
 * content's left edge moved between pages (R-63, R-15). Three widths and three
 * vertical rhythms, all from tokens.
 */
export default function Section({
    width = 'content', rhythm = 'normal', as: Tag = 'section',
    className = '', children, ...rest
}) {
    const WIDTHS = {
        prose: 'max-w-prose',
        content: 'max-w-content',
        wide: 'max-w-wide',
        bleed: 'max-w-none',
    };
    const RHYTHM = {
        tight: 'py-section-tight',
        normal: 'py-section',
        loose: 'py-section-loose',
        none: '',
    };
    // 16px from <main> + 24 here = a 40px page gutter at desktop. It was
    // lg:px-12, which put content 64px in before a band's own padding took
    // another 32 — 96px of inset before the first glyph.
    const gutter = width === 'bleed' ? '' : 'px-5 md:px-8 lg:px-6';

    return (
        <Tag className={`${RHYTHM[rhythm]} ${className}`} {...rest}>
            <div className={`mx-auto w-full ${WIDTHS[width]} ${gutter}`}>{children}</div>
        </Tag>
    );
}
