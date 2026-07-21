import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Assume these imports point to your assets
import storyImage from "./varanasi-story-cinematic.png";
// import grainTexture from "../assets/paper-grain.png"; // A subtle noise/grain texture

const COLORS = {
  saffron: "#E8600A",
  gold: "#C9973A",
  ivory: "#FAF6EE",
  dusk: "#0A0705",
  ashGray: "#8C7B6E",
};

const floatingStats = [
  { value: "84", label: "Ghats" },
  { value: "∞", label: "Rituals" },
  { value: "1", label: "Sacred City" },
  { value: "1000+", label: "Untold Frames" },
];

export default function StorySection() {
  const sectionRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Parallax effects
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen w-full bg-[#0A0705] py-32 px-6 md:px-12 lg:px-24 overflow-hidden flex items-center"
    >
      {/* Subtle Paper Grain Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none"
        // style={{ backgroundImage: `url(${grainTexture})`, backgroundSize: '150px' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
        
        {/* Left Column: The Narrative (Col span 5) */}
        <motion.div 
          style={{ y: textY }}
          className="lg:col-span-5 flex flex-col justify-center"
        >
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-[#C9973A] text-[10px] tracking-[0.35em] uppercase mb-8 block"
          >
            The Announcement
          </motion.span>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="font-['Cormorant_Garamond'] text-[clamp(40px,5vw,72px)] text-[#FAF6EE] leading-[1.05] font-light mb-10"
          >
            We have been waiting for this city
            {/* Animated Gold Underline */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              className="h-[1px] w-3/4 mt-4 bg-gradient-to-r from-[#C9973A] to-transparent origin-left"
            />
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="space-y-6 text-[#8C7B6E] text-lg lg:text-xl font-light leading-relaxed max-w-md"
          >
            <p>
              Varanasi is not just a location. It is the oldest living city on earth. Where the river carries prayers upstream and love is witnessed by something ancient.
            </p>
            <p>
              The Wedding Boys has spent years crafting wedding films across India. Now, we arrive at the place where stories were always meant to be told.
            </p>
          </motion.div>
        </motion.div>

        {/* Right Column: Cinematic Image, Floating Quote & Stats (Col span 7) */}
        <div className="lg:col-span-7 relative h-full flex flex-col justify-center">
          
          {/* Parallax Image Reveal */}
          <div className="relative w-full aspect-[4/5] md:aspect-[16/9] lg:aspect-[4/3] overflow-hidden rounded-sm mb-16 lg:mb-0 lg:ml-12">
            <motion.div 
              style={{ y: imageY }}
              className="absolute inset-[-15%] w-[130%] h-[130%]"
            >
              <img 
                src={storyImage} 
                alt="Cinematic Varanasi Portrait" 
                className="w-full h-full object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0705] via-transparent to-transparent opacity-90" />
              <div className="absolute inset-0 bg-[#0A0705]/20 mix-blend-multiply" />
            </motion.div>

            {/* Floating Quote Overlaid on Image */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="absolute bottom-10 left-6 md:left-10 md:bottom-12 max-w-sm"
            >
              <div className="border-l-[1.5px] border-[#E8600A] pl-6 py-2">
                <p className="font-['Cormorant_Garamond'] text-[clamp(24px,3vw,36px)] text-[#FAF6EE] italic leading-tight mb-4 shadow-black drop-shadow-xl">
                  "Every city has a light. Varanasi has fire."
                </p>
                <p className="text-[10px] tracking-[0.2em] text-[#E2BC6E] uppercase">
                  — The Wedding Boys
                </p>
              </div>
            </motion.div>
          </div>

          {/* Floating Typography Stats (No Containers/Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:absolute lg:-bottom-12 lg:left-0 lg:w-[120%] z-20 px-4">
            {floatingStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 + (index * 0.15) }}
                className="flex flex-col gap-2"
              >
                <span className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-[#E8600A] opacity-90 font-light">
                  {stat.value}
                </span>
                <span className="text-[10px] md:text-xs tracking-[0.15em] text-[#8C7B6E] uppercase whitespace-nowrap">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}