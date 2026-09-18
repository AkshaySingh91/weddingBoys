/**
 * PhotoGalleryBlock — renders image galleries with variant layouts.
 * Variants: masonry, grid-2, grid-3, carousel, full-bleed
 */
import Image from 'next/image';

export default function PhotoGalleryBlock({ node, template }) {
  // The node stores `items` (extensions/PhotoGallery.jsx). Reading `images`
  // meant this always saw an empty array and returned null, so every gallery
  // vanished between the editor and the page. `images` stays as a fallback for
  // any content authored before the fix.
  const images = node.attrs?.items || node.attrs?.images || [];
  const caption = node.attrs?.caption;

  if (!images.length) return null;

  /**
   * Never lay out more columns than there are images.
   *
   * A gallery with one image and `columns: 2` rendered that image at half
   * width — and inside a grid cell, at half of a half. That is exactly the
   * "left image randomly doesn't fill its cell" bug: the author reached for
   * Photo Gallery instead of Studio Image and got a quarter-width picture with
   * nothing explaining why. Clamping here fixes it for every gallery, in every
   * template, including the ones already saved.
   */
  const columns = Math.min(node.attrs?.columns || images.length, images.length);
  const declared = node.attrs?.layout || node.attrs?.variant;
  const variant = images.length === 1
    ? 'grid-1'
    : declared
      || (columns === 2 ? 'grid-2' : columns === 3 ? 'grid-3' : images.length === 2 ? 'grid-2' : 'grid-3');

  const isRealWedding = template === 'cinematic-real-wedding';

  // In Cinematic Real Wedding template: 2 images = luxury portrait duo
  if (isRealWedding && (variant === 'grid-2' || images.length === 2)) {
    return (
      <figure className="sm:">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {images.map((img, idx) => {
            const src = typeof img === 'string' ? img : img.src || img.url;
            const alt = (typeof img === 'object' ? img.alt || img.caption : '') || `Wedding portrait ${idx + 1}`;
            return (
              <div
                key={idx}
                className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden border border-[#E5DCD3] shadow-sm bg-[#FCEEE6] group"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            );
          })}
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-xs text-[#74583E] italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // In Cinematic Real Wedding template: 1 full-bleed image = panoramic ceremony frame
  if (isRealWedding && (variant === 'full-bleed' || images.length === 1)) {
    const single = images[0];
    const src = typeof single === 'string' ? single : single.src || single.url;
    const alt = (typeof single === 'object' ? single.alt || single.caption : '') || 'Wedding ceremony frame';
    return (
      <figure className="sm:">
        <div className="relative aspect-[16/8.5] sm:aspect-[16/7.5] rounded-2xl overflow-hidden border border-[#E5DCD3] shadow-sm bg-[#FCEEE6] group">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1240px) 100vw, 1240px"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-xs text-[#74583E] italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  const gridClasses = {
    // One image is one column. Falling through to grid-3 is what rendered a
    // single-image gallery at a third of the width.
    'grid-1': 'grid grid-cols-1 gap-3',
    'grid-2': 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    'grid-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
    'masonry': 'columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3',
    'carousel': 'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin scrollbar-thumb-studio-border',
    'full-bleed': 'flex flex-col gap-4',
  };

  return (
    <figure className="">
      <div className={gridClasses[variant] || gridClasses['grid-3']}>
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`overflow-hidden rounded-xl bg-studio-canvas ${
              variant === 'carousel' ? 'flex-shrink-0 w-[80vw] sm:w-[60vw] lg:w-[40vw] snap-center' :
              variant === 'masonry' ? 'break-inside-avoid' :
              ''
            }`}
          >
            <Image
              src={img.src || img.url || img}
              alt={img.alt || img.caption || ''}
              width={img.width || 800}
              height={img.height || 600}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
            {img.caption && (
              <p className="px-3 py-2 text-xs text-studio-inkMuted">{img.caption}</p>
            )}
          </div>
        ))}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-studio-inkMuted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
