import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import aboutPageImg1 from "../../../Asset/ClientImage/aboutPageImg1.jpg"
import aboutPageImg2 from "../../../Asset/ClientImage/aboutPageImg2.jpg"
import aboutPageImg3 from "../../../Asset/ClientImage/aboutPageImg3.jpg"
import aboutPageImg4 from "../../../Asset/ClientImage/aboutPageImg4.jpg"
import aboutPageImg5 from "../../../Asset/ClientImage/aboutPageImg5.jpg"
import aboutPageImg6 from "../../../Asset/ClientImage/aboutPageImg6.jpg"
import aboutPageImg7 from "../../../Asset/ClientImage/aboutPageImg7.jpg"
import amanSingh from "../../../Asset/ClientImage/amansingh.jpg"
import yogeshDubey from "../../../Asset/ClientImage/yogeshdubey.jpg"

import { useStudioDetails } from '../../../Context/StudioDetailsContext';
const AboutPage = () => {
  const { studioContact } = useStudioDetails();

  const storyTimeline = [
    {
      year: '2015',
      event:
        'A broken tripod sparked an unlikely friendship in the heart of Mumbai’s buzzing studios.',
    },
    { year: '2018', event: 'First viral YouTube love story' },
    { year: '2020', event: 'WeddingBoys founded.' },
    {
      year: '2022',
      event:
        'WeddingBoys continues to capture genuine moments of love and joy, one frame at a time.',
    },
    { year: 'Present', event: '500+ love stories captured.' },
  ];

  return (
    <div className="min-h-screen sm:bg-primary_on/40 lg:bg-primary_on/10 font-primary lg:mt-4 ">
      {/* Hero & Founders Story Section */}
      <section className="relative lg:py-16 sm:py-8 px-4 md:px-8">
        {/* Background image and overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${aboutPageImg1})`, backgroundSize: 'cover',
            backgroundPosition: '50% center',
          }}
        ></div>
        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl md:text-4xl font-bold mb-8 text-white"
          >
            Every Love Story is Unique
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg mb-12 text-white"
          >
            In the heart of Mumbai, two visionaries—Yogesh, whose lens captures magic, and Aman, whose words craft timeless tales—began a journey that transformed moments into masterpieces. What started with a broken tripod and a secondhand camera evolved into WeddingBoys: a celebration of love through every ceremony, be it weddings, pre-weddings, haldi, mehendi, destination weddings, baby showers, or engagements.
          </motion.p>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center"
            >
              <img
                src={yogeshDubey}
                alt="Yogesh Dubey"
                className="w-48 h-48 rounded-full object-cover shadow-2xl"
              />
              <h3 className="mt-4 text-xl font-semibold text-white">Yogesh Dubey</h3>
              <p className="text-white">The visionary behind the lens</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <img
                src={amanSingh}
                alt="Aman Singh"
                className="w-48 h-48 rounded-full object-cover shadow-2xl"
              />
              <h3 className="mt-4 text-xl font-semibold text-white">Aman Singh</h3>
              <p className="text-white">The storyteller weaving magic</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founders & Vision Section */}
      <section className="relative lg:py-10 sm:py-5 sm:px-2 lg:px-3 mt-6 ">

        <div className="relative px-4 py-4 max-w-7xl mx-auto grid lg:grid-cols-2 lg:gap-12 sm:gap-8 sm:items-center justify-center rounded-lg bg-primary_on/50 text-primary">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative lg:h-64 lg:w-72 sm:h-56 sm:w-auto mx-auto"
          >
            <img
              src="https://kinsta.com/wp-content/uploads/2021/11/about-us-page.png"
              alt="Founders Yogesh & Aman"
              className="object-cover rounded-2xl shadow-2xl w-full h-full "
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="lg:text-desktopHeadlineSmall sm:text-mobileBodyLarge font-semibold mb-6 text-center">
              The Visionaries Behind the Lens
            </h2>
            <p className="lg:text-desktopBodyMedium sm:text-mobileBodyMedium   mb-8 text-center">
              With hearts that beat in sync and a passion for storytelling, Yogesh and Aman have turned chance encounters into a legacy of love and memories...
            </p>
            <motion.div whileTap={{ scale: 0.95 }} className="w-fit mx-auto">
              <NavLink to={"/team"} className="bg-primary_on   px-6 py-2 rounded-lg hover:bg-secondary transition-colors duration-300 shadow-lg">
                Meet the Team
              </NavLink>
            </motion.div>
          </motion.div>
        </div>
        {/* Clients Section - Overlapping Avatars */}
        <div className="max-w-6xl mx-auto  mt-20">
          <h3 className="text-2xl font-bold text-center mb-6 text-tertiary_on">
            Our Beloved Clients
          </h3>
          <div className="flex justify-center">
            <div className="flex lg:-space-x-8 sm:-space-x-9 rtl:space-x-reverse">
              {[
                aboutPageImg2,
                aboutPageImg3,
                aboutPageImg4,
                aboutPageImg5,
                aboutPageImg6,
                aboutPageImg7,
              ].map((src, index) => (
                <motion.img
                  key={index}
                  src={src}
                  alt={`Client ${index + 1}`}
                  className="  sm:w-20 sm:h-20  md:w-24 md:h-24 lg:w-28 lg:h-28  border-2 border-white rounded-full shadow-md cursor-pointer object-cover"
                  whileHover={{ y: -5, zIndex: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              ))}
              <motion.a
                href="#"
                className="flex items-center justify-center  sm:w-20 sm:h-20  md:w-24 md:h-24 lg:w-28 lg:h-28 text-xl font-medium text-white bg-gray-700 border-2 border-white rounded-full hover:bg-gray-600"
                whileHover={{ y: -5, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                500+
              </motion.a>
            </div>
          </div>
        </div>
      </section >


      {/* Timeline Section */}
      <section className="py-16   ">

        <div className="mx-auto sm:px-4 w-full lg:px-12">
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="bg-[#E5BDA7] sm:visible md:hidden absolute left-1/2 top-0 w-0.5 h-[95%] -translate-x-1/2 z-0" ></div>

            {storyTimeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`flex flex-col md:flex-row items-center mb-4 gap-2 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-[#a27b57]  text-white border-2 border-[#967251e4] rounded-full flex items-center justify-center shadow-md z-30 ">
                  <span className="text-xl md:text-2xl font-bold ">{item.year}</span>
                </div>
                <div className="flex-1 bg-[#f9deb2] p-6 rounded-xl shadow-sm z-30">
                  <p className="text-lg text-gray-700">{item.event}</p>
                </div>
              </motion.div>
            ))}

            {/* Continuing Journey */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              className="text-center mt-12"
            >
              <div className="inline-flex items-center px-8 py-3 rounded-full bg-[#FAD7A0] text-[#74583E] font-primary">
                <span className="mr-3 text-xl">✨</span>
                Continuing Our Passion Journey
                <span className="ml-3 text-xl">✨</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section >

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative py-16 px-4"
      >
        <div
          className="max-w-4xl mx-auto rounded-xl p-8 md:p-12 text-center bg-tertiary/70 shadow-lg"
        >
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{
              color: '#FAD7A0', // secondary
              fontFamily: 'Oxygen'
            }}
          >
            Ready to Create Your Dream Wedding Film?
          </motion.h2>

          <p
            className="text-lg mb-8 max-w-2xl mx-auto text-white " >
            Let's transform your cherished moments into an unforgettable masterpiece
          </p>

          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <Link
              to={`https://wa.me/${studioContact?.[0] || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-lg text-lg font-medium transition-all hover:shadow-lg bg-secondary_on/50 text-white shadow-lg"
              title="Chat with us on WhatsApp"
            >
              Start Your Journey
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div >
  );
};

export default AboutPage;
