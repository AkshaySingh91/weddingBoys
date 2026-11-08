/**
 * The curated typography scale offered in the editor.
 *
 * Every value here already exists in tailwind.config.js. Offering the theme's
 * own values rather than a free-form picker is what keeps a post on-brand:
 * arbitrary fonts and hexes drift from the site over time, and a later theme
 * change cannot reach content with raw values baked into it.
 *
 * An Advanced control still allows an exact px/hex where a layout genuinely
 * needs one — the escape hatch, not the default path.
 */

/** Families registered in app/fonts.js and mapped in tailwind.config.js. */
export const FONT_FAMILIES = [
    { label: 'Body — Inter', value: 'var(--font-inter)', preview: 'Inter' },
    { label: 'Display — Playfair', value: 'var(--font-sans)', preview: 'Playfair Display' },
    { label: 'Editorial — DM Serif', value: 'var(--font-sans)', preview: 'DM Serif Display' },
    { label: 'Reading — Lora', value: 'var(--font-sans)', preview: 'Lora' },
    { label: 'Titling — Cinzel', value: 'var(--font-sans)', preview: 'Cinzel' },
    { label: 'Script — Great Vibes', value: 'var(--font-greatvibes)', preview: 'Great Vibes' },
];

/** Mirrors the desktop* fontSize scale in tailwind.config.js. */
export const FONT_SIZES = [
    { label: 'Caption', value: '14px' },
    { label: 'Small', value: '16px' },
    { label: 'Body', value: '18px' },
    { label: 'Body large', value: '20px' },
    { label: 'Lead', value: '22px' },
    { label: 'Heading small', value: '32px' },
    { label: 'Heading', value: '40px' },
    { label: 'Display', value: '48px' },
];

export const LINE_HEIGHTS = [
    { label: 'Tight', value: '1.2' },
    { label: 'Snug', value: '1.4' },
    { label: 'Normal', value: '1.6' },
    { label: 'Relaxed', value: '1.8' },
    { label: 'Loose', value: '2' },
];

export const LETTER_SPACINGS = [
    { label: 'Tight', value: '-0.02em' },
    { label: 'Normal', value: '0' },
    { label: 'Wide', value: '0.04em' },
    { label: 'Wider', value: '0.12em' },
];

/** The studio palette from tailwind.config.js `colors.studio`. */
export const TEXT_COLORS = [
    { label: 'Ink', value: '#1C1917' },
    { label: 'Secondary', value: '#44403C' },
    { label: 'Muted', value: '#78716C' },
    { label: 'Terracotta', value: '#A3603A' },
    { label: 'Terracotta dark', value: '#7C4524' },
    { label: 'Gold', value: '#C29555' },
    { label: 'Gold dark', value: '#966F33' },
];

export const HIGHLIGHT_COLORS = [
    { label: 'Terracotta', value: '#FAF1E6' },
    { label: 'Gold', value: '#FDF7EE' },
    { label: 'Canvas', value: '#F7F4EF' },
    { label: 'Mint', value: '#ECFDF5' },
    { label: 'Sky', value: '#EFF6FF' },
];

/** A value is "off-scale" when it came from the Advanced control. */
export const isCustom = (value, scale) =>
    Boolean(value) && !scale.some((o) => o.value === value);

/**
 * Clamp a line height to a value that cannot make text overlap itself.
 *
 * The custom leading field accepted anything, and a caption pair saved with
 * `0.5` rendered 17px glyphs into 8.5px lines — the two lines printed on top of
 * each other. That is not a layout the author can want; it is the field letting
 * them describe an impossible box.
 *
 * A unitless line height is a multiple of the font size, so anything below 1
 * guarantees overlap. Lengths (px/rem/em) are left alone apart from a floor,
 * because an author sizing a caption band in px is doing something deliberate
 * and only the degenerate values need refusing.
 *
 * Used by the editor control AND by the published blocks, so posts already
 * saved with a bad value render readably instead of needing a migration.
 */
export function cleanLineHeight(value) {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    // Unitless multiple — the common case.
    if (/^\d*\.?\d+$/.test(raw)) {
        const n = Number(raw);
        if (!Number.isFinite(n)) return null;
        return String(Math.min(4, Math.max(1, n)));
    }

    // A length. Keep the unit, floor the magnitude at something legible.
    const m = raw.match(/^(\d*\.?\d+)(px|rem|em)$/);
    if (m) {
        const n = Number(m[1]);
        const unit = m[2];
        const floor = unit === 'px' ? 8 : 0.5;
        if (!Number.isFinite(n) || n < floor) return null;
        return `${n}${unit}`;
    }

    // `normal`, `inherit` and anything unrecognised: let CSS decide.
    return raw === 'normal' ? 'normal' : null;
}
