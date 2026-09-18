'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';

/**
 * The admin's motion vocabulary, in one place.
 *
 * Every helper honours `prefers-reduced-motion` by collapsing to a zero-length
 * transition rather than by removing the animation — components stay identical,
 * so nothing can drift out of sync between the two modes.
 */

export const SPRING = { type: 'spring', stiffness: 300, damping: 30 };
export const SPRING_SOFT = { type: 'spring', stiffness: 210, damping: 26 };

/** Standard transition, flattened when the viewer asks for less motion. */
export function useMotionSafe(transition = SPRING) {
    const reduced = useReducedMotion();
    return reduced ? { duration: 0 } : transition;
}

/**
 * Staggered entrance for a grid or list.
 *
 * The stagger is capped so a 200-item grid does not take eight seconds to
 * finish revealing itself.
 */
export function Reveal({ children, index = 0, className, ...rest }) {
    const reduced = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { ...SPRING_SOFT, delay: Math.min(index * 0.018, 0.28) }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

/** A panel that slides in from the right edge. */
export function SlideOver({ open, children, className, ...rest }) {
    const reduced = useReducedMotion();
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={className}
                    initial={reduced ? false : { x: '100%' }}
                    animate={{ x: 0 }}
                    exit={reduced ? { opacity: 0 } : { x: '100%' }}
                    transition={reduced ? { duration: 0 } : SPRING}
                    {...rest}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Height/opacity collapse for banners and inline sections. */
export function Collapse({ open, children, className }) {
    const reduced = useReducedMotion();
    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    className={className}
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={reduced ? { duration: 0 } : { ...SPRING_SOFT, opacity: { duration: 0.15 } }}
                    style={{ overflow: 'hidden' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { motion, AnimatePresence };
