import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Optional: paper grain for tactile print texture
import grainTexture from "./graintexture.avif";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    name: "Isha & Kartik",
    location: "Lucknow",
    quote: "We thought we were booking a photographer. We didn't realise we were booking a feeling. The Varanasi chapter of our wedding film made our parents weep."
  },
  {
    name: "Radhika & Aditya",
    location: "Mumbai",
    quote: "Standing on a boat at sunrise with the ghats behind us — that image is now the background of our home. The Wedding Boys understood what we couldn't explain."
  },
  {
    name: "Preeti & Nikhil",
    location: "Delhi",
    quote: "They didn't photograph our wedding. They wrote it. Every frame was a sentence in a story we didn't know was being told."
  }
];

export default function TestimonialsSection() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    // We use gsap.context to ensure animations clean up perfectly in React
    let ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".testimonial-card");
      const progressLine = document.querySelector(".progress-line");

      // 1. Initial State Setup
      // Card 0 starts perfectly centered and in focus.
      gsap.set(cards[0], { xPercent: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
      
      // Card 1 is pushed to the right, scaled down, and blurred.
      gsap.set(cards[1], { xPercent: 80, scale: 0.75, opacity: 0.25, filter: "blur(12px)" });
      
      // Card 2 is pushed even further right, smaller, and heavily blurred.
      gsap.set(cards[2], { xPercent: 160, scale: 0.5, opacity: 0, filter: "blur(20px)" });

      // 2. ScrollTrigger Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,           // Locks the website perfectly
          scrub: 1,            // Smooth transition inertia
          start: "top top",
          end: "+=250%",       // Dictates how long the user scrolls to finish the sequence
          anticipatePin: 1
        }
      });

      // Global progress bar animation
      tl.to(progressLine, { scaleX: 1, ease: "none", duration: 2 }, 0);

      // --- TRANSITION 1: Scroll 0% to 50% ---
      // Card 0 exits left. Card 1 enters center. Card 2 moves closer.
      tl.to(cards[0], { xPercent: -80, scale: 0.75, opacity: 0, filter: "blur(12px)", duration: 1 }, 0)
        .to(cards[1], { xPercent: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1 }, 0)
        .to(cards[2], { xPercent: 80, scale: 0.75, opacity: 0.25, filter: "blur(12px)", duration: 1 }, 0);

      // --- TRANSITION 2: Scroll 50% to 100% ---
      // Card 1 exits left. Card 2 enters center.
      tl.to(cards[1], { xPercent: -80, scale: 0.75, opacity: 0, filter: "blur(12px)", duration: 1 }, 1)
        .to(cards[2], { xPercent: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1 }, 1);

    }, sectionRef);

    return () => ctx.revert(); // Cleanup on unmount
  }, []);

  return (
    <section 
      ref={sectionRef} 
      // The section itself is exactly 1 screen high. GSAP holds it in place.
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Paper Grain Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.25] mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: `url(${grainTexture})`, backgroundSize: '200px' }}
      />

      {/* Giant Parallax Quote Mark Background */}
      <div className="absolute top-[15%] md:top-[20%] left-1/2 -translate-x-1/2 text-[180px] md:text-[300px] font-['Cormorant_Garamond'] text-[#D4AF37] opacity-[0.06] leading-none select-none pointer-events-none z-0">
        “
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center h-full pt-20">
        
        {/* Section Header */}
        <span className="text-[#8C7B6E] text-[10px] md:text-[11px] tracking-[0.35em] uppercase mb-16 md:mb-20 block font-semibold drop-shadow-sm absolute top-32">
          They Were There First
        </span>

        {/* Horizontal Sideways Track */}
        <div ref={trackRef} className="relative w-full h-[300px] md:h-[260px] flex items-center justify-center perspective-1000">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card absolute inset-0 w-full flex flex-col items-center justify-center text-center px-6 md:px-12 will-change-transform"
            >
              <h3 className="font-['Cormorant_Garamond'] text-[clamp(26px,4vw,44px)] text-[#1C1410] font-light leading-[1.3] italic mb-8 drop-shadow-sm max-w-3xl mx-auto">
                "{testimonial.quote}"
              </h3>
              
              <div className="flex flex-col items-center gap-2 mt-2">
                <span className="text-xs md:text-sm font-semibold tracking-[0.2em] text-[#1C1410] uppercase">
                  {testimonial.name}
                </span>
                <span className="text-[9px] md:text-[10px] tracking-[0.25em] text-[#C9973A] uppercase font-medium">
                  — {testimonial.location}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Global Progress Line (Fills up as you scroll) */}
        <div className="absolute bottom-24 md:bottom-32 w-48 md:w-64 h-[1px] bg-[#1C1410]/10 overflow-hidden">
          <div className="progress-line w-full h-full bg-gradient-to-r from-[#D4AF37] to-[#8C7B6E] origin-left scale-x-0" />
        </div>

      </div>
    </section>
  );
}