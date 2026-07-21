import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import heroBackground from "./varanasi-hero-cinematic.png";
import fogOverlay from "./fog-texture.png";
import intimateBoatImage from "./varanasi-boat-intimate.png";

gsap.registerPlugin(ScrollTrigger);

// ─── PURE CSS EMBERS ───
const Embers = () => {
  const embers = Array.from({ length: 15 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {embers.map((_, i) => (
        <div
          key={i}
          className="ember-particle"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT: HeroSection ───
export default function HeroSection({ onCTAClick }) {
  const containerRef = useRef(null);

  // Refs for animated elements — these all point to <img> or inner wrappers,
  // never to the overflow-hidden clipping shells.
  const heroImgRef   = useRef(null); // the <img> itself in layer 1
  const boatWrapRef  = useRef(null); // inner scaling wrapper for layer 2
  const murkyRef     = useRef(null);
  const heroTextRef  = useRef(null);
  const boatTextRef  = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── INITIAL STATES ──────────────────────────────────────────
      // Hero image: scale from bottom-center so we zoom INTO the river.
      // We set this directly on the <img> so the overflow-hidden shell clips it perfectly.
      gsap.set(heroImgRef.current, {
        scale: 1,
        transformOrigin: "bottom center",
        // Give the image a tiny overscan so subpixel rounding never exposes
        // the container background at the very start.
        width: "100%",
        height: "105%",       // 5% taller than container — hides any 1px gap at top/bottom
        objectFit: "cover",
        objectPosition: "center center",
      });

      // Boat wrapper: starts invisible, already scaled up 1.4×
      gsap.set(boatWrapRef.current, {
        opacity: 0,
        scale: 1.4,
        transformOrigin: "center center",
      });

      gsap.set(murkyRef.current,   { opacity: 0 });
      gsap.set(boatTextRef.current, { opacity: 0, y: 40 });

      // ── TIMELINE ────────────────────────────────────────────────
      // All position values are on a 0–100 unit scale that maps directly
      // to the full 400vh scroll distance. Think of each unit ≈ 4vh scrolled.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // [0 → 15]  Hero text exits upward
      tl.to(heroTextRef.current, { opacity: 0, y: -50, duration: 15 }, 0);

      // [0 → 45]  Dive — hero image zooms into the river bottom
      tl.to(heroImgRef.current, { scale: 2.2, duration: 45, ease: "power1.inOut" }, 0);

      // [28 → 43] Black submersion — overlay reaches opacity:1 at position 43,
      //           which is 2 units BEFORE the swap. This guarantees a dark screen.
      tl.to(murkyRef.current, { opacity: 1, duration: 15, ease: "power1.in" }, 28);

      // [43 → 45] SWAP behind total darkness.
      //           Using a tiny tl.to() (not tl.set) so scrubbing backwards also works.
      tl.to(heroImgRef.current, { opacity: 0, duration: 2 }, 43);
      tl.to(boatWrapRef.current, { opacity: 1, duration: 2 }, 43);

      // [46 → 62] Overlay fades away, revealing the new boat scene
      tl.to(murkyRef.current, { opacity: 0, duration: 16, ease: "power1.out" }, 46);

      // [46 → 82] Camera pulls up — boat image scales down to natural size
      tl.to(boatWrapRef.current, { scale: 1, duration: 36, ease: "power2.out" }, 46);

      // [74 → 95] Boat scene text fades in
      tl.to(boatTextRef.current, { opacity: 1, y: 0, duration: 21, ease: "power2.out" }, 74);

      // [95 → 100] Hold at end
      tl.to({}, { duration: 5 }, 95);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    // 1. THIS IS YOUR TRACK: It must be tall (400vh) to give the scroll animation time to play.
    <section ref={containerRef} className="relative h-[400vh] w-full bg-[#0A0705]">
      
      {/* 2. THIS IS YOUR CAMERA: It locks to the screen while you scroll down the track. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0A0705]">
        
        {/* ==========================================
            LAYER 1: ORIGINAL HERO SCENE
            ========================================== */}
        {/* The wrapper guarantees the bounds never break */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-[#0A0705]">
          <div 
            ref={heroImgRef} 
            className="absolute inset-0 w-full h-full"
            style={{ transformOrigin: "center center" }} // Center zoom prevents edge gaps
          >
            <img 
              src={heroBackground} 
              alt="Varanasi Sunrise" 
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            />
            {/* Drifting Fog */}
            <div 
              className="absolute inset-0 z-10 mix-blend-screen opacity-50 bg-repeat-x"
              style={{ 
                backgroundImage: `url(${fogOverlay})`,
                backgroundSize: 'cover',
                animation: 'driftFog 60s linear infinite'
              }}
            />
          </div>
        </div>

        {/* ==========================================
            LAYER 2: NEW BOAT SCENE
            ========================================== */}
        <div 
          ref={boatWrapRef} 
          className="absolute inset-0 w-full h-full z-10 overflow-hidden"
          style={{ transformOrigin: "center center" }}
        >
          <img 
            src={intimateBoatImage} 
            alt="Intimate Boat Scene" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0705] via-transparent to-[#0A0705]/40" />
        </div>

        {/* ==========================================
            LAYER 3: THE MURKY WATER TRANSITION
            ========================================== */}
        {/* This must cover the entire screen absolutely */}
        <div 
          ref={murkyRef}
          className="absolute inset-0 w-full h-full z-20 pointer-events-none bg-[#050302]"
        />

        {/* Floating Embers */}
        <div className="absolute inset-0 z-25 pointer-events-none">
          <Embers />
        </div>

        {/* ==========================================
            LAYER 4: HERO TEXT
            ========================================== */}
        <div 
          ref={heroTextRef}
          className="absolute inset-0 z-30 flex flex-col items-center pt-[20vh] px-6 pointer-events-none"
        >
          {/* ... Keep your existing Hero text elements here ... */}
          <h1 className="font-['Cormorant_Garamond'] text-[clamp(60px,12vw,140px)] leading-[0.85] text-[#FAF6EE] font-light tracking-tight text-center mb-8">
            Kashi<br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#E2BC6E] via-[#FAF6EE] to-[#E2BC6E] opacity-90">
              Awaits
            </span>
          </h1>
        </div>

        {/* ==========================================
            LAYER 5: BOAT SCENE TEXT
            ========================================== */}
        <div 
          ref={boatTextRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 pointer-events-none"
        >
           {/* ... Keep your existing Boat text elements here ... */}
           <h2 className="font-['Cormorant_Garamond'] text-[clamp(40px,8vw,80px)] text-[#FAF6EE] font-light text-center leading-[1.1] mb-12 max-w-4xl drop-shadow-xl">
            Intimacy captured amidst the<br />
            <span className="italic text-[#E2BC6E]">timeless flow of the Ganga.</span>
          </h2>
        </div>

      </div>
    </section>
  );
}