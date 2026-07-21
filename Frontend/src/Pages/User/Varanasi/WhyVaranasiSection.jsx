import React, { useRef, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
 
import fragmentLight from "./fragmentLight.png";
import fragmentLane from "./fragmentLane.png";
import fragmentRitual from "./fragmentRitual.png";
import fragmentRiver from "./fragmentRiver.png";

const REASONS = [
  {
    num: "01",
    title: "The light is unrepeatable",
    body:
      "Pre-dawn on the Ganga produces a fog-softened gold that no studio can recreate. It appears briefly, then disappears into morning prayer and smoke.",
    image: fragmentLight,
    alignment: "left",
  },
  {
    num: "02",
    title: "Every lane is a set",
    body:
      "Narrow galis, marigold vendors, temple thresholds — Varanasi turns even a still frame into cinema through texture, rhythm, and layered chaos.",
    image: fragmentLane,
    alignment: "right",
  },
  {
    num: "03",
    title: "Ritual becomes cinematography",
    body:
      "Nothing here feels staged. Every gesture already carries centuries of symbolism, emotion, repetition, and inherited memory.",
    image: fragmentRitual,
    alignment: "left",
  },
  {
    num: "04",
    title: "The river completes the frame",
    body:
      "The Ganga adds motion, reflection, silence, and scale. It gives the story continuity before the camera even begins recording.",
    image: fragmentRiver,
    alignment: "right",
  },
];

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOTION VARIANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
 

function useGrainBackground() {
  return useMemo(() => {
    return {
      // Re-engineered for a tighter, high-density film grain look
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(0,0,0,0.15) 0.5px, transparent 1px),
        radial-gradient(circle at 0 0, rgba(255,255,255,0.01) 0.5px, transparent 1px),
        radial-gradient(circle at 100% 100%, rgba(0,0,0,0.08) 0.5px, transparent 1.5px),
        radial-gradient(circle at 30% 70%, rgba(255,255,255,0.12) 0.5px, transparent 1px)
      `,
      backgroundSize: `
        4px 4px,
        7px 7px,
        9px 9px,
        13px 13px
      `,
    };
  }, []);
}

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EDITORIAL BLOCK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const EditorialBlock = ({ item, index }) => {
  const blockRef = useRef(null);

  const isLeft = item.alignment === "left";

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DESKTOP PARALLAX
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The IMAGE moves INSIDE the frame
  while the container stays fixed.

  This creates:
  ✓ depth
  ✓ cinematic motion
  ✓ premium storytelling
  ✓ magazine feel
  */

  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start end", "end start"],
  });

  const rawImageY = useTransform(
    scrollYProgress,
    [0, 1],
    index % 2 === 0 ? [-90, 90] : [-60, 60]
  );

  const imageY = useSpring(rawImageY, {
    stiffness: 90,
    damping: 25,
  });

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUBTLE IMAGE SCALE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  const imageScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1.12, 1.18, 1.12]
  );

  return (
    <motion.div
      ref={blockRef}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        margin: "-10%",
      }}
      className={`
        relative
        flex
        flex-col
        ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}
        items-center
        gap-16
        lg:gap-28
        mb-48
        lg:mb-72
      `}
    >
      {/* Giant Number */}
      <div
        className={`
          absolute
          top-1/2
          -translate-y-1/2
          ${
            isLeft
              ? "-left-4 md:-left-16 lg:-left-24"
              : "-right-4 md:-right-16 lg:-right-24"
          }
          pointer-events-none
          select-none
          z-0
        `}
      >
        <span
          className="
            font-['Cormorant_Garamond']
            text-[160px]
            md:text-[260px]
            lg:text-[400px]
            leading-none
            font-semibold
            tracking-[-0.06em]
            text-[#C9973A]/[0.025]
          "
        >
          {item.num}
        </span>
      </div>

      {/* TEXT */}
      <motion.div
        variants={fadeUp}
        className={`
          relative
          z-20
          flex-1
          px-6
          md:px-0
          flex
          flex-col
          ${
            isLeft
              ? "md:items-end md:text-right"
              : "md:items-start md:text-left"
          }
        `}
      >
        <span
          className="
            text-[#D97706]
            text-[10px]
            tracking-[0.4em]
            uppercase
            font-semibold
            mb-5
          "
        >
          Reason {item.num}
        </span>

        <h3
          className="
            font-['Cormorant_Garamond']
            text-[clamp(44px,5vw,84px)]
            leading-[0.92]
            tracking-[-0.04em]
            text-[#1A120D]
            font-light
            max-w-[9ch]
            mb-8
          "
        >
          {item.title}
        </h3>

        <p
          className="
            text-[#7A685B]
            text-[17px]
            md:text-[18px]
            leading-[1.9]
            font-light
            max-w-[430px]
          "
        >
          {item.body}
        </p>
      </motion.div>

      {/* IMAGE */}
      <motion.div
        variants={fadeUp}
        className={`
          relative
          z-10
          flex-1
          w-full
          max-w-[540px]
          px-6
          md:px-0
          ${isLeft ? "md:mr-auto" : "md:ml-auto"}
        `}
      >
        {/* Floating paper */}
        <div
          className="
            absolute
            inset-0
            translate-x-5
            translate-y-5
            border
            border-[#D8C7B4]/40
            bg-white/20
            backdrop-blur-sm
          "
        />

        {/* Main Frame */}
        <div
          className="
            relative
            overflow-hidden
            aspect-[3/4]
            shadow-[0_35px_90px_rgba(28,20,16,0.14)]
            will-change-transform
          "
        >
          {/* Inner Moving Image */}
          <motion.div
            style={{
              y: imageY,
              scale: imageScale,
            }}
            className="absolute inset-[-10%] will-change-transform"
          >
            <img
              src={item.image}
              alt={item.title}
              className="
                w-full
                h-full
                object-cover
                object-center
              "
            />

            {/* Cinematic Darkening */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-[#1A120D]/40
                via-transparent
                to-transparent
              "
            />

            {/* Editorial Edge Burn */}
            <div
              className="
                absolute
                inset-0
                shadow-[inset_0_0_120px_rgba(0,0,0,0.18)]
              "
            />

            {/* Soft Vertical Fade */}
            <div
              className="
                absolute
                inset-x-0
                top-0
                h-32
                bg-gradient-to-b
                from-[#FAF6EE]
                to-transparent
                opacity-40
              "
            />

            {/* Border */}
            <div
              className="
                absolute
                inset-0
                border
                border-white/10
              "
            />
          </motion.div>
        </div>

        {/* Floating Caption */}
        <div
          className={`
            absolute
            -bottom-8
            ${isLeft ? "left-10" : "right-10"}
            bg-[#F8F2E8]/90
            backdrop-blur-md
            px-5
            py-3
            border
            border-[#E7D8C7]/50
            shadow-xl
          `}
        >
          <span
            className="
              text-[11px]
              tracking-[0.25em]
              uppercase
              text-[#8B735F]
            "
          >
            Varanasi, India
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

export default function WhyVaranasiSection() {
  const grainStyle = useGrainBackground();

  return (
    <section
      className="
        relative
        overflow-hidden
        py-36
        md:py-52
      "
    >
{/* Animated Grain Layer */}
<motion.div
  animate={{
    x: [0, -2, 4, -1, 3, 0],
    y: [0, 3, -2, 2, -4, 0],
  }}
  transition={{
    duration: 0.5,
    repeat: Infinity,
    ease: "linear",
  }}
  className="
    absolute
    inset-0
    w-full
    h-full
    opacity-[1]          /* Adjusted for perfect visibility */
    mix-blend-overlay       /* Better than multiply for realistic light/dark noise */
    pointer-events-none
    z-1000                    
  "
  style={grainStyle}
/>

      {/* Ambient Cinematic Glow */}
      <div
        className="
          absolute
          top-0
          left-1/2
          -translate-x-1/2
          w-[900px]
          h-[500px]
          bg-[#F6D8A8]/20
          blur-[140px]
          rounded-full
          pointer-events-none
        "
      />

      {/* Secondary Glow */}
      <div
        className="
          absolute
          bottom-0
          right-0
          w-[500px]
          h-[500px]
          bg-[#E6B980]/10
          blur-[120px]
          rounded-full
          pointer-events-none
        "
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            text-center
            mb-40
            px-6
          "
        >
          <span
            className="
              text-[#D97706]
              text-[10px]
              tracking-[0.45em]
              uppercase
              font-semibold
              block
              mb-7
            "
          >
            Why Varanasi
          </span>

          <h2
            className="
              font-['Cormorant_Garamond']
              text-[clamp(50px,6vw,100px)]
              leading-[0.9]
              tracking-[-0.05em]
              text-[#1A120D]
              font-light
              mb-10
            "
          >
            Four reasons the city
            <br className="hidden md:block" />
            <span className="italic text-[#7E6A5A]">
              photographs itself
            </span>
          </h2>

          <p
            className="
              max-w-2xl
              mx-auto
              text-[#7A685B]
              text-[17px]
              md:text-[18px]
              leading-[1.95]
              font-light
            "
          >
            Some places need direction. Varanasi only needs
            presence. Every frame already contains atmosphere,
            ritual, texture, and memory before the camera arrives.
          </p>
        </motion.div>

        {/* BLOCKS */}
        <div className="relative">
          {REASONS.map((item, index) => (
            <EditorialBlock
              key={item.num}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}