/**
 * Fonts.
 *
 * Two families carry the public site: Bodoni Moda for display, Inter for
 * everything else. See DESIGN-SYSTEM.md §4.
 *
 * Five more stay declared because the blog/editorial system and its admin editor
 * — both out of scope for this redesign — depend on them. The editor's font
 * picker offers Playfair, DM Serif, Lora, Cinzel and Great Vibes, so posts
 * already published may use any of them; deleting a family would break existing
 * content rather than merely restyle it.
 *
 * They are declared with `preload: false`. The variables are still available, so
 * nothing blog-side changes, but the browser now fetches a face only when CSS
 * actually matches an element to it — which on a public page is never. Baseline:
 * 8 families, 48 @font-face rules, 12 files and 352 KB downloaded on the home
 * page to render two.
 *
 * Removed outright: Oxygen and Lato — zero references anywhere, including the
 * editor.
 */
import { Inter, Bodoni_Moda, Playfair_Display, Lora, Great_Vibes, DM_Serif_Display, Cinzel } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Display face.
 *
 * A didone's hairlines are the risk on a near-black ground: too thin and they
 * shimmer or vanish. Three guards, all binding — the `opsz` axis is loaded so
 * small optical sizes thicken the strokes, the .t-display-* roles pin
 * font-weight to 500, and no role uses this face below 28px.
 */
export const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  display: 'swap',
  // `axes` requires the variable weight range, so weights are not pinned here —
  // next/font rejects `axes` alongside an explicit `weight` list. The ≥500 floor
  // is enforced where it belongs: the .t-display-* roles in globals.css.
  axes: ['opsz'],
  variable: '--font-display',
});

/* ── Out of scope: blog + admin editor only, never preloaded ───────────────
   `next/font` statically analyses these call sites at build time, so each
   options object must be a literal — a shared spread fails to compile. */
export const playfair = Playfair_Display({
  subsets: ['latin'], display: 'swap', preload: false, variable: '--font-playfair',
});

export const lora = Lora({
  subsets: ['latin'], display: 'swap', preload: false, variable: '--font-lora',
});

export const greatVibes = Great_Vibes({
  subsets: ['latin'], display: 'swap', preload: false, weight: '400', variable: '--font-greatvibes',
});

export const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'], display: 'swap', preload: false, weight: '400', variable: '--font-dmserif',
});

export const cinzel = Cinzel({
  subsets: ['latin'], display: 'swap', preload: false, variable: '--font-cinzel',
});

export const fontVariables = [
  inter.variable,
  bodoni.variable,
  playfair.variable,
  lora.variable,
  greatVibes.variable,
  dmSerifDisplay.variable,
  cinzel.variable,
].join(' ');
