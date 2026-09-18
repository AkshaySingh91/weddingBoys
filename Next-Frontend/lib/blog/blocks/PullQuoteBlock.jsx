/**
 * PullQuoteBlock — large editorial pull-quote with serif font and terracotta accent.
 * Variants: default (centered), with-attribution (includes author name).
 */
export default function PullQuoteBlock({ node, children }) {
  const variant = node.attrs?.variant || 'default';
  const attribution = node.attrs?.attribution || '';

  return (
    <figure className="px-4 sm:px-8 lg:px-16">
      <div className="relative">
        {/* Decorative quote mark */}
        <span
          className="absolute -left-2 -top-6 font-playfair text-7xl leading-none text-studio-terracotta/15 select-none sm:-left-6 sm:text-8xl"
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <blockquote className="relative z-10 border-none pl-0 text-center font-playfair text-xl italic leading-relaxed text-studio-ink sm:text-2xl lg:text-3xl lg:leading-snug">
          {children}
        </blockquote>
      </div>
      {variant === 'with-attribution' && attribution && (
        <figcaption className="mt-4 text-center text-sm font-sans font-medium text-studio-inkMuted">
          <span className="inline-block h-px w-8 bg-studio-terracotta/40 align-middle mr-3" />
          {attribution}
          <span className="inline-block h-px w-8 bg-studio-terracotta/40 align-middle ml-3" />
        </figcaption>
      )}
    </figure>
  );
}
