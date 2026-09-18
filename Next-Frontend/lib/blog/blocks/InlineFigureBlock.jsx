/**
 * InlineFigureBlock — the public renderer for an inserted image.
 *
 * The editor's node is `inlineMedia` (extensions/InlineMedia.jsx). This block
 * previously read `variant`/`layout` and `title`, none of which that node
 * stores, and it was registered under `image` — a type the editor never emits.
 * The combined effect was that every inserted image reached the published page
 * as an empty <div>, silently, because renderAst degrades unknown types rather
 * than throwing.
 *
 * Attribute names here MUST track InlineMedia.addAttributes(). The contract
 * test in lib/blog/__tests__ guards the node NAME; these attrs are guarded by
 * the round-trip check in that same test.
 *
 * Two things changed when the grid arrived:
 *
 *   1. **Alignment is a class, not a Tailwind string.** `align: left|right`
 *      used to apply `float-left w-1/2 max-w-sm` here. Inside a 227px grid cell
 *      that is nonsense — a floated half-width image inside something that is
 *      already a column. The float variants now live in globals.css next to the
 *      editor's own `.inline-media-*` rules, which lets one rule neutralise them
 *      inside a cell for both render paths instead of two divergent copies.
 *
 *   2. **A frame can override the image's own shape.** Without it `h-auto` meant
 *      the file's pixels decided the height, so two images side by side came out
 *      ragged whenever their aspects differed — which, in a library that is
 *      almost entirely portrait, was always.
 */
import Image from 'next/image';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import {
    frameById, DEFAULT_FRAME, DEFAULT_FOCUS, DEFAULT_MEDIA_RADIUS, focusPosition,
} from '@/app/admin/(dashboard)/blogs/_components/layoutTokens.js';

const SIZES = {
    full: '(max-width: 1024px) 100vw, 1024px',
    center: '(max-width: 768px) 100vw, 768px',
    left: '(max-width: 640px) 100vw, 50vw',
    right: '(max-width: 640px) 100vw, 50vw',
};

export default function InlineFigureBlock({ node }) {
    const {
        src, alt, caption, subCaption = '', align = 'center', priority,
        width, height, aspectRatio, dominantColor, blurDataURL,
        frame = DEFAULT_FRAME, focus = DEFAULT_FOCUS,
        badge = '', badgeTone = 'neutral',
        radius = DEFAULT_MEDIA_RADIUS,
    } = node.attrs || {};

    if (!src) return null;

    /*
      Work out what gives the box its height, and never let the answer be
      "nothing" — an absolutely-positioned `fill` image inside a zero-height box
      is not a small image, it is an invisible one.

      `frameById` falls back to `natural` for an id it does not know, whose ratio
      is null. The old code asked `frame !== 'natural'` first, so an unrecognised
      id counted as cropped, took a null ratio, and skipped the intrinsic path as
      well — leaving a box with no height at all and a photograph that had
      loaded, measured 362px wide and rendered 0px tall.

      So the frame's own ratio decides whether this is a crop, not the spelling
      of its id.
    */
    const frameRatio = frame === 'natural' ? null : frameById(frame).ratio;
    const cropped = Boolean(frameRatio) || frame === 'fill';

    // The worker records real dimensions at ingest. Using them keeps the box
    // reserved before the bytes arrive, so the article does not reflow — but a
    // framed image takes its shape from the frame instead, and `fill` takes it
    // from whatever cell it is sitting in.
    const hasIntrinsic = Boolean(width && height) && !cropped;
    /*
      The height of last resort.

      `fill` is excluded because it is the one frame that genuinely means "take
      the cell's height", and the stylesheet gives it a floor. For everything
      else the box must end up with SOME height, so the chain runs: the frame's
      ratio → the shape the file actually is → 3:2. A photograph is never
      rendered into a zero-height box, whatever an id says.
    */
    const ratio = frame === 'fill'
        ? null
        : frameRatio || (hasIntrinsic ? null : (aspectRatio || '3 / 2'));

    return (
        <figure
            className={`inline-media inline-media-${align}`}
            data-align={align}
            data-frame={frame}
            data-focus={focus}
            data-badge-tone={badgeTone}
            data-radius={radius}
        >
            <div
                className="inline-media-frame relative overflow-hidden rounded-2xl bg-studio-canvas"
                style={{
                    ...(ratio ? { aspectRatio: ratio } : {}),
                    ...(dominantColor ? { backgroundColor: dominantColor } : {}),
                }}
            >
                <Image
                    src={src}
                    alt={alt || ''}
                    sizes={SIZES[align] || SIZES.center}
                    className={hasIntrinsic ? 'h-auto w-full object-cover' : 'object-cover'}
                    // The exact position the author dragged to, not one of five
                    // keywords, and applied whether or not there is an explicit
                    // frame — a fixed-height row crops just as a frame does.
                    // focusPosition falls back to the legacy keyword for posts
                    // that predate the percentages.
                    style={{ objectPosition: focusPosition(node.attrs) }}
                    {...(hasIntrinsic ? { width, height } : { fill: true })}
                    {...(priority ? { priority: true } : { loading: 'lazy' })}
                    {...(blurDataURL ? { placeholder: 'blur', blurDataURL } : {})}
                />
                {badge ? (
                    <span className="inline-media-badge" data-badge>
                        {badgeTone === 'positive' && <CheckCircle size={13} weight="fill" />}
                        {badgeTone === 'negative' && <XCircle size={13} weight="fill" />}
                        {badge}
                    </span>
                ) : null}
            </div>
            {(caption || subCaption) && (
                <figcaption className="mt-3 text-center font-sans">
                    {caption && (
                        <span className="inline-media-caption block text-sm text-studio-inkSecondary">
                            {caption}
                        </span>
                    )}
                    {/* The quieter second line: a credit, a location, a lens. */}
                    {subCaption && (
                        <span className="inline-media-subcaption mt-1 block text-xs text-studio-inkMuted">
                            {subCaption}
                        </span>
                    )}
                </figcaption>
            )}
        </figure>
    );
}
