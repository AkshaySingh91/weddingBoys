'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiEdit, FiCalendar, FiCheckCircle, FiAward } from 'react-icons/fi';

const steps = [
  {
    title: "Initial Consultation",
    number: "1",
    description:
      "We begin by understanding your unique vision and dreams in an in-depth consultation. Your story sets the foundation for a cinematic masterpiece.",
    icon: <FiPhone className="text-3xl text-rose-500" />,
  },
  {
    title: "Tailored Package Creation",
    number: "2",
    description:
      "Our team designs a bespoke package that perfectly balances creativity with practicality, ensuring every detail is covered.",
    icon: <FiEdit className="text-3xl text-rose-500" />,
  },
  {
    title: "Pre-Wedding Planning",
    number: "3",
    description:
      "We conduct venue visits, craft detailed shot lists, and meticulously plan every moment to guarantee nothing is missed.",
    icon: <FiCalendar className="text-3xl text-rose-500" />,
  },
  {
    title: "Wedding Day Magic",
    number: "4",
    description:
      "Our skilled team captures every heartfelt moment and candid smile with artistic precision and technical excellence.",
    icon: <FiCheckCircle className="text-3xl text-rose-500" />,
  },
  {
    title: "Post-Production Mastery",
    number: "5",
    description:
      "Finally, we curate and refine your visuals into a timeless cinematic piece that tells your unique love story.",
    icon: <FiAward className="text-3xl text-rose-500" />,
  },
];

// Random values are generated client-side only (post-mount) so server and
// client markup match on first paint — Math.random() during render would
// otherwise produce a hydration mismatch under Next.js SSR (see
// Component/Background.jsx for the established fix pattern).
function makeParticles() {
  return Array.from({ length: 15 }, () => ({
    initialY: Math.random() * 50,
    initialX: Math.random() * 50,
    animX: [Math.random() * 20, Math.random() * 20 + 10],
    animRotate: Math.random() * 360,
    duration: 15 + Math.random() * 5,
    delay: Math.random() * 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  }));
}

export default function OurApproach() {
  const [particles, setParticles] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(makeParticles());
  }, []);

  return (
    <div
      id="process"
      className="relative bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] overflow-hidden py-16 sm:px-4  lg:px-8 lg:rounded-3xl sm:rounded-lg">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Particles */}
        {particles?.map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full bg-rose-200/40"
            initial={{
              y: particle.initialY,
              x: particle.initialX,
              scale: 0,
            }}
            animate={{
              y: [0, 100, 0],
              x: particle.animX,
              scale: [0, 1, 0],
              rotate: particle.animRotate,
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
              delay: particle.delay,
            }}
            style={{
              left: particle.left,
              top: particle.top,
            }}
          />
        ))}
        {/* Henna Wave Accent */}
        <div className="absolute top-0 left-0 w-full -translate-y-1/3">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path
              fill="#FF6969"
              fillOpacity="0.1"
              d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center">
          <p className="text-rose-500 font-semibold uppercase tracking-widest bg-red-200 rounded-md w-fit mx-auto px-2">
            OUR APPROACH
          </p>
          <h1 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium font-bold mt-2 text-gray-900">
            How We Craft Your Dream Wedding Story
          </h1>
          <p className="lg:text-desktopHeadlineSmall sm:text-mobileBodyLarge text-gray-600 mt-4 max-w-2xl mx-auto">
            Our process combines artistic vision with meticulous planning—ensuring every detail of your wedding is captured with passion and precision.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Central Vertical Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full border-l-2 border-rose-500"></div>
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative flex items-center ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}>
                  <motion.h2
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="lg:text-desktopBodyLarge sm:text-mobileBodyLarge font-semibold"
                  >
                    {step.title} <span className="text-rose-500">{step.number}</span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-2 lg:text-desktopBodyLarge sm:text-mobileBodyLarge text-gray-600"
                  >
                    {step.description}
                  </motion.p>
                </div>
                {/* Icon in the Center */}
                <div className="absolute left-1/2 transform -translate-x-1/2 bg-white rounded-full border-2 border-rose-500 p-3 z-10">
                  {step.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
