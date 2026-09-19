import ScrollOnTop from '@/Component/ScrollOnTop.jsx';
import SiteHeader from '@/Component/shell/SiteHeader.jsx';
import SiteFooter from '@/Component/shell/SiteFooter.jsx';

/**
 * Public site shell.
 *
 * Three changes from the layout this replaces:
 *
 * 1. `<Background />` is gone. It shipped a truncated base64 placeholder —
 *    `url('data:image/png;base64,iVBORw0KGgo...')`, with the ellipsis literally
 *    in the source — which threw ERR_INVALID_URL on every page load, and it ran
 *    18 infinite Framer Motion loops site-wide for a film-grain texture that had
 *    never once rendered (R-22, R-32). Nothing replaces it: on a near-black
 *    ground the photographs are the texture.
 *
 * 2. A real `<header>` and `<main>` landmark, and a skip link. The masthead was
 *    a `<div>`, so 10 of 11 pages had no banner landmark and no page offered a
 *    way past ~45 tab stops (R-30).
 *
 * 3. `pt-header` replaces the old `pt-[6rem]` magic number, and `overflow-hidden`
 *    on `<main>` becomes `overflow-x-clip`.
 *
 *    This matters more than it looks. `overflow: hidden` creates a scroll
 *    container, which silently breaks `position: sticky` for every descendant —
 *    and it was hiding real layout bugs rather than fixing them. `clip` prevents
 *    horizontal scroll without creating that container, so sticky works and the
 *    guard stays.
 *
 *    Removing it revealed that the home page overflows its viewport by 16px at
 *    390px wide; `/contact` and the rest measure clean. The audit's "zero
 *    horizontal overflow on every page" was therefore partly an artefact of this
 *    rule. The guard keeps it off the user's screen; the underlying 16px is
 *    recorded against Stage 2.
 */
export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink-void text-content-primary antialiased">
      <ScrollOnTop />

      <a href="#main" className="skip-link">Skip to content</a>

      <SiteHeader />

      {/*
        `main` always fills at least the viewport below the header.

        Without this, a page whose content is client-fetched renders an empty
        main, the footer sits at y=96 inside the viewport, and the arriving
        content shoves it down — a large, visible layout shift. Measured on
        /films: footer top moved 96px -> 1097px at ~330ms, CLS 0.62. /weddings
        showed 0.71 and /team 0.84 from the same cause.

        This is the same defect class the audit attributed to the footer (R-10);
        the footer was never the cause, only the largest thing that moved.
        Reserving the viewport keeps it below the fold until real content
        arrives, and off-screen movement does not count toward CLS.

        Note the underscores: Tailwind turns `_` into a space, and
        `calc(100svh-var(...))` without spaces around the minus is invalid CSS
        that the browser drops silently — the first attempt did exactly that and
        the rule never applied.
      */}
      <main
        id="main"
        className="pt-header overflow-x-clip min-h-[calc(100svh_-_var(--header-height))]"
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
