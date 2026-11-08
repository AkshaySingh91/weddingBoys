"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from 'next/image';
import { createSequencePlayer } from "@/lib/sequence/createSequencePlayer.js";

gsap.registerPlugin(ScrollTrigger);

export default function DirectorSection({ sequence }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Typography Layer Refs
  const textPhase1Ref = useRef(null);
  const textPhase2Ref = useRef(null);
  const textPhase3Ref = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      canvasRef.current.style.display = 'none';
      containerRef.current.style.height = 'auto';
      containerRef.current.style.minHeight = '100vh';
      for (const element of [textPhase1Ref.current, textPhase2Ref.current, textPhase3Ref.current]) {
        element.style.position = 'relative';
        element.style.width = '100%';
        element.style.minHeight = '50vh';
      }
      return undefined;
    }

    const frameCount = sequence.frameCount;
    const playhead = { frame: 0 };
    const player = createSequencePlayer({
      canvas: canvasRef.current, container: containerRef.current, sequence,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=400%", // 400% gives a nice, long, luxurious scroll feel
        scrub: 0.5, // see HeroSection: Lenis already smooths the wheel
        pin: true,
        anticipatePin: 1,
      },
    });

    // 1. Scrub through video frames (Duration maps from 0 to 1)
    tl.to(playhead, {
      frame: frameCount - 1,
      ease: "none",
      duration: 1,
      onUpdate: () => player.setProgress(playhead.frame / (frameCount - 1)),
    }, 0);

    // ── TYPOGRAPHY CHOREOGRAPHY ──

    // Initial Setup: Hide Phase 2 and 3
    gsap.set([textPhase2Ref.current, textPhase3Ref.current], { opacity: 0, y: 30 });

    // Phase 1: "The Grandeur" (Frames 0 to ~45)
    // Starts visible, fades out as the camera begins its rapid dive
    tl.to(textPhase1Ref.current, {
      opacity: 0,
      y: -30,
      duration: 0.15, // Fades out quickly
      ease: "power2.inOut"
    }, 0.25); // Triggers at 25% of the scroll

    // Phase 2: "The Hustle" (Frames ~50 to ~100)
    // Fades in as the camera sweeps past the director
    tl.to(textPhase2Ref.current, {
      opacity: 1,
      y: 0,
      duration: 0.15,
      ease: "power2.out"
    }, 0.35); // Fades in at 35%

    // Fades out as the camera leaves the director and locks onto the couple
    tl.to(textPhase2Ref.current, {
      opacity: 0,
      y: -30,
      duration: 0.15,
      ease: "power2.in"
    }, 0.60); // Fades out at 60%

    // Phase 3: "The Payoff" (Frames ~100 to 150)
    // Fades in as the close-up of the couple is revealed
    tl.to(textPhase3Ref.current, {
      opacity: 1,
      y: 0,
      duration: 0.2,
      ease: "power2.out"
    }, 0.75); // Fades in at 75% and stays until the end

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      player.destroy();
    };
  }, [sequence]);

  return (
    <section
      ref={containerRef}
      // bg-[#0A0705] perfectly matches the vignette from the Hero section for a seamless blend
      className="relative w-full h-screen bg-[#0A0705] overflow-hidden"
    >
      <Image src={sequence.posterUrl} alt="" fill sizes="100vw" unoptimized loading="lazy" className="object-cover pointer-events-none" style={{ objectPosition: `${(sequence.focalX ?? 0.5) * 100}% ${(sequence.focalY ?? 0.5) * 100}%` }} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full z-0 block pointer-events-none"
      />

      {/* Global dark tint to ensure white text is always readable over the firelight */}
      <div className="absolute inset-0 z-10 bg-black/30 pointer-events-none" />

      {/* ── PHASE 1 TEXT: Center Screen (The Wide Shot) ── */}
      <div
        ref={textPhase1Ref}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-5 sm:px-8 pointer-events-none"
      >
        <h2 className="font-display text-[clamp(32px,5vw,64px)] text-white font-light text-center leading-[1.2] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          We don&apos;t just wait for the <br/>
          <span className="italic text-gold">
            perfect moment.
          </span>
        </h2>
      </div>

      {/* ── PHASE 2 TEXT: Offset Left/Right (The Director Pass) ── */}
      {/* Positioned slightly to the right so it doesn't cover the director's face on the left */}
      <div
        ref={textPhase2Ref}
        className="absolute inset-y-0 right-0 z-20 flex flex-col justify-center w-full md:w-1/2 px-8 md:pr-16 pointer-events-none"
      >
        <p className="font-display text-[clamp(24px,3vw,42px)] text-white text-right leading-[1.3] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          We step into the chaos, <br/>
          orchestrating <span className="text-gold">light</span> and <span className="text-gold">legacy</span>...
        </p>
      </div>

      {/* ── PHASE 3 TEXT: Bottom Center (The Close-up Payoff) ── */}
      <div
        ref={textPhase3Ref}
        className="absolute inset-x-0 bottom-[15vh] z-20 flex flex-col items-center px-5 pointer-events-none"
      >
        <h3 className="font-display text-[clamp(28px,4vw,56px)] text-white font-light text-center leading-[1.2] drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
          ...to capture the frame <br/>
          <span className="italic text-gold">
            you&apos;ll keep forever.
          </span>
        </h3>

        {/* Optional decorative line beneath the final statement */}
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mt-6 opacity-60" />
      </div>
    </section>
  );
}
