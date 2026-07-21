import React, { useRef } from "react";
import { motion } from "framer-motion";

// Placeholder imports - replace these with your actual assets
import memoryImg1 from "./varanasi-story-cinematic.png"; // Square
// import memoryVid1 from "./portfolio-loop-1.mp4"; 

const MEMORIES = [
  {
    id: 1,
    image: memoryImg1,
    videoSrc: "", // Add your short 3-second .mp4 loop here
    couple: "Priya & Arjun",
    location: "Assi Ghat",
    ritual: "The First Look",
    time: "Dawn Light",
    mood: "River Mist & Silence",
    aspect: "aspect-[3/4]",
  },
  {
    id: 2,
    image: memoryImg1,
    videoSrc: "",
    couple: "Meera & Vikram",
    location: "Dashashwamedh",
    ritual: "Aarti Ceremony",
    time: "Dusk",
    mood: "Fire & Devotion",
    aspect: "aspect-square",
  },
  {
    id: 3,
    image: memoryImg1,
    videoSrc: "",
    couple: "Ananya & Rohan",
    location: "Kashi Vishwanath Lane",
    ritual: "Wedding Day",
    time: "Morning",
    mood: "Marigolds & Silk",
    aspect: "aspect-[4/5]",
  },
  {
    id: 4,
    image: memoryImg1,
    videoSrc: "",
    couple: "Sana & Dev",
    location: "Manikarnika Boat",
    ritual: "Sunrise Shoot",
    time: "First Light",
    mood: "Golden Haze",
    aspect: "aspect-[4/3]",
  },
  {
    id: 5,
    image: memoryImg1,
    videoSrc: "",
    couple: "Ishaan & Tara",
    location: "Chet Singh Fort",
    ritual: "Varmala",
    time: "Evening",
    mood: "Royal & Shadowed",
    aspect: "aspect-[3/4]",
  },
  {
    id: 6,
    image: memoryImg1,
    videoSrc: "",
    couple: "Riya & Kabir",
    location: "Namets Ghat",
    ritual: "Sindoor",
    time: "Golden Hour",
    mood: "Intimate & Sacred",
    aspect: "aspect-[4/5]",
  }
];

// ─── COMPONENT: Living Memory Card ───
const MemoryCard = ({ item, index }) => {
  const videoRef = useRef(null);

  // Play video on hover
  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Video play interrupted"));
    }
  };

  // Pause and reset video when mouse leaves
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      // Optional: rewind to start so it's fresh next time
      setTimeout(() => {
        if (videoRef.current) videoRef.current.currentTime = 0;
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full ${item.aspect} mb-6 overflow-hidden group cursor-crosshair break-inside-avoid bg-[#0A0705] border border-[#C9973A]/5 shadow-xl`}
    >
      {/* Base Image (Acts as the poster) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <img
          src={item.image}
          alt={`${item.couple} in Varanasi`}
          className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
        />

        {/* The Silent Video Loop (Hidden until hovered) */}
        {item.videoSrc && (
          <video
            ref={videoRef}
            src={item.videoSrc}
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        )}
      </motion.div>

      {/* Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0705] via-[#0A0705]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

      {/* Metadata Reveal Container */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">

        {/* Couple Name */}
        <h4 className="font-['Cormorant_Garamond'] text-2xl md:text-3xl text-[#FAF6EE] font-light mb-2 group-hover:text-[#E2BC6E] transition-colors duration-500 z-10 transform translate-y-6 group-hover:translate-y-0 ease-out">
          {item.couple}
        </h4>

        {/* Cinematic Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-75 ease-out z-10">

          <div className="flex flex-col">
            <span className="text-[9px] tracking-[0.2em] text-[#E8600A] uppercase mb-1">Location</span>
            <span className="text-xs text-[#FAF6EE]/80 font-light">{item.location}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] tracking-[0.2em] text-[#E8600A] uppercase mb-1">Ritual</span>
            <span className="text-xs text-[#FAF6EE]/80 font-light">{item.ritual}</span>
          </div>

          <div className="flex flex-col mt-2">
            <span className="text-[9px] tracking-[0.2em] text-[#E8600A] uppercase mb-1">Time</span>
            <span className="text-xs text-[#FAF6EE]/80 font-light">{item.time}</span>
          </div>

          <div className="flex flex-col mt-2">
            <span className="text-[9px] tracking-[0.2em] text-[#E8600A] uppercase mb-1">Frame Mood</span>
            <span className="text-xs text-[#FAF6EE]/80 font-light italic">{item.mood}</span>
          </div>

        </div>
      </div>

      {/* Recording indicator dot (Flashes gently on hover) */}
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-[#E8600A] opacity-0 group-hover:opacity-100 shadow-[0_0_10px_2px_rgba(232,96,10,0.5)]"
      />
    </motion.div>
  );
};

// ─── MAIN COMPONENT: GallerySection ───
export default function GallerySection() {
  return (
    <section className="relative w-full bg-[#0A0705] py-32 md:py-48 px-6 md:px-12 lg:px-24 overflow-hidden border-t border-[#C9973A]/10">

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,151,58,0.03)_0%,_#0A0705_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="text-[#E8600A] text-[10px] tracking-[0.35em] uppercase mb-6 block font-semibold"
            >
              The Portfolio
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="font-['Cormorant_Garamond'] text-[clamp(40px,5vw,70px)] text-[#FAF6EE] leading-[1.05] font-light"
            >
              Memories, already <br className="hidden md:block" />
              <span className="italic text-[#E2BC6E]">in the making</span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-[#8C7B6E] text-lg font-light max-w-sm leading-relaxed pb-2"
          >
            Each couple leaves us with a frame that could only exist in Varanasi. Hover over a frame to see it breathe.
          </motion.p>
        </div>

        {/* Editorial Masonry Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {MEMORIES.map((item, index) => (
            <MemoryCard key={item.id} item={item} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}