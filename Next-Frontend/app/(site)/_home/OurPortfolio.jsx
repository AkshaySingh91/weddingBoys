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
import Link from "next/link";
import Swal from "sweetalert2";
import Section from "@/Component/ui/Section.jsx";

const categories = ["All Work", "Wedding", "Pre-Wedding", "Garden", "Haldi"];
const api_url = process.env.NEXT_PUBLIC_API_URL;

/* The tiles must match the real grid and the real tile height exactly, or the
   skeleton itself causes layout shift. */
/* Below sm this is a swipe rail, not a stack: eight photographs at full
   width ran 3.6 screens on a phone. From sm up it is the grid. The rail
   bleeds right only so its left edge stays on the section axis, and
   scroll-pl mirrors that padding — without it snap-mandatory parks the
   first tile flush and eats the inset. */
const GRID_CLASS =
    "flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-none pb-2 "
    + "-mr-5 pr-5 scroll-pl-0 "
    + "sm:mr-0 sm:pr-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible "
    + "md:grid-cols-3 lg:grid-cols-4 lg:gap-8";
/* Rail tiles need an explicit width; grid cells must not keep it. */
const TILE_WIDTH = "w-[78vw] shrink-0 snap-start sm:w-auto sm:shrink";
const TILE_HEIGHT = "h-64 lg:h-80";

const PortfolioSkeleton = () => (
    <div className="space-y-8" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading photographs</span>
        <div className="flex flex-wrap justify-center gap-4">
            {categories.map((c) => (
                <div key={c} className="h-11 w-24 bg-primary/20 rounded-full animate-pulse" />
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
function makeHennaFlorals() {
    return Array.from({ length: 6 }, (_, i) => ({
        key: `henna-${i}`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        rotate: Math.random() * 360,
        duration: 10 + i * 2,
    }));
}

function makeParticles() {
    return Array.from({ length: 8 }, () => ({
        initialX: Math.random() * 100,
        animX0: Math.random() * 10,
        animX1: Math.random() * 10 + 10,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 2,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
    }));
}

export default function OurPortfolio() {
    const [activeCategory, setActiveCategory] = useState("All Work");
    const [portfolio, setPortfolio] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hennaFlorals, setHennaFlorals] = useState(null);
    const [particles, setParticles] = useState(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        // Decorative. Under reduced motion they are never created.
        if (reduceMotion) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHennaFlorals(makeHennaFlorals());
        setParticles(makeParticles());
    }, [reduceMotion]);

    useEffect(() => {
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
    }, [activeCategory]);

    /** An always-on loop, or nothing at all. */
    const loop = (animate, transition) =>
        reduceMotion ? {} : { animate, transition: { ...transition, repeat: Infinity } };

    return (
        <Section width="wide" rhythm="tight" id="ourPortfolio" aria-labelledby="portfolio-heading">
            <div className="py-10 px-5 sm:px-7 lg:py-12 bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden lg:rounded-3xl sm:rounded-lg shadow-lg">

                {/* henna top border */}
                <div className="absolute top-0 left-0 w-full" aria-hidden="true">
                    <svg viewBox="0 0 1440 320" className="w-full">
                        <path
                            fill="#FF6969"
                            fillOpacity="0.1"
                            d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                        ></path>
                    </svg>
                </div>
                {/* Henna-inspired bottom Border */}
                <div className="absolute bottom-0 left-0 w-full opacity-10 transform rotate-180" aria-hidden="true">
                    <svg viewBox="0 0 1440 120" className="w-full">
                        <path fill="#FF6969" d="M0,120 C200,80 400,40 720,40 C1040,40 1240,80 1440,120 L1440,0 L0,0 Z"
                            stroke="#FFD700" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                </div>
                {/* Floating Florals */}
                <div className="absolute top-4 left-4 w-16 h-16 opacity-20" aria-hidden="true">
                    <motion.svg
                        {...loop({ rotate: [0, 15, 0] }, { duration: 8 })}
                        viewBox="0 0 24 24"
                    >
                        <path fill="#FFD700" d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2zm0 18c-3 0-6-3-6-6s3-6 6-6 6 3 6 6-3 6-6 6z" />
                        <path fill="#FF6969" d="M12 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
                    </motion.svg>
                </div>
                <motion.div
                    {...loop({ rotate: [-5, 5, -5] }, { duration: 8 })}
                    className="absolute top-20 right-0 w-48 opacity-15"
                    aria-hidden="true"
                >
                    <svg viewBox="0 0 100 40">
                        <path fill="none" stroke="#FF6969" strokeWidth="2"
                            d="M0,20 Q20,0 40,20 T80,20 T120,20"
                            strokeDasharray="4 4" />
                        <circle cx="10" cy="20" r="3" fill="#FFD700" />
                        <circle cx="30" cy="20" r="3" fill="#FFD700" />
                        <circle cx="50" cy="20" r="3" fill="#FFD700" />
                        <circle cx="70" cy="20" r="3" fill="#FFD700" />
                    </svg>
                </motion.div>
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    {hennaFlorals?.map((floral) => (
                        <motion.div
                            key={floral.key}
                            className="absolute w-32 h-32 opacity-10"
                            style={{
                                left: floral.left,
                                top: floral.top,
                                rotate: floral.rotate,
                            }}
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: floral.duration, repeat: Infinity }}
                        >
                            <svg viewBox="0 0 100 100">
                                <path fill="none" stroke="#FF6969" strokeWidth="2"
                                    d="M20,80 Q40,60 60,80 T100,80 M30,70 Q50,50 70,70" />
                            </svg>
                        </motion.div>
                    ))}
                </div>
                {/* Animated Golden Swirl */}
                <motion.div
                    {...loop({ rotate: 360 }, { duration: 20, ease: "linear" })}
                    className="absolute -right-24 -top-24 w-48 h-48 opacity-10"
                    aria-hidden="true"
                >
                    <svg viewBox="0 0 100 100">
                        <path
                            fill="none"
                            stroke="#FFD700"
                            strokeWidth="2"
                            d="M50,5a45,45 0 1,0 0,90a45,45 0 1,0 0,-90"
                            pathLength="1"
                            strokeDasharray="0.1 0.9"
                            strokeLinecap="round"
                        />
                    </svg>
                </motion.div>
                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    {particles?.map((particle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                            initial={{ y: 0, x: particle.initialX }}
                            animate={{
                                y: [0, 100, 0],
                                x: [particle.animX0, particle.animX1]
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay
                            }}
                            style={{
                                left: particle.left,
                                top: particle.top
                            }}
                        />
                    ))}
                </div>

                {/* Was `max-w-7xl -mx-4` with no mx-auto: left-aligned inside the
                    section and dragged a further 16px out of it. */}
                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center mb-8 lg:mb-10">
                        <span className="text-desktopBodySmall uppercase tracking-widest bg-red-100 rounded-md px-2 py-1 text-red-400">
                            Our portfolio
                        </span>
                        <h2
                            id="portfolio-heading"
                            className="t-display-2 mx-auto mt-4"
                        >
                            Moments We&apos;ve Captured
                        </h2>
                        <p className="sm:text-mobileBodyLarge lg:text-desktopBodyLarge text-tertiary_on mt-4 max-w-2xl mx-auto">
                            Browse our collection of wedding stories from across Mumbai and beyond, showcasing our artistic approach to wedding photography and cinematography.
                        </p>
                    </div>

                    {/* Category Filter */}
                    <div
                        role="group"
                        aria-label="Filter photographs by category"
                        className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 lg:mb-10"
                    >
                        {categories.map((category) => {
                            const on = activeCategory === category;
                            return (
                                <motion.button
                                    key={category}
                                    type="button"
                                    aria-pressed={on}
                                    whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                                    whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                                    className={`min-h-[44px] px-4 py-2 text-sm rounded-full transition-colors ${on
                                        ? "bg-secondary_on/20 text-primary"
                                        : "bg-secondary_on/10 text-tertiary_on hover:bg-primary_on/20"
                                        }`}
                                    onClick={() => setActiveCategory(category)}
                                >
                                    {category}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Portfolio Grid */}
                    {isLoading ? (
                        <PortfolioSkeleton />
                    ) : portfolio.length === 0 ? (
                        /* There was no empty state at all: an empty category
                           rendered a blank grid and no way forward. */
                        <div className="text-center py-12">
                            <p className="text-tertiary_on">
                                No photographs in {activeCategory === "All Work" ? "this gallery" : `“${activeCategory}”`} yet.
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveCategory("All Work")}
                                className="mt-3 min-h-[44px] px-4 text-sm font-semibold text-red-400 hover:text-red-500 transition-colors"
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
                                {portfolio.map((item, index) => (
                                    <motion.div
                                        key={item._id ?? item.url ?? index}
                                        initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`relative group overflow-hidden rounded-xl shadow-xl ${TILE_WIDTH}`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.url}
                                            alt={`${item.client?.Bride} & ${item.client?.Groom}`}
                                            className={`w-full ${TILE_HEIGHT} object-cover transform transition-transform duration-500 group-hover:scale-105`}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        {/* `inset-0` is the whole fix: this had the
                                            gradient but no box, measured 0×0, and
                                            never painted — so the caption below sat
                                            on the bare photograph. */}
                                        <div
                                            aria-hidden="true"
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <h3 className="text-desktopBodyLarge font-bold">{item.client?.Bride} & {item.client?.Groom}</h3>
                                            <p className="text-mobileBodySmall">{item.photoLocation?.city}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* View All CTA */}
                    <div className="text-center mt-12">
                        <Link
                            href="/photos"
                            className="inline-flex items-center gap-2 min-h-[44px] text-desktopBodyMedium text-tertiary_on hover:text-secondary_on transition-colors"
                        >
                            Explore Complete Gallery
                            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </Section>
    );
}
