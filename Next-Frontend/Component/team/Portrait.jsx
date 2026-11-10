'use client';

/**
 * A team portrait that can come from either source:
 *   - `person.image`  a static import (lib/team.js) → next/image with its blur
 *   - `person.src`    an R2 upload (/api/team) → <img> with the webp srcset the
 *                     API returns, the blur painted underneath until it decodes
 *
 * Wrapped in a motion.div so a tile and the spotlight can share a layoutId.
 */
import Image from 'next/image';
import { motion } from 'framer-motion';

export const MORPH = { type: 'spring', bounce: 0.12, duration: 0.5 };

const srcSetOf = (variants = []) => variants.map((v) => `${v.url} ${v.width}w`).join(', ') || undefined;

export function PortraitImage({ person, sizes, className = '', priority = false }) {
    if (person.image) {
        return <Image src={person.image} alt="" fill placeholder="blur" sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
    }
    const best = person.variants?.find((v) => v.width >= 640)?.url || person.src;
    return (
        // eslint-disable-next-line @next/next/no-img-element -- R2 webp ladder with its own srcset
        <img src={best} srcSet={srcSetOf(person.variants)} sizes={sizes} alt="" decoding="async"
            loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined}
            style={person.blurDataURL ? { backgroundImage: `url(${person.blurDataURL})`, backgroundSize: 'cover' } : undefined}
            className={`absolute inset-0 h-full w-full object-cover ${className}`} />
    );
}

export default function Portrait({ person, layoutId, sizes, className = '', imgClass = '', priority }) {
    return (
        <motion.div layoutId={layoutId} transition={MORPH} className={`relative overflow-hidden bg-ground-deep ${className}`}>
            <PortraitImage person={person} sizes={sizes} className={imgClass} priority={priority} />
        </motion.div>
    );
}
