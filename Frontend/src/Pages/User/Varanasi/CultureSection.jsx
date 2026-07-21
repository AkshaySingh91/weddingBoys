import React from "react";
import { motion } from "framer-motion";

// Placeholder imports for the images (we will generate prompts for these later)
import aartiImage from "./culture-aarti.png";
import ghatsImage from "./culture-ghats.png";
import ritualsImage from "./culture-rituals.png";
import musicImage from "./culture-music.png";

const CULTURE_PILLARS = [
  {
    id: "aarti",
    icon: "🪔",
    title: "Ganga Aarti",
    body: "Every evening, fire meets river in a ceremony older than memory. We place your love story inside that sacred flame.",
    image: aartiImage,
    offset: "mt-0", // Staggering for editorial layout
  },
  {
    id: "ghats",
    icon: "🛶",
    title: "The Sacred Ghats",
    body: "84 ghats, each with a different light. We know every step, every shadow, every golden hour that the Ganges reveals.",
    image: ghatsImage,
    offset: "lg:mt-32",
  },
  {
    id: "rituals",
    icon: "🌸",
    title: "Banarasi Rituals",
    body: "The chanting, the sindoor, the sapta padi — ancient vows performed where they have always belonged.",
    image: ritualsImage,
    offset: "mt-0",
  },
  {
    id: "music",
    icon: "🎶",
    title: "The City's Music",
    body: "Varanasi breathes rhythm. From the tabla echo in narrow lanes to temple bells at dawn, every frame has a sound.",
    image: musicImage,
    offset: "lg:mt-32",
  },
];

// ─── COMPONENT: Cinematic Panel ───
const CinematicPanel = ({ pillar, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full aspect-[4/5] md:aspect-square lg:aspect-[3/4] overflow-hidden group ${pillar.offset} cursor-crosshair`}
    >
      {/* Default Dark State */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0705] via-[#0A0705]/95 to-[#150F0A] z-10 transition-opacity duration-1000 group-hover:opacity-40" />

      {/* Hover Image Reveal & Slow Zoom */}
      <motion.div 
        className="absolute inset-0 w-full h-full z-0"
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img 
          src={pillar.image} 
          alt={pillar.title} 
          className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-in-out"
        />
        {/* Subtle orange/gold glow multiplier on hover */}
        <div className="absolute inset-0 bg-[#E8600A]/10 mix-blend-color-dodge opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      </motion.div>

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-12">
        <motion.div 
          className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out"
        >
          <span className="text-2xl mb-4 block opacity-50 group-hover:opacity-100 transition-opacity duration-700">
            {pillar.icon}
          </span>
          <h3 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl text-[#C9973A] font-light mb-4 group-hover:text-[#FAF6EE] group-hover:drop-shadow-[0_0_15px_rgba(232,96,10,0.4)] transition-all duration-700">
            {pillar.title}
          </h3>
          <p className="text-[#8C7B6E] text-sm md:text-base font-light leading-relaxed group-hover:text-[#FAF6EE]/90 transition-colors duration-700 max-w-sm">
            {pillar.body}
          </p>
        </motion.div>
      </div>

      {/* Ambient Animated Border Glow on Hover */}
      <div className="absolute inset-0 border border-transparent group-hover:border-[#C9973A]/20 z-30 transition-colors duration-1000 pointer-events-none" />
    </motion.div>
  );
};

// ─── MAIN COMPONENT: CultureSection ───
export default function CultureSection() {
  return (
    <section className="relative w-full bg-[#0A0705] py-32 px-6 md:px-12 lg:px-24 overflow-hidden">
      
      {/* Atmospheric Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(232,96,10,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-24 md:mb-32">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-[#C9973A] text-[10px] tracking-[0.35em] uppercase mb-6 block"
          >
            The Soul of Kashi
          </motion.span>

          <motion.h2 
            initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="font-['Cormorant_Garamond'] text-[clamp(40px,6vw,80px)] text-[#FAF6EE] leading-[1.05] font-light mb-8"
          >
            This city is a <br className="hidden md:block" />
            <span className="italic text-[#E8600A]">living frame</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-[#8C7B6E] text-lg lg:text-xl font-light max-w-2xl mx-auto leading-relaxed"
          >
            Nowhere else do ritual, light, and emotion converge with such raw elegance. Varanasi frames love without asking.
          </motion.p>
        </div>

        {/* Staggered Cinematic Grid (Replaces the "Cards in a row") */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
          {CULTURE_PILLARS.map((pillar, index) => (
            <CinematicPanel key={pillar.id} pillar={pillar} index={index} />
          ))}
        </div>

        {/* Cinematic Timeline Strip (Replacing the rigid boxes from original) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="mt-32 pt-16 border-t border-[#C9973A]/10 relative"
        >
          {/* Animated Gold Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#C9973A]/40 to-transparent"
          />

          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center">
            {[
              { label: "Arrive", desc: "First light over the Ganges" },
              { label: "Explore", desc: "Your story meets the city" },
              { label: "Create", desc: "We film what cannot be staged" },
              { label: "Remember", desc: "Forever, and then some" }
            ].map((step, i) => (
              <div key={i} className="flex-1 relative group cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E8600A]/30 mx-auto mb-6 group-hover:bg-[#E8600A] group-hover:shadow-[0_0_10px_2px_rgba(232,96,10,0.5)] transition-all duration-500" />
                <h4 className="font-['Cormorant_Garamond'] text-2xl text-[#FAF6EE] font-light mb-2">{step.label}</h4>
                <p className="text-[10px] tracking-[0.15em] text-[#8C7B6E] uppercase">{step.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}