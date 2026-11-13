"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from 'next/image';
import { createSequencePlayer } from "@/lib/sequence/createSequencePlayer.js";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection({ onCTAClick, sequence }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // UI Layer Refs
  const initialTextRef = useRef(null);
  const finalCTAOverlayRef = useRef(null);
  const bottomVignetteRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      canvasRef.current.style.display = 'none';
      containerRef.current.style.height = 'auto';
      containerRef.current.style.minHeight = '100vh';
      for (const element of [initialTextRef.current, finalCTAOverlayRef.current]) {
        element.style.position = 'relative';
        element.style.minHeight = '75vh';
      }
      finalCTAOverlayRef.current.style.opacity = '1';
      finalCTAOverlayRef.current.style.pointerEvents = 'auto';
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
        end: "+=400%",
        // Lenis already smooths the wheel; a long scrub on top of it stacks a second
        // lag, so the frames trail the scroll and then race to catch up.
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
      },
    });

    // 1. Scrub through frames
    tl.to(
      playhead,
      {
        frame: frameCount - 1,
        ease: "none",
        duration: 1,
        onUpdate: () => {
          player.setProgress(playhead.frame / (frameCount - 1));
        },
      },
      0
    );

    // 2. Fade out initial text early
    tl.to(
      initialTextRef.current,
      {
        opacity: 0,
        y: -40,
        duration: 0.2,
      },
      0
    );

    gsap.set(finalCTAOverlayRef.current, {
      opacity: 0,
      y: 30,
      pointerEvents: "none",
    });

    gsap.set(bottomVignetteRef.current, {
      opacity: 0,
    });

    // 3. Fade IN dynamic vignette EARLY (Starts at 0.5 timeline mark)
    tl.to(
      bottomVignetteRef.current,
      {
        opacity: 1,
        duration: 0.3, // Slightly longer duration for a smooth, creeping shadow
        ease: "power2.inOut",
      },
      0.5
    );

    // 4. Fade IN final text LATER (Starts at 0.7 timeline mark, after shadow is mostly visible)
    tl.to(
      finalCTAOverlayRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        onStart: () => {
          finalCTAOverlayRef.current.style.pointerEvents = "auto";
        },
        onReverseComplete: () => {
          finalCTAOverlayRef.current.style.pointerEvents = "none";
        },
      },
      0.7
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      player.destroy();
    };
  }, [sequence]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen bg-[#0A0705] overflow-hidden"
    >
      <Image src={sequence.posterUrl} alt="" fill sizes="100vw" unoptimized fetchPriority="high" className="object-cover pointer-events-none" style={{ objectPosition: `${(sequence.focalX ?? 0.5) * 100}% ${(sequence.focalY ?? 0.5) * 100}%` }} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full z-0 block pointer-events-none"
      />

      {/* Base tint left at just 10% to keep sides/top mostly clear */}
      <div className="absolute inset-0 z-10 bg-black/10 pointer-events-none" />

      {/* UPDATED DYNAMIC BOTTOM VIGNETTE
        - Height increased to h-[65vh] so it reaches higher behind the text.
        - Uses the exact background color (#0A0705) for a flawless blend into the next section.
        - from-10% ensures the bottom 10% is solid before it starts fading.
      */}
      <div
        ref={bottomVignetteRef}
        className="absolute inset-x-0 bottom-0 h-[65vh] z-10 bg-gradient-to-t from-[#000000d9] from-10% via-[#0A07054b]/80 to-transparent pointer-events-none"
      />

      {/* ── INITIAL OVERLAY TEXT ── */}
      <div
        ref={initialTextRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-[18vh] md:pt-[22vh] px-5 sm:px-8 pointer-events-none"
      >
        <div className="flex items-center gap-3 md:gap-5 mb-6 drop-shadow-md">
          <div className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-gold" />
          <span className="text-[9px] md:text-[11px] tracking-[0.35em] md:tracking-[0.4em] text-ink-onDeep uppercase font-medium">
            The Wedding Vachan in Banaras
          </span>
          <div className="w-8 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-gold" />
        </div>

        <h1 className="font-display text-[clamp(65px,15vw,160px)] leading-[0.85] text-white font-light tracking-tight text-center mb-6 md:mb-8 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
          Varanasi<br />
          <span className="italic text-gold drop-shadow-none">
            Awaits
          </span>
        </h1>

        <p className="font-display text-[clamp(22px,4vw,36px)] text-white/95 text-center max-w-[320px] md:max-w-2xl mx-auto leading-[1.3] md:leading-relaxed drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          Cinematic pre-wedding photography in the world&apos;s oldest living city.
        </p>
      </div>

      {/* ── FINAL OVERLAY TEXT ── */}
      <div
        ref={finalCTAOverlayRef}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center pt-24 px-5 sm:px-8"
      >
        <span className="text-[10px] md:text-[11px] tracking-[0.35em] text-gold uppercase font-bold mb-5 md:mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Pre-Wedding in Varanasi
        </span>

        <h2 className="font-display text-[clamp(36px,7vw,84px)] text-white font-light text-center leading-[1.1] mb-10 md:mb-14 max-w-[95%] md:max-w-4xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
          Your love story, beautifully framed<br />
          <span className="italic text-gold">
            along the historic ghats.
          </span>
        </h2>

        <button
          onClick={onCTAClick}
          className="
            group
            relative
            flex
            items-center
            justify-center
            px-8
            md:px-12
            py-4
            md:py-5
            bg-black/40
            backdrop-blur-md
            overflow-hidden
            border
            border-gold/50
            transition-all
            duration-700
            hover:border-gold
            hover:shadow-[0_0_30px_rgba(191,149,63,0.3)]
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/15 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

          <span className="relative text-[10px] md:text-[11px] tracking-[0.3em] text-white uppercase font-medium transition-colors duration-500 group-hover:text-gold">
            View Pre-Wedding Packages
          </span>
        </button>
      </div>
    </section>
  );
}
