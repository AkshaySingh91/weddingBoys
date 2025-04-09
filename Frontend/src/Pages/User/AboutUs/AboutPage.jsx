import React from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiHeart, FiVideo, FiStar, FiAward } from 'react-icons/fi';
import { FaInfoCircle, FaCreditCard, FaGlobe } from "react-icons/fa"
import aboutPageImg1 from "../../../Asset/ClientImage/aboutPageImg1.jpg";
import aboutPageImg2 from "../../../Asset/ClientImage/aboutPageImg2.jpg";
import aboutPageImg3 from "../../../Asset/ClientImage/aboutPageImg3.jpg";
import aboutPageImg4 from "../../../Asset/ClientImage/aboutPageImg4.jpg";
import aboutPageImg5 from "../../../Asset/ClientImage/aboutPageImg5.jpg";
import aboutPageImg6 from "../../../Asset/ClientImage/aboutPageImg6.jpg";
import aboutPageImg7 from "../../../Asset/ClientImage/aboutPageImg7.jpg";
import amanSingh from "../../../Asset/ClientImage/amansingh.jpg";
import yogeshDubey from "../../../Asset/ClientImage/yogeshdubey.jpg";
import { useStudioDetails } from '../../../Context/StudioDetailsContext';

const AboutPage = () => {
  const { studioContact } = useStudioDetails();

  const storyTimeline = [
    {
      year: '2015',
      event: 'A broken tripod sparked an unlikely friendship in the heart of Mumbai’s buzzing studios.',
    },
    { year: '2018', event: 'First viral YouTube love story' },
    { year: '2020', event: 'WeddingBoys founded.' },
    {
      year: '2022',
      event: 'WeddingBoys continues to capture genuine moments of love and joy, one frame at a time.',
    },
    { year: 'Present', event: '500+ love stories captured.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b  relative overflow-hidden">
      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Golden Particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#FFD700]/30 rounded-full"
            animate={{
              y: [0, 100],
              x: [0, Math.random() * 50 - 25],
              opacity: [1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 20}%`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex lg:items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${aboutPageImg1})`, backgroundSize: 'cover',
              backgroundPosition: '50% center',
            }}
          ></div>
          {/* <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div> */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ffdccc7b] to-transparent" />
        </div>

        <motion.div
          className="relative z-10 max-w-4xl text-center sm:py-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-12 relative inline-block">
            <h1 className="sm:text-mobileHeadlineLarge lg:text-desktopHeadlineLarge text-5xl  font-bold text-[#54382E] mb-6">
              Crafting Timeless<br />Love Stories
            </h1>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#FF6969] rounded-full" />
          </div>

          <motion.p
            className="sm:text-mobileBodyLarge lg:text-desktopHeadlineSmall text-lg text-[#74583E] mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            In the heart of Mumbai, two visionaries—Yogesh, whose lens captures magic,
            and Aman, whose words craft timeless tales—began a journey that transformed
            moments into masterpieces.
          </motion.p>
        </motion.div>
      </section>

      {/* Founders Section */}
      <section className="relative py-20 px-4 md:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="relative group"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={yogeshDubey}
                alt="Yogesh Dubey"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-3xl font-bold">Yogesh Dubey</h3>
                <p className="text-lg opacity-90">Founder</p>
              </div>
            </div>

            <div className="absolute -right-8 -top-8 z-10">
              <FiCamera className="w-16 h-16 text-[#FF6969]/30" />
            </div>
          </motion.div>

          <motion.div
            className="relative group"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={amanSingh}
                alt="Aman Singh"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-3xl font-bold">Aman Singh</h3>
                <p className="text-lg opacity-90">Founder</p>
              </div>
            </div>

            <div className="absolute -left-8 -top-8 z-10">
              <FiVideo className="w-16 h-16 text-[#FF6969]/30" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 sm:py-10 px-4 relative bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] ">
        <div className="max-w-6xl mx-auto">
          {/* Gradient Waves */}
          <div className="absolute top-0 left-0 w-full -translate-y-1/3">
            <svg viewBox="0 0 1440 320" className="w-full">
              <path
                fill="#FF6969"
                fillOpacity="0.05"
                d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
              ></path>
            </svg>
          </div>
          <motion.h3
            className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-[#FF6969] to-[#FF9640]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Trusted by 500+ Couples

          </motion.h3>

          <div className="relative flex justify-center">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF6969]/10 blur-3xl rounded-full" />
            <motion.div
              className="flex lg:-space-x-6 sm:-space-x-8"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
            >
              {[aboutPageImg2, aboutPageImg3, aboutPageImg4, aboutPageImg5, aboutPageImg6, aboutPageImg7].map((src, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="relative"
                >
                  <img
                    src={src}
                    alt={`Client ${i + 1}`}
                    className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 border-3 border-white rounded-full shadow-lg object-cover"
                  />
                  <div className="absolute inset-0 border border-[#FF6969]/20 rounded-full pointer-events-none" />
                </motion.div>
              ))}
              <motion.div
                className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 text-xl font-bold text-white bg-[#FF6969] border-3 border-white rounded-full shadow-lg"
                whileHover={{ y: -10 }}
              >
                500+
              </motion.div>
            </motion.div>
          </div>
          {/* Stats Banner */}
          <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-[#FFE5D5] hover:border-[#FFD0B5] transition-all relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF6969]/10 rounded-full blur-xl" />
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-[#FFF0E6] rounded-xl">
                  {React.cloneElement(<FiHeart />, { className: "w-8 h-8 text-[#FF6969]" })}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#54382E] mb-2">
                500+
              </h3>
              <p className="text-[#74583E] sm:text-sm text-center leading-relaxed">
                Happy Couples
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-[#FFE5D5] hover:border-[#FFD0B5] transition-all relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF6969]/10 rounded-full blur-xl" />
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-[#FFF0E6] rounded-xl">
                  {React.cloneElement(<FiCamera />, { className: "w-8 h-8 text-[#FF6969]" })}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#54382E] mb-2">
                500+
              </h3>
              <p className="text-[#74583E] leading-relaxed">
                Moments Captured
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-[#FFE5D5] hover:border-[#FFD0B5] transition-all relative overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF6969]/10 rounded-full blur-xl" />
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-[#FFF0E6] rounded-xl">
                  {React.cloneElement(<FiAward />, { className: "w-8 h-8 text-[#FF6969]" })}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#54382E] mb-2">
                10+
              </h3>
              <p className="text-[#74583E] leading-relaxed">
                Awards Won
              </p>
            </motion.div>
          </div>
          {/* Floating Golden Confetti */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-[#FFD700]/30 rounded-full"
                initial={{ y: -100, x: Math.random() * 100 }}
                animate={{
                  y: [0, 1000],
                  x: [Math.random() * 50, Math.random() * 100 + 50]
                }}
                transition={{
                  duration: 8 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 3
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  rotate: Math.random() * 360
                }}
              />
            ))}
          </div>
          {/* Animated Mandala Background */}
          {/* <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-[200%] opacity-[0.03]"
          >
            <svg viewBox="0 0 500 500" className="text-[#FF6969]">
              <path fill="currentColor" d="M250 0c-34.6 0-67.9 6.9-99 19.6-30.2 12.3-57.5 29.9-81 51.4-23.5 21.5-42.9 46.8-57.1 75-14.2 28.2-22.9 58.8-25.4 90.6C5.9 269 12.5 301 25 331c12.5 30 30.9 57.5 54.4 81 23.5 23.5 51 41.9 81 54.4 30 12.5 62 19.1 94.6 19.1s64.6-6.6 94.6-19.1c30-12.5 57.5-30.9 81-54.4 23.5-23.5 41.9-51 54.4-81 12.5-30 19.1-62 19.1-94.6s-6.6-64.6-19.1-94.6c-12.5-30-30.9-57.5-54.4-81-23.5-23.5-51-41.9-81-54.4C317.9 6.9 284.6 0 250 0z" />
            </svg>
          </motion.div> */}

          {/* Dynamic Border Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6969]/30 via-[#FFD700]/30 to-[#FF6969]/30" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6969]/30 via-[#FFD700]/30 to-[#FF6969]/30" />

          {/* Floating Floral Cluster */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-8 right-8 w-24 opacity-15"
          >
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 12a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0v-8a4 4 0 0 1 4-4z" fill="#FF6969" />
              <path d="M48 28a4 4 0 0 1 4 4v8a4 4 0 1 1-8 0v-8a4 4 0 0 1 4-4z" fill="#FFD700" />
              <circle cx="16" cy="40" r="4" fill="#FF6969" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-2">
          <motion.h2
            className="text-4xl font-bold text-center mb-16 text-[#54382E]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            Our Journey Through Time
          </motion.h2>

          <div className="relative">
            <div className="absolute left-1/2 w-0.5 h-full bg-gradient-to-b from-[#FF6969] to-[#FFD700] transform -translate-x-1/2" />

            {storyTimeline.map((item, index) => (
              <motion.div
                key={item.year}
                className="flex items-center mb-16 sm:mb-8 even:flex-row-reverse"
                initial={{ opacity: 0, x: index % 2 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <div className="w-1/2 px-8 sm:px-2">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-[#FF6969]/10 relative">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF6969]/10 rounded-full blur-xl" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#FF6969] rounded-full flex items-center justify-center text-white">
                      <FiStar className="w-4 h-4" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#54382E] mb-2">{item.year}</h3>
                    <p className="text-[#74583E]">{item.event}</p>
                  </div>
                </div>
                <div className="w-1/2 flex justify-center">
                  <div className="w-auto h-auto rounded-full bg-[#FF6969] flex items-center justify-center text-white text-xl font-bold shadow-lg py-2 px-3">
                    {item.year}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 sm:py-10 bg-gradient-to-br from-[#FF6969]/5 to-[#FFD700]/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            className="bg-white rounded-3xl sm:p-6 p-12 shadow-2xl relative overflow-hidden"
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
          >
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#FF6969]/10 rounded-full blur-3xl" />

            <h2 className="sm:text-mobileHeadlineMedium lg:text-desktopHeadlineMedium text-4xl font-bold text-[#54382E] mb-6">
              Ready to Begin Your<br />Everlasting Story?
            </h2>

            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-[#FF6969] to-[#FF9640] px-12 py-4 rounded-full text-white font-bold flex items-center gap-3 mx-auto hover:shadow-xl transition-all text-nowrap sm:px-3 sm:py-2"
            >
              <FiHeart className="flex-shrink-0 w-5 h-5" />
              Start Your Journey
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
