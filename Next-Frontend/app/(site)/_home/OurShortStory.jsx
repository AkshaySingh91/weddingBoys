'use client';

/**
 * Our Story.
 *
 * Colour, background and ornament are deliberately untouched: the
 * `#FFDCCC → #FFF0E6` gradient, the particles, henna wave, sparkles, garland,
 * floating camera, saree drape, rings, gold underline and every red are exactly
 * what they were. What changed is structure, motion and target sizes.
 *
 *  - `<h1>` mid-page ("Professional Wedding Storytellers") — one of the four the
 *    home page carried (audit R-42). Now h2, with "Our Core Values" as h3.
 *  - A bare `<div>`: no landmark, no region for the heading, and off the page's
 *    content axis.
 *  - NINE `repeat: Infinity` animations plus six entrance animations ran
 *    regardless of `prefers-reduced-motion`. All guarded. Nothing removed for
 *    anyone who has not asked for it.
 *  - The image was animated twice — the wrapper and the `<img>` each carried
 *    `initial={{ opacity: 0, x: -50 }}`, so it travelled 100px and double-faded.
 *  - The CTA was 36px tall against a 44px floor.
 *  - The ❤️ in the eyebrow was announced by screen readers as "red heart".
 */
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaCheckCircle, FaStar } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import img from "@/Asset/Home/homepage_short_story.jpg";
import Section from "@/Component/ui/Section.jsx";

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

function makeSparkles() {
  return Array.from({ length: 4 }, () => ({
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 1,
    left: `${Math.random() * 80 + 10}%`,
    top: `${Math.random() * 80 + 10}%`,
  }));
}

function makeRings() {
  return Array.from({ length: 2 }, (_, i) => ({
    delay: i * 1.5,
    left: `${i * 40 + 10}%`,
    top: `${i * 30 + 20}%`,
  }));
}

const CORE_VALUES = [
  "Artistic excellence in every frame",
  "Unobtrusive approach to capture genuine moments",
  "Deep cultural understanding of wedding traditions",
  "Personalized service for every couple",
  "Innovation with cutting-edge technology",
];

const STATS = [
  { number: 500, label: "Weddings" },
  { number: 200, label: "Pre-Weddings" },
  { number: 5, label: "Years" },
];

export default function OurStory() {
  const isMobile = useIsBelowWidth(640);
  const reduceMotion = useReducedMotion();
  const [particles, setParticles] = useState(null);
  const [sparkles, setSparkles] = useState(null);
  const [rings, setRings] = useState(null);

  useEffect(() => {
    // Purely decorative. Under reduced motion they are never created rather
    // than created and then animated anyway.
    if (reduceMotion) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(makeParticles());
    setSparkles(makeSparkles());
    setRings(makeRings());
  }, [reduceMotion]);

  /** Entrance animations, skipped wholesale under reduced motion. */
  const rise = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 1 } };
  const slideIn = reduceMotion
    ? {}
    : {
      initial: { opacity: 0, x: isMobile ? 0 : -50 },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: 1 },
    };
  const fadeIn = reduceMotion
    ? {}
    : { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 1, delay: 0.5 } };

  /** An always-on loop, or nothing at all. */
  const loop = (animate, transition) =>
    reduceMotion ? {} : { animate, transition: { ...transition, repeat: Infinity } };

  return (
    <Section width="wide" rhythm="tight" aria-labelledby="our-story-heading">
      <div className="bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden w-full lg:rounded-3xl sm:rounded-lg">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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
        <div className="absolute top-0 left-0 w-full" aria-hidden="true">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path
              fill="#FF6969"
              fillOpacity="0.1"
              d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-5 py-10 sm:px-7 md:py-12 relative">
          <div className="flex flex-col lg:flex-row lg:items-start gap-10">
            {/* Left Column: Image with Stats Overlay */}
            <div className="w-full lg:w-2/5 relative">
              <motion.div {...slideIn} className="relative">
                {/* Floating Sparkles on Image */}
                <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
                  {sparkles?.map((sparkle, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 sm:w-4 sm:h-4"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: [0, -40],
                        rotate: 360,
                      }}
                      transition={{
                        duration: sparkle.duration,
                        repeat: Infinity,
                        delay: sparkle.delay,
                      }}
                      style={{
                        left: sparkle.left,
                        top: sparkle.top,
                      }}
                    >
                      <FaStar className="w-full h-full text-[#FFD700]/40" />
                    </motion.div>
                  ))}
                </div>

                {/* The wrapper above already carries the slide-in; this element
                    carried an identical one, so the image travelled 100px and
                    faded twice. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt="Wedding celebration captured beautifully"
                  loading="lazy"
                  decoding="async"
                  className="rounded-t-lg shadow-lg w-full h-64 md:h-72 object-cover bg-top relative z-10"
                />
              </motion.div>

              {/* Floating Garland Connector */}
              {!isMobile && (
                <motion.div
                  {...loop({ x: [0, 10, 0] }, { duration: 3, ease: "easeInOut" })}
                  className="absolute bottom-0 left-0 w-full flex justify-center"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 500 50" className="w-full">
                    <path
                      fill="none"
                      stroke="#FF6969"
                      strokeWidth="2"
                      d="M0,25 Q250,0 500,25 T1000,25"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Statistics Overlay */}
              <motion.div
                {...fadeIn}
                className="bg-white rounded-b-lg shadow-lg px-2 py-4 mt-0 flex justify-evenly items-center relative z-20"
              >
                {STATS.map(({ number, label }) => (
                  <motion.div
                    key={label}
                    whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                    className="text-center px-3"
                  >
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {number}+
                    </p>
                    <p className="text-xs text-gray-600">{label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Column: Story Content */}
            <div className="w-full lg:w-3/5 relative">
              {/* Floating Camera Icon as Decoration (hidden on mobile) */}
              {!isMobile && (
                <motion.div
                  {...loop({ y: [0, -20, 0] }, { duration: 4 })}
                  className="absolute -top-6 right-0 text-[#FF6969]/20"
                  aria-hidden="true"
                >
                  <FiCamera className="w-16 h-16 sm:w-24 sm:h-24" />
                </motion.div>
              )}

              {/* Animated Saree Drape Accent */}
              {!isMobile && (
                <motion.div
                  {...loop({ x: [0, -20, 0] }, { duration: 6, ease: "easeInOut" })}
                  className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-30"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path
                      d="M10,10 Q50,0 90,10 T90,90 Q50,100 10,90 Z"
                      fill="#FF6969"
                      fillOpacity="0.1"
                    />
                  </svg>
                </motion.div>
              )}

              <motion.div {...rise} className="md:mt-6 lg:mt-0 sm:px-2 lg:px-0">
                <p className="text-red-600 uppercase text-xs sm:text-sm font-bold mb-3 tracking-wider px-2 py-1 rounded-md bg-red-100 inline-block relative z-10">
                  <motion.span
                    {...loop({ rotate: [0, 15, 0] }, { duration: 8 })}
                    className="mr-2 inline-block"
                    aria-hidden="true"
                  >
                    ❤️
                  </motion.span>
                  Our Story
                </p>

                {/* Was an <h1> in the middle of the page. */}
                <h2
                  id="our-story-heading"
                  className="t-display-2 mb-4 text-primary relative z-10"
                >
                  Professional Wedding Storytellers
                  <motion.div
                    initial={reduceMotion ? false : { scaleX: 0 }}
                    whileInView={reduceMotion ? undefined : { scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-32 sm:w-48 h-1 bg-[#FFD700] mt-2 rounded-full"
                    style={{ originX: 0 }}
                    aria-hidden="true"
                  />
                </h2>

                {/* Content Paragraph with Floating Rings Decoration */}
                <div className="relative">
                  {rings?.map((ring, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear",
                        delay: ring.delay,
                      }}
                      style={{
                        left: ring.left,
                        top: ring.top,
                      }}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 50 50"
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      >
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          stroke="#FFD700"
                          strokeWidth="2"
                          fill="none"
                        />
                        <circle
                          cx="25"
                          cy="25"
                          r="10"
                          stroke="#FFD700"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    </motion.div>
                  ))}

                  <p className="text-sm sm:text-base text-gray-700 mb-6 relative z-10 leading-relaxed">
                    Founded in 2020, our journey began with a passion to transform
                    wedding photography and cinematography into an art form. We
                    blend creativity with technical expertise to craft timeless
                    stories that reflect your unique love.
                  </p>
                </div>

                {/* Core Values List */}
                <h3 className="text-base sm:text-lg font-bold mb-3 text-primary relative z-10">
                  Our Core Values
                </h3>
                {/* `items-center` centred the tick against wrapped multi-line
                    values; `items-start` keeps it on the first line. */}
                <ul className="text-gray-700 mb-8 space-y-2.5 relative z-10">
                  {CORE_VALUES.map((value) => (
                    <motion.li
                      key={value}
                      className="flex items-start gap-2"
                      whileHover={reduceMotion ? undefined : { x: 10 }}
                    >
                      <motion.span
                        {...loop({ scale: [1, 1.2, 1] }, { duration: 2 })}
                        className="flex-shrink-0 mt-1"
                        aria-hidden="true"
                      >
                        <FaCheckCircle className="text-red-500" />
                      </motion.span>
                      {value}
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button with Floating Intertwined Rings Decoration.
                    Was 36px tall against the 44px floor. */}
                <Link
                  href="/about-us"
                  className="bg-red-500 text-white font-bold min-h-[44px] py-2 px-6 rounded-lg shadow-lg hover:bg-red-400 transition-colors duration-300 relative overflow-hidden inline-flex items-center z-10"
                >
                  <motion.span
                    {...loop({ rotate: 360 }, { duration: 8, ease: "linear" })}
                    className="absolute -right-4 -top-4 opacity-30"
                    aria-hidden="true"
                  >
                    <FaStar className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFD700]" />
                  </motion.span>
                  Who We Are
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
