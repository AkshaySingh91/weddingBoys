'use client';

/**
 * Moments We've Captured.
 *
 * Colour, background and ornament are untouched: the `#FFDCCC → #FFF0E6`
 * gradient, both henna borders, the florals, garland, golden swirl, particles
 * and every red and gold are exactly what they were.
 *
 * Fixed here:
 *  - The hover scrim had the gradient classes but **no `inset-0`**, so it
 *    measured 0×0 and never painted. White caption text sat on bare photographs
 *    (the R-06 class of defect). Its colours are unchanged — it simply has a box
 *    now.
 *  - `max-w-7xl -mx-4` with no `mx-auto`: the container was left-aligned and
 *    pulled 16px further left, putting the heading at x=32 while the rest of the
 *    page sits at 64.
 *  - The grid ran 1 column until 1024px, then jumped straight to 4. Tablets got
 *    a single column of eight photographs, which is most of why this was the
 *    tallest section on the page.
 *  - The skeleton drew `aspect-square` tiles against real `h-64 lg:h-80` ones,
 *    so the grid resized the moment data arrived — a skeleton causing the exact
 *    layout shift skeletons exist to prevent.
 *  - `setPortfolio(data.photos)` with no fallback: a failed response set state
 *    to `undefined` and the next `.map` threw.
 *  - Category switching had no `AbortController`, so a slow earlier request
 *    could overwrite a newer one.
 *  - Filter buttons were 36px, carried no `aria-pressed`, and had no padding at
 *    all below 640px.
 *  - All eight images were `loading="eager"` well below the fold.
 *  - Five `repeat: Infinity` animations ran regardless of reduced-motion.
 *  - `key={index}` across an `AnimatePresence` category swap reused DOM nodes
 *    for different photographs.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import FilterRail from "@/Component/ui/FilterRail.jsx";
import Chapter, { ChapterAction, Em, ArrowDot } from "@/Component/home/Chapter.jsx";

const GALLERY = { href: "/photos", label: "Full gallery" };
import Link from "next/link";
import Swal from "sweetalert2";

// Fallback only: the tabs come from the page composition (Admin › Content › Home,
// each a photo row in Admin › Rows). These are used when the CMS is unreachable.
const categories = ["All Work", "Wedding", "Pre-Wedding", "Garden", "Haldi"];
const api_url = process.env.NEXT_PUBLIC_API_URL;

/* The tiles must match the real grid and the real tile height exactly, or the
   skeleton itself causes layout shift. */
/* Below sm this is a swipe rail, not a stack: eight photographs at full
   width ran 3.6 screens on a phone. From sm up it is the grid. The rail
   bleeds right only so its left edge stays on the section axis, and
   scroll-pl mirrors that padding — without it snap-mandatory parks the
   first tile flush and eats the inset. */
/* A photo bento: the first photograph leads at double size, the rest tile two
   across on a phone (five shown there; all from sm), four across at lg. */
const GRID_CLASS = "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4";
/* Skeleton tiles only. */
const TILE_WIDTH = "w-full";
const TILE_HEIGHT = "h-64 lg:h-80";

const PortfolioSkeleton = () => (
    <div className="space-y-8" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading photographs</span>
        <div className="flex justify-center gap-2 overflow-hidden">
            {categories.map((c) => (
                <div key={c} className="h-10 w-24 shrink-0 bg-primary/20 rounded-full animate-pulse" />
            ))}
        </div>
        <div className={GRID_CLASS}>
            {[...Array(8)].map((_, i) => (
                <div key={i} className={`${TILE_HEIGHT} ${TILE_WIDTH} bg-primary/20 rounded-xl animate-pulse`} />
            ))}
        </div>
    </div>
);

// Random values are generated client-side only (post-mount) so server and
// client markup match on first paint — Math.random() during render would
// otherwise produce a hydration mismatch under Next.js SSR (see
// Component/Background.jsx for the established fix pattern).
export default function OurPortfolio({ data } = {}) {
    // Composed on the server: each tab is a resolved photo row, so switching tabs
    // needs no request. Without it, the grid fetches per category as before.
    const tabs = Array.isArray(data?.tabs) && data.tabs.length ? data.tabs : null;
    const tabNames = tabs ? tabs.map((t) => t.title) : categories;
    const firstTab = tabNames[0];
    const [activeCategory, setActiveCategory] = useState(firstTab);
    const [portfolio, setPortfolio] = useState(tabs ? tabs[0].items : []);
    const [isLoading, setIsLoading] = useState(!tabs);
    const chooseCategory = (c) => {
        setActiveCategory(c);
        if (tabs) setPortfolio(tabs.find((t) => t.title === c)?.items || []);
    };
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (tabs) return undefined; // composed on the server
        // Without this, switching category twice quickly lets the slower first
        // response land last and show the wrong set.
        const controller = new AbortController();

        const fetchPortfolio = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(
                    `${api_url}/api/home/sample-photos?category=${activeCategory}`,
                    { signal: controller.signal },
                );
                const data = await res.json();
                if (res.status >= 300) {
                    Swal.fire({
                        toast: true,
                        position: 'top-right',
                        icon: 'error',
                        title: data.message,
                        timer: 1500,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });
                }
                // A failed response has no `photos`; without the fallback this
                // set state to undefined and the next render threw on .map.
                setPortfolio(Array.isArray(data?.photos) ? data.photos : []);
            } catch (error) {
                if (error.name === 'AbortError') return;
                setPortfolio([]);
                Swal.fire({
                    toast: true,
                    position: 'top-right',
                    icon: 'error',
                    title: error.message,
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        fetchPortfolio();
        return () => controller.abort();
    }, [activeCategory, tabs]);

    return (
        <Chapter id="ourPortfolio" label="Photographs" glow="left" action={GALLERY}
            title={<>Moments we&apos;ve <Em>kept</Em></>}
            lead={data?.heading && !/moments we/i.test(data.heading) ? data.heading : 'Candids, portraits and rituals from across India.'}>
                <div className="mt-7">
                    {/* Category Filter — one swipeable line on phones. */}
                    <FilterRail
                        label="Filter photographs by category"
                        options={tabs ? tabs.map((t) => ({ value: t.title, label: t.title, count: t.items?.length ?? 0 })) : tabNames}
                        value={activeCategory}
                        onChange={chooseCategory}
                        align="start"
                        className="mb-6"
                    />

                    {/* Portfolio Grid */}
                    {isLoading ? (
                        <PortfolioSkeleton />
                    ) : portfolio.length === 0 ? (
                        /* There was no empty state at all: an empty category
                           rendered a blank grid and no way forward. */
                        <div className="text-center py-12">
                            <p className="text-tertiary_on">
                                No photographs in {activeCategory === firstTab ? "this gallery" : `“${activeCategory}”`} yet.
                            </p>
                            <button
                                type="button"
                                onClick={() => chooseCategory(firstTab)}
                                className="mt-3 min-h-[44px] px-4 text-sm font-semibold text-accent-ink hover:text-ink transition-colors"
                            >
                                Show all work
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategory}
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={reduceMotion ? undefined : { opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={GRID_CLASS}
                            >
                                {/* Five tile cleanly at every width (one 2×2 lead + four); the rest are a tap away. */}
                                {portfolio.slice(0, 5).map((item, index) => (
                                    <motion.div
                                        key={item._id ?? item.url ?? index}
                                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                                        className={`group relative overflow-hidden rounded-[28px] bg-ground-sunk shadow-[0_18px_36px_-24px_rgba(51,22,26,0.6)]
                                                    ${index === 0 ? 'col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto' : 'aspect-[4/5]'}
`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.url} alt={`${item.client?.Bride} & ${item.client?.Groom}`} loading="lazy" decoding="async"
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-media ease-entrance group-hover:scale-[1.04]" />
                                        <span className="absolute right-2.5 top-2.5"><ArrowDot tone="glass" size="sm" /></span>
                                        <span className="absolute inset-x-2 bottom-2 rounded-[20px] bg-white/80 px-3 py-2 backdrop-blur-md">
                                            <span className="block truncate text-[13.5px] font-semibold text-ink">
                                                {[item.client?.Bride, item.client?.Groom].filter(Boolean).join(' & ')}
                                            </span>
                                            {item.photoLocation?.city && <span className="block truncate text-[12px] text-ink-muted">{item.photoLocation.city}</span>}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    <ChapterAction action={GALLERY} className="mt-6" />
                </div>
        </Chapter>
    );
}
