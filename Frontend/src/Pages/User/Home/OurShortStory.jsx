import { Link } from "react-router-dom";
import React from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaStar } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import { useMediaQuery } from "react-responsive";
import img from "../../../Asset/Home/homepage_short_story.jpg"

export default function OurStory() {
  const isMobile = useMediaQuery({ maxWidth: 640 }); // Tailwind's 'sm' breakpoint

  return (
    <div className="bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden w-full lg:rounded-3xl sm:rounded-lg">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
            initial={{
              y: Math.random() * 100,
              x: Math.random() * 100,
              scale: 0,
            }}
            animate={{
              y: [0, -100],
              x: [0, Math.random() * 50 - 25],
              scale: [0, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Henna Pattern Accent */}
      <div className="absolute top-0 left-0 w-full">
        <svg viewBox="0 0 1440 320" className="w-full">
          <path
            fill="#FF6969"
            fillOpacity="0.1"
            d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10">
          {/* Left Column: Image with Stats Overlay */}
          <div className="w-full lg:w-2/5 relative">
            <motion.div
              initial={{ opacity: 0, x: isMobile ? 0 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              {/* Floating Sparkles on Image */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 sm:w-4 sm:h-4"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [0, -40],
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 1,
                    }}
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                    }}
                  >
                    <FaStar className="w-full h-full text-[#FFD700]/40" />
                  </motion.div>
                ))}
              </div>

              <motion.img
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                src={img}
                alt="Wedding celebration captured beautifully"
                className="rounded-t-lg shadow-lg w-full h-64 md:h-72 object-cover bg-top relative z-10"
              />
            </motion.div>

            {/* Floating Garland Connector */}
            {!isMobile && (
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 w-full flex justify-center"
              >
                <svg viewBox="0 0 500 50" className="w-full">
                  <path
                    fill="none"
                    stroke="#FF6969"
                    strokeWidth="2"
                    d="M0,25 Q250,0 500,25 T1000,25"
                  />
                </svg>
              </motion.div>
            )}

            {/* Statistics Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-white rounded-b-lg shadow-lg px-2 py-4 mt-0 flex justify-evenly items-center relative z-20"
            >
              {[500, 100, 8].map((number, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center px-3"
                >
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {number}+
                  </p>
                  <p className="text-xs text-gray-600">
                    {["Weddings", "Pre-Weddings", "Years"][index]}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Story Content */}
          <div className="w-full lg:w-3/5 relative">
            {/* Floating Camera Icon as Decoration (hidden on mobile) */}
            {!isMobile && (
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 right-0 text-[#FF6969]/20"
              >
                <FiCamera className="w-16 h-16 sm:w-24 sm:h-24" />
              </motion.div>
            )}

            {/* Animated Saree Drape Accent */}
            {!isMobile && (
              <motion.div
                animate={{ x: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-30"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path
                    d="M10,10 Q50,0 90,10 T90,90 Q50,100 10,90 Z"
                    fill="#FF6969"
                    fillOpacity="0.1"
                  />
                </svg>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="md:mt-6 lg:mt-0 sm:px-2 lg:px-0"
            >
              <div className="text-red-600 uppercase text-xs sm:text-sm font-bold mb-2 tracking-wider px-2 py-1 rounded-md bg-red-100 inline-block relative z-10">
                <motion.span
                  animate={{ rotate: [0, 15, 0] }}
                  transition={{ duration: 8, repeat: Infinity }}
                  className="mr-2"
                >
                  ❤️
                </motion.span>
                Our Story
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary relative z-10">
                Professional Wedding Storytellers
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-32 sm:w-48 h-1 bg-[#FFD700] mt-2 rounded-full"
                  style={{ originX: 0 }}
                />
              </h1>

              {/* Content Paragraph with Floating Rings Decoration */}
              <div className="relative">
                {[...Array(2)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 1.5,
                    }}
                    style={{
                      left: `${i * 40 + 10}%`,
                      top: `${i * 30 + 20}%`,
                    }}
                  >
                    <svg
                      viewBox="0 0 50 50"
                      className="w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <circle
                        cx="25"
                        cy="25"
                        r="20"
                        stroke="#FFD700"
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle
                        cx="25"
                        cy="25"
                        r="10"
                        stroke="#FFD700"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </motion.div>
                ))}

                <p className="text-sm sm:text-base text-gray-700 mb-4 relative z-10">
                  Founded in 2020, our journey began with a passion to transform
                  wedding photography and cinematography into an art form. We
                  blend creativity with technical expertise to craft timeless
                  stories that reflect your unique love.
                </p>
              </div>

              {/* Core Values List */}
              <h2 className="text-base sm:text-lg font-bold mb-4 text-primary relative z-10">
                Our Core Values
              </h2>
              <ul className="text-gray-700 mb-8 space-y-2 relative z-10">
                {[
                  "Artistic excellence in every frame",
                  "Unobtrusive approach to capture genuine moments",
                  "Deep cultural understanding of wedding traditions",
                  "Personalized service for every couple",
                  "Innovation with cutting-edge technology",
                ].map((value, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center"
                    whileHover={{ x: 10 }}
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mr-2"
                    >
                      <FaCheckCircle className="text-red-500" />
                    </motion.span>
                    {value}
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button with Floating Intertwined Rings Decoration */}
              <Link
                to="/about-us"
                className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-red-400 transition-colors duration-300 relative overflow-hidden inline-block z-10"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -right-4 -top-4 opacity-30"
                >
                  <FaStar className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFD700]" />
                </motion.div>
                Who We Are
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
