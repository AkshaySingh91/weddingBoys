import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Sections
import HeroSection from "./HeroSection";
import StorySection from "./StorySection";
import CultureSection from "./CultureSection";
import WhyVaranasiSection from "./WhyVaranasiSection";
import GallerySection from "./GallerySection";
import TestimonialsSection from "./TestimonialsSection";
import FinalCTASection from "./FinalCTASection";
import HorizontalShowcase from "./HorizontalShowcase";
import DirectorSection from "./DirectorSection";

gsap.registerPlugin(ScrollTrigger);

export default function VaranasiPage() {
  const pageRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {

    // Modern Lenis Instance
    const lenis = new Lenis({
      duration: 1.4,
      smoothWheel: true,
      smoothTouch: false,

      // Cinematic easing
      easing: (t) => {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
    });

    // Sync Lenis with GSAP
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Floating ambient background motion
    gsap.to(".ambient-glow", {
      y: -40,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Subtle floating particles
    gsap.to(".floating-particle", {
      y: -25,
      opacity: 0.4,
      stagger: 0.3,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      ScrollTrigger.killAll();
    };

  }, []);

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main
      ref={pageRef}
      className="
        relative
        w-full
        min-h-screen
        overflow-hidden
        bg-gradient-to-b from-[#fceee6] to-[#FDE9D9]
        text-[#FAF6EE]
        selection:bg-[#E8600A]/30
        selection:text-white
      "
    >

      {/* Ambient cinematic glow */}
      <div
        className="
          ambient-glow
          pointer-events-none
          fixed
          top-[-20%]
          right-[-10%]
          w-[45rem]
          h-[45rem]
          rounded-full
          bg-gradient-to-b from-[#fceee6] to-[#FDE9D9]
          blur-[140px]
          z-0
        "
      />

      {/* Secondary warm glow */}
      <div
        className="
          ambient-glow
          pointer-events-none
          fixed
          bottom-[-20%]
          left-[-10%]
          w-[35rem]
          h-[35rem]
          rounded-full
          bg-[#ffcc88]/[0.04]
          blur-[120px]
          z-0
        "
      />

      {/* Floating cinematic particles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="
              floating-particle
              absolute
              w-[4px]
              h-[4px]
              rounded-full
              bg-[#ffb347]
              opacity-20
              blur-[1px]
            "
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Noise texture */}
      <div
        className="
          pointer-events-none
          fixed
          inset-0
          opacity-[0.03]
          mix-blend-soft-light
          z-0
          bg-[url('/noise.png')]
        "
      />

      {/* Page Content */}
      <div className="relative z-10">

        <HeroSection onCTAClick={scrollToCTA} />
        <DirectorSection/>
        <HorizontalShowcase />
        <WhyVaranasiSection />

        <GallerySection />

        <TestimonialsSection />

        <FinalCTASection ctaRef={ctaRef} />

      </div>
    </main>
  );
}