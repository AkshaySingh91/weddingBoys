'use client';

/**
 * Media — the only way imagery enters a public page.
 *
 * It exists to make four audit defects unreachable rather than merely
 * discouraged:
 *
 *  1. **Layout shift.** The frame owns an aspect ratio, so the box is reserved
 *     before a byte arrives. /team measured CLS 1.59 and /photos 1.70 (R-10,
 *     R-38) because nothing reserved space.
 *  2. **Pop-in.** Every image resolves from its own blur or dominant colour —
 *     the project already stores `blurDataURL` and `dominantColor` and the
 *     public site used neither (R-48, 0 `placeholder="blur"` site-wide).
 *  3. **Illegible overlays.** Text over an image must be passed as `overlay`,
 *     which forces a scrim token. 296 text-over-image instances existed with no
 *     scrim convention; five measured 1.0:1 (R-06).
 *  4. **Broken-image glyphs.** A failed load falls back to the dominant colour
 *     with the alt text kept for assistive technology.
 *
 * What it deliberately does NOT claim to fix: byte weight. `cloudflareLoader.js`
 * passes local `/`-prefixed sources through unresized, and with a custom loader
 * configured the built-in `/_next/image` endpoint is disabled — verified, it
 * returns 404. Local assets therefore have no variants at any size. That is an
 * asset-pipeline problem, not a component one (see REDESIGN-PROGRESS.md, R-14).
 */
import { useState } from 'react';
import Image from 'next/image';

/** Locked ratios. A context picks one; components never pass raw numbers. */
export const RATIOS = {
    hero: 'aspect-[16/9]',
    film: 'aspect-[16/9]',
    portrait: 'aspect-[4/5]',
    square: 'aspect-square',
    still: 'aspect-[3/2]',
    tall: 'aspect-[2/3]',
    fill: 'h-full w-full',
};

/** Scrim presets. `none` is only legal when nothing is laid over the image. */
const SCRIMS = {
    none: '',
    base: 'scrim-base',
    strong: 'scrim-strong',
    bottom: 'scrim-bottom',
    hero: 'scrim-hero',
};

export default function Media({
    src,
    alt = '',
    ratio = 'still',
    scrim = 'none',
    overlay,
    dominantColor,
    blurDataURL,
    priority = false,
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    focus,
    className = '',
    imgClassName = '',
    children,
    ...rest
}) {
    const [failed, setFailed] = useState(false);

    /*
      A scrim is mandatory when anything is laid over the image. This throws in
      development rather than shipping an illegible caption — the audit's single
      largest accessibility class was text placed on photographs and left to luck.
    */
    if (process.env.NODE_ENV !== 'production' && overlay && scrim === 'none') {
        throw new Error(
            '<Media overlay> requires a scrim. Pass scrim="bottom" | "hero" | "base" | "strong". '
            + 'See DESIGN-SYSTEM.md §3.3.',
        );
    }

    const ground = dominantColor || 'var(--ink-raised)';

    return (
        <div
            className={`relative overflow-hidden bg-ground-raised ${RATIOS[ratio]} ${className}`}
            style={{ backgroundColor: ground }}
            {...rest}
        >
            {!failed && src && (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    loading={priority ? undefined : 'lazy'}
                    onError={() => setFailed(true)}
                    className={`object-cover ${imgClassName}`}
                    style={focus ? { objectPosition: focus } : undefined}
                    {...(blurDataURL ? { placeholder: 'blur', blurDataURL } : {})}
                />
            )}

            {/* Failure is a quiet coloured plate, never a broken-image glyph. */}
            {failed && (
                <div className="absolute inset-0 grid place-items-center" style={{ backgroundColor: ground }}>
                    <span className="t-caption px-4 text-center">{alt || 'Image unavailable'}</span>
                </div>
            )}

            {scrim !== 'none' && (
                <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${SCRIMS[scrim]}`} />
            )}

            {overlay && <div className="absolute inset-0">{overlay}</div>}
            {children}
        </div>
    );
}
