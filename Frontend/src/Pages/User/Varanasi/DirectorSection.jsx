import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function DirectorSection() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Typography Layer Refs
  const textPhase1Ref = useRef(null);
  const textPhase2Ref = useRef(null);
  const textPhase3Ref = useRef(null);

  const frameCount = 146;
  const imagesRef = useRef([]);

  // Replace with the actual path where you store the 150 extracted frames of the new video
  const currentFrame = (index) =>
    `/director-frames/Timeline_1_${String(index + 1).padStart(
      3,
      "0"
    )}.webp`;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const playhead = { frame: 0 };

    imagesRef.current = [];

    // Preload Images
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      imagesRef.current.push(img);

      if (i === 0) {
        img.onload = () => renderFrame(0);
      }
    }

    const renderFrame = (index) => {
      if (!imagesRef.current[index] || !ctx) return;
      const img = imagesRef.current[index];
      if (!img.complete) return;

      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame(Math.round(playhead.frame));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // ── THE MASTER TIMELINE ──
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=400%", // 400% gives a nice, long, luxurious scroll feel
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    // 1. Scrub through video frames (Duration maps from 0 to 1)
    tl.to(playhead, {
      frame: frameCount - 1,
      ease: "none",
      duration: 1, 
      onUpdate: () => renderFrame(Math.round(playhead.frame)),
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
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      // bg-[#0A0705] perfectly matches the vignette from the Hero section for a seamless blend
      className="relative w-full h-screen bg-[#0A0705] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 block pointer-events-none"
      />

      {/* Global dark tint to ensure white text is always readable over the firelight */}
      <div className="absolute inset-0 z-10 bg-black/30 pointer-events-none" />

      {/* ── PHASE 1 TEXT: Center Screen (The Wide Shot) ── */}
      <div
        ref={textPhase1Ref}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-5 sm:px-8 pointer-events-none"
      >
        <h2 className="font-['Cormorant_Garamond'] text-[clamp(32px,5vw,64px)] text-white font-light text-center leading-[1.2] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          We don't just wait for the <br/>
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]">
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
        <p className="font-['Cormorant_Garamond'] text-[clamp(24px,3vw,42px)] text-white text-right leading-[1.3] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
          We step into the chaos, <br/>
          orchestrating <span className="text-[#FCF6BA]">light</span> and <span className="text-[#FCF6BA]">legacy</span>...
        </p>
      </div>

      {/* ── PHASE 3 TEXT: Bottom Center (The Close-up Payoff) ── */}
      <div
        ref={textPhase3Ref}
        className="absolute inset-x-0 bottom-[15vh] z-20 flex flex-col items-center px-5 pointer-events-none"
      >
        <h3 className="font-['Cormorant_Garamond'] text-[clamp(28px,4vw,56px)] text-white font-light text-center leading-[1.2] drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
          ...to capture the frame <br/>
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728]">
            you'll keep forever.
          </span>
        </h3>
        
        {/* Optional decorative line beneath the final statement */}
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-6 opacity-60" />
      </div>
    </section>
  );
}