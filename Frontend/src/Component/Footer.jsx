import React from 'react'
import facebookLogo from '../Asset/facebookLogo.svg'
import instagramLogo from '../Asset/instagramLogo.svg'
import twitterLogo from '../Asset/twitterLogo.svg'
import youtubeLogo from '../Asset/youtubeLogo.svg'
import { useStudioDetails } from '../Context/StudioDetailsContext'
import { Link } from "react-router-dom"
import footerVideo from "../Asset/ClientImage/footerVideo.mp4"
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";


export default function Footer() {
  const { studioName, studioAddress, studioContact, studioEmail, studioSocials } = useStudioDetails();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const childVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const socialVariants = {
    hover: { scale: 1.2, rotate: [0, -10, 10, 0] },
    tap: { scale: 0.9 },
  };

  // Build an array of contact info objects so we can easily switch based on type.
  const contacts = [
    {
      label: "Phone",
      value: [{ no: studioContact?.[0], getHref: (value) => `tel:${value}` }, { no: studioContact?.[1], getHref: (value) => `https://wa.me/${value || ''}`, }],
      tooltip: "Call Now",
    },
    {
      label: "Address",
      value: studioAddress,
      getHref: (value) =>
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`,
      tooltip: "View on Map",
    },
    {
      label: "Email",
      value: studioEmail,
      getHref: (value) => `mailto:${value}`,
      tooltip: "Send Email",
    },
  ];

  return (
    <footer className="relative w-full mt-20 overflow-hidden" ref={ref}>
      {/* Animated Background Video */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
      >
        <video
          src={footerVideo}
          autoPlay
          loop
          muted
          className="w-full h-full object-cover rounded-t-[5rem] lg:rounded-t-[5rem] sm:rounded-t-3xl"
        />
      </motion.div>

      {/* Glassmorphic Overlay with Staggered Animations */}
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative z-10 backdrop-blur-sm text-[#fcebd1] rounded-t-[5rem] lg:rounded-t-[5rem] sm:rounded-t-3xl"
      >
        <div className="w-full mx-auto px-6 py-6 flex flex-col gap-6">
          {/* Contact Section */}
          <motion.div
            variants={childVariants}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="lg:grid lg:grid-cols-3 sm:flex sm:flex-col gap-4 p-4 bg-[rgba(63,63,63,0.32)] rounded-3xl shadow-md backdrop-blur-md min-h-[50px] items-center">
              <motion.div
                variants={childVariants}
                className="flex flex-col items-center gap-3 break-all relative group"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="font-bold text-mobileBodyMedium">{contacts[0].label}</h3>
                {contacts[0].value[0] ?
                  <div className='flex flex-col lg:gap-4 sm:gap-2'>
                    <a
                      href={contacts[0].value[0].getHref(contacts[0].value[0].no)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words"
                    >
                      <p>{contacts[0].value[0].no}</p>
                    </a>
                    <a
                      href={contacts[0].value[1].getHref(contacts[0].value[1].no)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words"
                    >
                      <p>{contacts[0].value[1].no}</p>
                    </a>
                  </div>

                  : (
                    <div className="flex flex-col gap-2 justify-center items-center">
                      <span className="block animate-pulse bg-slate-400 rounded-xl sm:w-60 lg:w-60 h-5" />
                      <span className="block animate-pulse bg-slate-400 rounded-xl sm:w-48 lg:w-48 h-5" />
                      <span className="block animate-pulse bg-slate-400 rounded-xl sm:w-52 lg:w-52 h-5" />
                    </div>
                  )}
              </motion.div>
              {contacts.slice(1).map((contact, index) => (
                <motion.div
                  key={index}
                  variants={childVariants}
                  className="flex flex-col items-center gap-3 break-all relative group"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="font-bold text-mobileBodyMedium">{contact.label}</h3>
                  {contact.value ? (
                    <a
                      href={contact.getHref(contact.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words"
                    >
                      <p>{contact.value}</p>
                    </a>
                  ) : (
                    <div className="flex flex-col gap-2 justify-center items-center">
                      <span className="block animate-pulse bg-slate-400 rounded-xl sm:w-60 lg:w-60 h-5" />
                      <span className="block animate-pulse bg-slate-400 rounded-xl sm:w-48 lg:w-48 h-5" />
                      <span className="block animate-pulse bg-slate-400 rounded-xl sm:w-52 lg:w-52 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Social Links with Interactive Animations */}
          <motion.div
            variants={childVariants}
            className="flex flex-col items-center gap-4"
          >
            <h2 className="font-bold text-mobileBodyMedium">Social</h2>
            <div className="flex gap-4">
              {[
                studioSocials?.instagram,
                studioSocials?.facebook,
                studioSocials?.youtube,
                studioSocials?.x,
              ].map((link, index) => (
                <motion.div
                  key={index}
                  variants={socialVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link to={link || "#"} target="_blank">
                    <img
                      src={[
                        instagramLogo,
                        facebookLogo,
                        youtubeLogo,
                        twitterLogo,
                      ][index]}
                      alt="Social Icon"
                      className="w-8 h-8 sm:w-10 sm:h-10"
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Enquire Button with Smooth Transition (hidden on mobile) */}
        <motion.div
          variants={childVariants}
          className="hidden md:flex justify-center my-4"
          whileHover={{ scale: 1.05 }}
        >
          <Link
            to="/contact"
            className="group flex items-center bg-secondary_on text-white px-4 py-2 rounded-3xl transition-transform"
          >
            <motion.span layout className="relative overflow-hidden">
              <motion.span
                animate={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Enquire Now
              </motion.span>
            </motion.span>
            <motion.svg
              className="w-6 h-6 ml-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              fill="white"
              animate={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
            </motion.svg>
          </Link>
        </motion.div>

        {/* Footer Note with Fade-in Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center px-8 text-sm lg:text-desktopBodySmall sm:pb-24 md:pb-10"
        >
          © 2024 - {studioName || "Wedding Boys"} | All Rights Reserved.
        </motion.div>
      </motion.div>
    </footer>
  );
}


