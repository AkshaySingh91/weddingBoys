/**
 * Layout scales for the grid and container blocks.
 *
 * Same principle as typographyTokens.js: offer the theme's own values so a
 * layout cannot drift off-brand.
 *
 * Column widths are **integer ratio units**, not pixels and not a CSS string:
 * `[1, 2]` means the second column is twice the first, and renders as
 * `1fr 2fr`. `fr` distributes whatever space exists, so the ratio authored in a
 * ~900px editor holds at 1440px and at 375px alike — the editor's own width
 * never enters the stored value. The previous design measured pixels on drag and
 * saved `"66.43fr 33.57fr"`, which was fluid but meaningless to read back.
 *
 * The template reaches every render path as one inherited custom property,
 * `--wb-cols`, set on the grid: rows pick it up from a stylesheet rule rather
 * than being told, which matters because renderAst passes no parent context to
 * a block component. Verified that `--wb-cols` survives the HTML sanitiser.
 */

/** Units a drag redistributes across two adjacent columns. 12 divides well. */
export const RATIO_TOTAL = 12;

export const MAX_COLUMNS = 8;
export const MAX_ROWS = 50;

export const DEFAULT_COLS = [1, 1];

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * Reduce a ratio to its smallest whole terms: [4, 8] → [1, 2].
 *
 * Without this a drag leaves `[5, 7]` alone but turns a half-and-half grid into
 * `[6, 6]`, and the rail would report "6 : 6" for what the author sees as equal
 * columns. Normalising is what lets the UI name the ratio honestly.
 */
export function normaliseCols(cols) {
    const safe = (Array.isArray(cols) ? cols : DEFAULT_COLS)
        .map((n) => Math.max(1, Math.round(Number(n) || 1)));
    if (!safe.length) return [...DEFAULT_COLS];
    const divisor = safe.reduce((a, b) => gcd(a, b));
    return divisor > 1 ? safe.map((n) => n / divisor) : safe;
}

/** `[1, 2]` → `'1fr 2fr'`. */
export const templateFromCols = (cols) =>
    normaliseCols(cols).map((n) => `${n}fr`).join(' ');

/** Human ratio for the UI: `[1, 2]` → `'1 : 2'`. */
export const ratioLabel = (cols) => normaliseCols(cols).join(' : ');

/**
 * Borders that reach the published page.
 *
 * Distinct from the editor's dashed cell guides, which are authoring chrome and
 * never publish. Default `none` keeps an editorial text-beside-image spread
 * clean; `lines` and `boxed` exist because a pricing or comparison table needs
 * real rules to be readable.
 */
export const BORDERS = [
    { id: 'none', label: 'None' },
    { id: 'lines', label: 'Lines' },
    { id: 'boxed', label: 'Boxed' },
];

/**
 * What a multi-column grid does when there is no room for columns.
 *
 * Stacking is right for prose — a 67/33 text/image split is unreadable at 375px.
 * It is wrong for a table, where a 4-column row stacked into four rows loses the
 * correspondence between a value and its heading, so tables scroll instead.
 */
export const MOBILE = [
    { id: 'stack', label: 'Stack' },
    { id: 'scroll', label: 'Keep columns' },
];

/**
 * Row heights.
 *
 * The grid governs cells; without this nothing governs how tall a row is, so an
 * image's own pixels decided it — and this library is almost entirely portrait
 * (1440x1800, 2400x3000), which pushes everything after a two-image row off the
 * screen. A height here is what lets an author say "this section is this tall,
 * so the next one is still visible".
 *
 * Applied only at the column breakpoint. Below it cells are stacked, and three
 * of them crushed into 352px would be unreadable, so a stacked row is always
 * auto — see the `--wb-row-h` rules in globals.css.
 */
export const ROW_HEIGHTS = [
    { id: 'auto', label: 'Auto', len: null },
    { id: 'sm', label: 'Short', len: '14rem' },
    { id: 'md', label: 'Medium', len: '22rem' },
    { id: 'lg', label: 'Tall', len: '30rem' },
    { id: 'custom', label: 'Custom', len: null },
];

export function rowHeightLength(attrs = {}) {
    if (attrs.height === 'custom') {
        const px = Number(attrs.customHeight);
        return Number.isFinite(px) && px > 0 ? `${Math.round(px)}px` : null;
    }
    return ROW_HEIGHTS.find((h) => h.id === attrs.height)?.len ?? null;
}

/**
 * Media frames.
 *
 * A frame crops the image to a shape instead of letting its own aspect decide,
 * which is the only way two images side by side come out the same size when one
 * is portrait and the other landscape. `natural` is the default and is exactly
 * today's behaviour, so no existing post moves.
 *
 * `fill` takes the cell's whole height — it is the partner to a fixed row
 * height, and does nothing useful on its own in an auto row.
 */
export const MEDIA_FRAMES = [
    { id: 'natural', label: 'Natural', ratio: null },
    { id: '1-1', label: 'Square', ratio: '1 / 1' },
    { id: '4-3', label: 'Landscape 4:3', ratio: '4 / 3' },
    { id: '3-2', label: 'Landscape 3:2', ratio: '3 / 2' },
    { id: '16-9', label: 'Wide 16:9', ratio: '16 / 9' },
    { id: '3-4', label: 'Portrait 3:4', ratio: '3 / 4' },
    { id: '2-3', label: 'Portrait 2:3', ratio: '2 / 3' },
    { id: 'fill', label: 'Fill cell', ratio: null },
];

export const DEFAULT_FRAME = 'natural';

export const frameById = (id) =>
    MEDIA_FRAMES.find((f) => f.id === id) || MEDIA_FRAMES[0];

/**
 * Focal point for a cropped frame.
 *
 * Not polish. Cover-cropping a portrait to 16:9 takes the middle band, and in a
 * wedding library the middle band is a torso — the faces are at the top. Without
 * a focal point every cropped frame would need re-shooting rather than re-framing.
 */
export const FOCUS_POINTS = [
    { id: 'center', label: 'Centre', pos: 'center' },
    { id: 'top', label: 'Top', pos: 'top' },
    { id: 'bottom', label: 'Bottom', pos: 'bottom' },
    { id: 'left', label: 'Left', pos: 'left' },
    { id: 'right', label: 'Right', pos: 'right' },
];

export const DEFAULT_FOCUS = 'center';

/**
 * Where the visible part of a cropped image sits, as percentages.
 *
 * Five keyword presets were too coarse: cropping a portrait to a wide frame
 * left no way to say "a little lower than the top", so the crop was whatever
 * the preset happened to give. These are set by dragging the image itself.
 *
 * The old keywords still parse, mapping to the position each one meant, so
 * nothing already saved shifts.
 */
export const FOCUS_KEYWORD_XY = {
    center: { x: 50, y: 50 },
    top: { x: 50, y: 0 },
    bottom: { x: 50, y: 100 },
    left: { x: 0, y: 50 },
    right: { x: 100, y: 50 },
};

export const clampPercent = (n, fallback = 50) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : fallback;
};

/** Resolve focus from either the new percentages or a legacy keyword. */
export function focusPosition(attrs = {}) {
    if (attrs.focusX != null || attrs.focusY != null) {
        return `${clampPercent(attrs.focusX)}% ${clampPercent(attrs.focusY)}%`;
    }
    const kw = FOCUS_KEYWORD_XY[attrs.focus] || FOCUS_KEYWORD_XY.center;
    return `${kw.x}% ${kw.y}%`;
}

/**
 * Corner radius on the image itself.
 *
 * Needed because a photo has to be able to match whatever it sits in — a hard
 * edge inside a boxed table, a soft one in an editorial spread.
 */
export const MEDIA_RADII = [
    { id: 'none', label: 'Square', len: '0' },
    { id: 'sm', label: 'Soft', len: '0.375rem' },
    { id: 'md', label: 'Rounded', len: '0.75rem' },
    { id: 'lg', label: 'Large', len: '1.25rem' },
];

export const DEFAULT_MEDIA_RADIUS = 'md';

/**
 * Gaps carry a length as well as a class.
 *
 * The length is what reaches the page, as `--wb-gap`: rows, the column rail and
 * the divider overlay all resolve the same custom property, so a handle lands in
 * the centre of a gap without anything measuring pixels.
 */
export const GAPS = [
    { id: 'none', label: 'None', cls: 'gap-0', len: '0rem' },
    { id: 'sm', label: 'Tight', cls: 'gap-3', len: '0.75rem' },
    { id: 'md', label: 'Normal', cls: 'gap-6', len: '1.5rem' },
    { id: 'lg', label: 'Wide', cls: 'gap-10', len: '2.5rem' },
];

export const gapLength = (id) => GAPS.find((g) => g.id === id)?.len ?? '1.5rem';

export const ALIGNS = [
    { id: 'start', label: 'Top', cls: 'items-start' },
    { id: 'center', label: 'Middle', cls: 'items-center' },
    { id: 'stretch', label: 'Stretch', cls: 'items-stretch' },
];

/**
 * Container looks.
 *
 * Presets rather than six separate controls: one click gives a correct,
 * on-brand result, and the individual border/radius/shadow knobs sit behind
 * "Custom" for the rare case a design needs something else.
 */
export const CONTAINER_VARIANTS = [
    {
        id: 'plain',
        label: 'Plain',
        cls: '',
    },
    {
        id: 'card',
        label: 'Card',
        cls: 'rounded-xl border border-studio-border bg-white p-6 shadow-sm',
    },
    {
        id: 'outlined',
        label: 'Outlined',
        cls: 'rounded-xl border border-studio-borderStrong p-6',
    },
    {
        id: 'tinted',
        label: 'Tinted',
        cls: 'rounded-xl bg-studio-terracottaLight p-6',
    },
    {
        id: 'elevated',
        label: 'Elevated',
        cls: 'rounded-xl bg-white p-6 shadow-lg',
    },
];

export const variantById = (id) =>
    CONTAINER_VARIANTS.find((v) => v.id === id) || CONTAINER_VARIANTS[0];

export const PADDINGS = [
    { id: 'none', label: 'None', cls: 'p-0' },
    { id: 'sm', label: 'Small', cls: 'p-3' },
    { id: 'md', label: 'Medium', cls: 'p-6' },
    { id: 'lg', label: 'Large', cls: 'p-10' },
];

export const RADII = [
    { id: 'none', label: 'Square', cls: 'rounded-none' },
    { id: 'sm', label: 'Soft', cls: 'rounded-lg' },
    { id: 'md', label: 'Rounded', cls: 'rounded-xl' },
    { id: 'full', label: 'Pill', cls: 'rounded-[2rem]' },
];

export const SHADOWS = [
    { id: 'none', label: 'Flat', cls: 'shadow-none' },
    { id: 'sm', label: 'Subtle', cls: 'shadow-sm' },
    { id: 'md', label: 'Raised', cls: 'shadow-md' },
    { id: 'lg', label: 'Floating', cls: 'shadow-lg' },
];

export const BACKGROUNDS = [
    { id: 'none', label: 'None', cls: 'bg-transparent' },
    { id: 'surface', label: 'White', cls: 'bg-white' },
    { id: 'canvas', label: 'Canvas', cls: 'bg-studio-canvas' },
    { id: 'terracotta', label: 'Terracotta', cls: 'bg-studio-terracottaLight' },
    { id: 'gold', label: 'Gold', cls: 'bg-studio-goldLight' },
];

/**
 * The studio palette, as swatches.
 *
 * Offered first wherever a colour is chosen, with a custom hex beside it. The
 * fast path stays on-brand; the escape hatch exists because a design
 * occasionally needs a colour the theme never anticipated. Mirrors
 * `tailwind.config.js` → `theme.extend.colors.studio`.
 */
export const STUDIO_SWATCHES = [
    { id: 'surface', label: 'White', hex: '#FFFFFF' },
    { id: 'card', label: 'Card', hex: '#FCFAF7' },
    { id: 'canvas', label: 'Canvas', hex: '#F7F4EF' },
    { id: 'terracottaLight', label: 'Terracotta', hex: '#FAF1E6' },
    { id: 'goldLight', label: 'Gold', hex: '#FDF7EE' },
    { id: 'border', label: 'Border', hex: '#E5DCD3' },
    { id: 'borderStrong', label: 'Border strong', hex: '#C8B9AA' },
    { id: 'terracotta', label: 'Terracotta solid', hex: '#A3603A' },
    { id: 'obsidian', label: 'Obsidian', hex: '#1E1D1B' },
];

/** A hex colour, or '' — anything else is dropped rather than trusted. */
export const cleanHex = (v) => (/^#[0-9a-f]{3,8}$/i.test(String(v || '').trim()) ? String(v).trim() : '');

/**
 * A free CSS length from the author: a number with px, %, rem or vh.
 *
 * Returns '' for anything unparseable, so a half-typed value can never reach
 * the stylesheet as a broken declaration.
 */
export function cleanLength(v) {
    const raw = String(v ?? '').trim();
    if (!raw) return '';
    if (/^\d+(\.\d+)?$/.test(raw)) return `${raw}px`;          // a bare number means px
    return /^\d+(\.\d+)?(px|%|rem|em|vh|vw)$/.test(raw) ? raw : '';
}

const clsFrom = (scale, id, fallback = '') =>
    scale.find((o) => o.id === id)?.cls ?? fallback;

/**
 * Build the class list for a container.
 *
 * A preset wins outright; the individual knobs only apply to `custom`, so the
 * two cannot fight each other and produce something neither was designed for.
 */
export function containerClasses(attrs = {}) {
    if (attrs.variant && attrs.variant !== 'custom') return variantById(attrs.variant).cls;
    return [
        clsFrom(PADDINGS, attrs.padding, 'p-6'),
        clsFrom(RADII, attrs.radius, 'rounded-xl'),
        clsFrom(SHADOWS, attrs.shadow, 'shadow-none'),
        clsFrom(BACKGROUNDS, attrs.background, 'bg-transparent'),
        attrs.border && attrs.border !== 'none' ? 'border border-studio-border' : '',
    ].filter(Boolean).join(' ');
}

/**
 * A container's free-value overrides, as real CSS.
 *
 * The preset `variant` stays the fast path and supplies everything an author
 * does not set; these win where they are set. One function builds it for the
 * editor, the published page and the HTML cache, so a box cannot look like
 * three different boxes.
 *
 * Every value goes through `cleanLength` / `cleanHex` first, so a half-typed
 * entry becomes nothing rather than a broken declaration.
 */
export function containerStyle(attrs = {}) {
    const style = {};
    const w = cleanLength(attrs.width);
    const h = cleanLength(attrs.minHeight);
    const r = cleanLength(attrs.radiusValue);
    const bw = cleanLength(attrs.borderWidth);
    const bc = cleanHex(attrs.borderColor);
    const bg = cleanHex(attrs.bgColor);
    const pad = cleanLength(attrs.padValue);

    if (w) style.width = w;
    // A minimum, never a fixed height: a box that crops its own text is the
    // same mistake a fixed grid row made.
    if (h) style.minHeight = h;
    if (r) style.borderRadius = r;
    if (bw) { style.borderWidth = bw; style.borderStyle = 'solid'; }
    if (bc) { style.borderColor = bc; if (!bw) { style.borderWidth = '1px'; style.borderStyle = 'solid'; } }
    if (bg) style.backgroundColor = bg;
    if (pad) style.padding = pad;
    return style;
}

const CSS_PROP = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** The same overrides as a style attribute, for renderHTML. */
export const containerStyleString = (attrs = {}) =>
    Object.entries(containerStyle(attrs))
        .map(([k, v]) => `${CSS_PROP(k)}:${v}`)
        .join(';');

export const gapClass = (id) => clsFrom(GAPS, id, 'gap-6');
export const alignClass = (id) => clsFrom(ALIGNS, id, 'items-start');
