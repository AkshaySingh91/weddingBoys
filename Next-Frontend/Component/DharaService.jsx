'use client';

/**
 * Dharaa Event Management — the sub-brand block on the home page.
 *
 * Colour, background and ornament are deliberately untouched: the `#FFEFE4`
 * ground, the `#FF6969` particles, the henna wave and the amber accents are all
 * exactly as they were. What changed is structure, type, spacing and motion.
 *
 *  - Heading order ran h2, h2, h1, h2. The `<h1>` sat in the middle of the page
 *    and was one of the four the home page carried (audit R-42). It is now
 *    h2 (the sub-brand) → h3 → h3, which is a legal outline.
 *  - "EventManagement" was missing its word space.
 *  - `tracking-widest` on the lockup spread the brand name past legibility.
 *  - Two `repeat: Infinity` animations — 15 floating particles and 5 pulsing
 *    tick icons — ran regardless of `prefers-reduced-motion`. They still run for
 *    everyone else; nothing was removed.
 *  - On desktop the heading was left-aligned while the service list underneath
 *    was centred, so the column had two axes.
 *  - The CTA was 36px tall against a 44px floor.
 *  - A bare `<div>`, so the block was not a landmark and its heading had no
 *    region; and it sat off the page's content axis.
 */
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import dharaaStoryImg from '@/Asset/Dharaa/Client2.webp';
import dharaaLogo from '@/Asset/Dharaa/Logo.png';
import Section from '@/Component/ui/Section.jsx';

// Service data to be displayed
const dharaaServices = [
    "Comprehensive Event Planning",
    "Thematic Decor & Design",
    "Vendor & Venue Management",
    "Day-of Coordination",
    "Budget Management & Consulting",
];

// `react-responsive` is not installed in this project; this is a minimal
// SSR-safe stand-in for `useMediaQuery({ maxWidth })` (defaults to `false`
// on the server/first paint, then syncs on the client after mount so it
// never causes a hydration mismatch).
function useIsBelowWidth(maxWidth) {
    const [isBelow, setIsBelow] = useState(false);

    useEffect(() => {
        const query = window.matchMedia(`(max-width: ${maxWidth}px)`);
        const update = () => setIsBelow(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, [maxWidth]);

    return isBelow;
}

// Random values are generated client-side only (post-mount) so server and
// client markup match on first paint — Math.random() during render would
// otherwise produce a hydration mismatch under Next.js SSR (see
// Component/Background.jsx for the established fix pattern).
function makeParticles() {
    return Array.from({ length: 15 }, () => ({
        initialY: Math.random() * 100,
        initialX: Math.random() * 100,
        animX: Math.random() * 50 - 25,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 2,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
    }));
}

export default function DharaaStory() {
    const isMobile = useIsBelowWidth(640);
    const reduceMotion = useReducedMotion();
    const [particles, setParticles] = useState(null);

    useEffect(() => {
        // The particles are decorative. Under reduced motion they are simply
        // never created, rather than created and then animated anyway.
        if (reduceMotion) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setParticles(makeParticles());
    }, [reduceMotion]);

    /** Entrance animations, skipped wholesale under reduced motion. */
    const rise = reduceMotion
        ? {}
        : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 1 } };
    const slideIn = reduceMotion
        ? {}
        : {
            initial: { opacity: 0, x: isMobile ? 0 : 50 },
            whileInView: { opacity: 1, x: 0 },
            transition: { duration: 1 },
        };

    return (
        <Section width="wide" rhythm="tight" aria-labelledby="dharaa-heading">
            <div className="bg-[#FFEFE4] relative overflow-hidden w-full lg:rounded-3xl shadow-lg sm:rounded-lg">
                {/* Floating Particles Background */}
                <div className="absolute inset-0 pointer-events-none">
                    {particles?.map((particle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                            initial={{
                                y: particle.initialY,
                                x: particle.initialX,
                                scale: 0,
                            }}
                            animate={{
                                y: [0, -100],
                                x: [0, particle.animX],
                                scale: [0, 1, 0],
                                rotate: 360,
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay,
                                ease: "linear",
                            }}
                            style={{
                                left: particle.left,
                                top: particle.top,
                            }}
                        />
                    ))}
                </div>

                {/* Henna Pattern Accent */}
                <div className="absolute top-0 left-0 w-full">
                    <svg viewBox="0 0 1440 320" className="w-full" aria-hidden="true">
                        <path
                            fill="#FF6969"
                            fillOpacity="0.1"
                            d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                        ></path>
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-5 py-10 sm:px-7 md:py-12 relative">
                    {/* Brand lockup. `tracking-widest` (0.1em) was pulling the
                        wordmark apart; the name is the point, not the spacing. */}
                    <div className="flex flex-row items-center justify-center gap-4">
                        <Image
                            src={dharaaLogo}
                            alt=""
                            aria-hidden="true"
                            sizes="(max-width: 768px) 56px, 112px"
                            className="w-14 h-14 md:h-28 md:w-28 object-contain flex-shrink-0"
                        />
                        <h2
                            id="dharaa-heading"
                            className="font-display text-[26px] md:text-[34px] font-semibold text-gray-900 leading-tight tracking-wide"
                        >
                            {/* The space is load-bearing: `block` breaks the
                                line visually but text content concatenates, so
                                without it the accessible name is
                                "DharaaEvent Management". */}
                            Dharaa{' '}
                            <span className="block">Event Management</span>
                        </h2>
                    </div>

                    <div className="mt-10 flex flex-col lg:flex-row-reverse lg:items-start gap-10">
                        {/* Right Column: Image & Stats */}
                        <div className="w-full lg:w-2/5 relative">
                            <motion.div {...slideIn} className="relative">
                                <Image
                                    src={dharaaStoryImg}
                                    alt="Beautifully decorated event space"
                                    sizes="(max-width: 1024px) 100vw, 40vw"
                                    className="rounded-t-lg shadow-lg w-full h-64 md:h-72 object-cover relative z-10"
                                />
                            </motion.div>

                            {/* Statistics Overlay */}
                            <div
                                className="bg-white rounded-b-lg shadow-lg px-2 py-4 mt-0 flex justify-evenly items-center relative z-20"
                            >
                                <p className="text-center text-md px-3 text-gray-600">Our Clients</p>
                            </div>
                        </div>

                        {/* Left Column: Story Content */}
                        <div className="w-full lg:w-3/5 relative text-center lg:text-left">
                            <motion.div {...rise} className="md:mt-6 lg:mt-0 sm:px-2 lg:px-0">
                                {/* Was an <h1> in the middle of the page. */}
                                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 relative z-10">
                                    Crafting Your Perfect Event
                                    <motion.div
                                        initial={reduceMotion ? false : { scaleX: 0 }}
                                        whileInView={reduceMotion ? undefined : { scaleX: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="w-32 sm:w-48 h-1 bg-amber-500 mt-2 rounded-full mx-auto lg:mx-0"
                                        style={{ originX: 0 }}
                                    />
                                </h3>

                                <div className="relative">
                                    <p className="text-sm sm:text-base text-left text-gray-700 mb-6 relative z-10 leading-relaxed">
                                        Under the guidance of our trusted parent company, <b>Wedding Boys</b>, Dharaa Event Management is a new name in event planning. We&apos;re bringing the same passion and expertise that made them a success to all of your special moments. With a decade of experience from our parent company, we&apos;re ready to make your vision a beautiful reality.
                                    </p>
                                </div>

                                {/* Services List */}
                                <h4 className="text-base sm:text-lg font-bold mb-3 text-gray-900 relative z-10">
                                    Our Services Include
                                </h4>
                                {/* The list read `text-left lg:text-center` under a
                                    `lg:text-left` heading, so the column had two
                                    axes on desktop. One axis now. */}
                                <ul className="text-gray-700 mb-8 space-y-2.5 relative z-10 text-left">
                                    {dharaaServices.map((service) => (
                                        <motion.li
                                            key={service}
                                            className="flex items-start gap-2"
                                            whileHover={reduceMotion ? undefined : { x: 10 }}
                                        >
                                            <motion.span
                                                animate={reduceMotion ? undefined : { scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-amber-500 flex-shrink-0 mt-1"
                                            >
                                                <FaCheckCircle aria-hidden="true" />
                                            </motion.span>
                                            {service}
                                        </motion.li>
                                    ))}
                                </ul>

                                {/* CTA Button — was 36px tall against a 44px floor. */}
                                <Link
                                    href="/dharaa-event-management"
                                    className="bg-amber-600 text-white font-bold min-h-[44px] py-2 px-6 rounded-xl shadow-lg hover:bg-amber-700 transition-colors duration-300 relative inline-flex items-center z-10"
                                >
                                    Learn More About Us
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
