// These local releases keep the page usable until the first R2 release is published.
// The player requests them on demand; these paths are not eagerly preloaded.
export const localSequences = {
  hero: {
    frameCount: 150,
    width: 1364,
    height: 768,
    focalX: 0.5,
    focalY: 0.5,
    posterUrl: '/varanasi-frames-2/webp/varanasi-frames_001.webp',
    tiers: [{ label: 'local', everyNth: 1, padTo: 3, indexOffset: 1,
      keyPattern: '/varanasi-frames-2/webp/varanasi-frames_{index}.webp', width: 1364, height: 768 }],
  },
  director: {
    frameCount: 146,
    width: 1600,
    height: 900,
    focalX: 0.5,
    focalY: 0.5,
    posterUrl: '/director-frames/Timeline_1_001.webp',
    tiers: [{ label: 'local', everyNth: 1, padTo: 3, indexOffset: 1,
      keyPattern: '/director-frames/Timeline_1_{index}.webp', width: 1600, height: 900 }],
  },
};
