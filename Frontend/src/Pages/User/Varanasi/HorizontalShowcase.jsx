import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Placeholder imports - replace these with your 3 generated images
import imgSpiritual from "./culture-aarti.png";
import imgAncient from "./culture-rituals.png";
import imgSerene from "./culture-ghats.png";


gsap.registerPlugin(ScrollTrigger);

// ─── REWRITTEN COPY: Focusing on the Couple's Shoot ───
const FLAVORS = [
  {
    id: "01",
    title: "The Aarti Sequence",
    subtitle: "Silhouettes in Sacred Fire",
    description: "Imagine your pre-wedding film illuminated by thousand-year-old flames. We frame your silhouettes against the roaring Ganga Aarti, capturing a cinematic intimacy that feels ancient.",
    image: imgSpiritual,
  },
  {
    id: "02",
    title: "The Heritage Walk",
    subtitle: "Texture, Alleys & Time",
    description: "Varanasi’s narrow galis are a natural movie set. We guide you through the rustic wooden doors and marigold-draped corridors for those raw, candid, highly editorial portraits.",
    image: imgAncient,
  },
  {
    id: "03",
    title: "The Dawn Voyage",
    subtitle: "Just You & The River",
    description: "Before the city wakes, we take you to the middle of the misty Ganges. No crowds, no noise. Just cinematic, sweeping drone shots of the two of you as the first light hits the water.",
    image: imgSerene,
  }
];

export default function HorizontalShowcase() {
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const panels = gsap.utils.toArray(".horizontal-panel");
    const container = scrollContainerRef.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        scrub: 1, 
        end: () => `+=${container.scrollWidth - window.innerWidth}`,
        anticipatePin: 1,
      }
    });

    tl.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: "none",
    });

    // Parallax effect for the inner images
    panels.forEach((panel, i) => {
      const img = panel.querySelector(".parallax-img");
      if (img) {
        gsap.to(img, {
          xPercent: 15, // Softer parallax
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: tl, 
            start: "left right",
            end: "right left",
            scrub: true,
          }
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full h-screen bg-[#0A0705] overflow-hidden">
      
      {/* ── THE VISUAL BRIDGE (Fixes the harsh cut) ── */}
      {/* This gradient melts the bottom of the boat image into this dark section */}
      <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-[#0A0705] via-[#0A0705]/80 to-transparent z-30 pointer-events-none" />


      {/* The Horizontal Track */}
      <div 
        ref={scrollContainerRef} 
        className="flex w-[300vw] h-full z-10 relative" 
      >
        {FLAVORS.map((flavor) => (
          <div 
            key={flavor.id} 
            className="horizontal-panel relative w-screen h-full flex items-center justify-center p-6  overflow-hidden"
          >
            <div className="relative w-full max-w-7xl h-full flex flex-col md:flex-row items-center gap-8 md:gap-20">
              
              {/* Image Container (Softer, cinematic edges) */}
              <div className="relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden rounded-sm border border-[#C9973A]/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-[-10%] w-[120%] h-[120%]">
                  <img 
                    src={flavor.image} 
                    alt={flavor.title} 
                    className="parallax-img w-full h-full object-cover opacity-70 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
                  />
                </div>
                {/* Vignette to soften the hard edges of the image inside the box */}
                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(10,7,5,1)] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0705] via-transparent to-transparent opacity-80" />
              </div>

              {/* Typography Box */}
              <div className="relative w-full md:w-1/2 flex flex-col justify-center pt-8 md:pt-0">
                <span className="font-['Cinzel'] text-[60px] md:text-[120px] text-[#C9973A] opacity-5 leading-none absolute -top-10 -left-4 md:-top-20 md:-left-8 pointer-events-none select-none">
                  {flavor.id}
                </span>
                
                <h2 className="font-['Cormorant_Garamond'] text-[clamp(36px,5vw,64px)] text-[#FAF6EE] font-light leading-[1.05] mb-3 relative z-10">
                  {flavor.title}
                </h2>
                
                <span className="text-[10px] md:text-[11px] tracking-[0.3em] text-[#E2BC6E] uppercase mb-6 block relative z-10 font-medium">
                  {flavor.subtitle}
                </span>
                
                <p className="text-[#8C7B6E] text-base md:text-lg font-light leading-relaxed max-w-md relative z-10">
                  {flavor.description}
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>

    </section>
  );
}