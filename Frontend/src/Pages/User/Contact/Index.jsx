import React, { useState } from 'react'
import { Link } from "react-router-dom"
import { useStudioDetails } from '../../../Context/StudioDetailsContext'
import Swal from 'sweetalert2';
import success from "./success.svg"
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from "lucide-react";

import officeImage1 from "../../../Asset/Office/img1.jpg"
import officeImage2 from "../../../Asset/Office/img2.jpg"
import officeImage3 from "../../../Asset/Office/img3.jpg"
const images = [officeImage1, officeImage2, officeImage3];

const api_url = import.meta.env.VITE_API_URL;
const WhatsAppButton = ({ studioContact }) => {
  const fireworkVariants = {
    initial: { scale: 0, opacity: 1 },
    animate: (i) => ({
      scale: 1,
      opacity: 0,
      transition: {
        delay: i * 0.02,
        duration: 0.8,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 1.5, // adjust delay between bursts as needed
      },
    }),
  };

  return (
    <div className="fixed lg:bottom-4 lg:right-4 sm:bottom-10 sm:right-4 z-50">
      <motion.div
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="relative"
      >
        {/* Continuous Fireworks Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            variants={fireworkVariants}
            initial="initial"
            animate="animate"
            custom={i}
            className="absolute w-2 h-2 rounded-full bg-[#ff8800] pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              translateX: "-50%",
              translateY: "-50%",
              x: Math.cos((i * 30 * Math.PI) / 180) * 50,
              y: Math.sin((i * 30 * Math.PI) / 180) * 50,
            }}
          />
        ))}

        {/* Continuous Pulse Effect */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl bg-[#ffd700]/20"
        />

        {/* Main Button */}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0] }}
          whileTap={{ scale: 0.9 }}
        >
          <Link
            to={`https://wa.me/${studioContact?.[0] || ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center py-3 px-4 bg-gradient-to-r from-[#f7d4a3] to-[#ffdcace2] rounded-2xl shadow-lg border-[1px] border-[#ffa200] overflow-hidden"
            title="Chat with us on WhatsApp"
          >
            {/* Hover Ripple Effect */}
            <motion.div
              className="absolute inset-0 bg-[#ffd700]/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />

            {/* Animated Icon */}
            <motion.svg
              className="w-8 h-10 fill-[#ffa200]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 308 308"
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <path d="M227.904,176.981c-0.6-0.288-23.054-11.345-27.044-12.781c-1.629-0.585-3.374-1.156-5.23-1.156
              c-3.032,0-5.579,1.511-7.563,4.479c-2.243,3.334-9.033,11.271-11.131,13.642c-0.274,0.313-0.648,0.687-0.872,0.687
              c-0.201,0-3.676-1.431-4.728-1.888c-24.087-10.463-42.37-35.624-44.877-39.867c-0.358-0.61-0.373-0.887-0.376-0.887
              c0.088-0.323,0.898-1.135,1.316-1.554c1.223-1.21,2.548-2.805,3.83-4.348c0.607-0.731,1.215-1.463,1.812-2.153
              c1.86-2.164,2.688-3.844,3.648-5.79l0.503-1.011c2.344-4.657,0.342-8.587-0.305-9.856c-0.531-1.062-10.012-23.944-11.02-26.348
              c-2.424-5.801-5.627-8.502-10.078-8.502c-0.413,0,0,0-1.732,0.073c-2.109,0.089-13.594,1.601-18.672,4.802
              c-5.385,3.395-14.495,14.217-14.495,33.249c0,17.129,10.87,33.302,15.537,39.453c0.116,0.155,0.329,0.47,0.638,0.922
              c17.873,26.102,40.154,45.446,62.741,54.469c21.745,8.686,32.042,9.69,37.896,9.69c0.001,0,0.001,0,0.001,0
              c2.46,0,4.429-0.193,6.166-0.364l1.102-0.105c7.512-0.666,24.02-9.22,27.775-19.655c2.958-8.219,3.738-17.199,1.77-20.458
              C233.168,179.508,230.845,178.393,227.904,176.981z"/>
              <path d="M156.734,0C73.318,0,5.454,67.354,5.454,150.143c0,26.777,7.166,52.988,20.741,75.928L0.212,302.716
              c-0.484,1.429-0.124,3.009,0.933,4.085C1.908,307.58,2.943,308,4,308c0.405,0,0.813-0.061,1.211-0.188l79.92-25.396
              c21.87,11.685,46.588,17.853,71.604,17.853C240.143,300.27,308,232.923,308,150.143C308,67.354,240.143,0,156.734,0z
              M156.734,268.994c-23.539,0-46.338-6.797-65.936-19.657c-0.659-0.433-1.424-0.655-2.194-0.655c-0.407,0-0.815,0.062-1.212,0.188
              l-40.035,12.726l12.924-38.129c0.418-1.234,0.209-2.595-0.561-3.647c-14.924-20.392-22.813-44.485-22.813-69.677
              c0-65.543,53.754-118.867,119.826-118.867c66.064,0,119.812,53.324,119.812,118.867
              C276.546,215.678,222.799,268.994,156.734,268.994z"/>
            </motion.svg>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

function ImageCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const next = () => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-[22rem] sm:h-[30rem] lg:h-[35rem] overflow-hidden rounded-xl shadow-md">
      {/* Images with animation */}
      <img
        key={index}
        src={images[index]}
        alt={`Office ${index + 1}`}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute w-full h-full object-cover"
      />

      {/* Left Arrow */}
      <button
        onClick={prev}
        className="absolute top-1/2 -translate-y-1/2 left-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Right Arrow */}
      <button
        onClick={next}
        className="absolute top-1/2 -translate-y-1/2 right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 w-full flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Index() {
  const { studioContact, studioEmail } = useStudioDetails();
  const [bride, setBride] = useState("")
  const [groom, setGroom] = useState("")
  const [contact, setContact] = useState("")
  const [reach, setReach] = useState("")
  const [eventDate, setEventDate] = useState({ start: "", end: "" })

  async function handleFormSubmit(e) {
    e.preventDefault()
    const validateEmail = (email) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    };
    const validatePhone = (phone) => {
      const phoneRegex = /^[0-9]{10}$/;
      return phoneRegex.test(phone);
    };
    if (bride.trim() && groom.trim() && contact.trim() && reach.trim() && eventDate.start.trim() && eventDate.end.trim() && (validateEmail(contact) || validatePhone(contact))) {
      // Show loading alert
      Swal.fire({
        title: 'Processing Your Enquiry...',
        html: 'Please wait while we submit your request',
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      try {
        const res = await fetch(`${api_url}/api/enquiry`, {
          method: 'POST',
          body: JSON.stringify({
            bride, groom, contact, reach, eventDate, studioEmail
          }),
          headers: { "content-type": "application/json" }
        })
        const data = await res.json()
        Swal.close();
        if (res.status === 200) {
          Swal.fire({
            imageUrl: success,
            imageWidth: 400,
            imageHeight: 200,
            imageAlt: "Custom image",
            title: `<h2>Thank you for getting in touch!</h2>`,
            text: `Your message has been revived, and our team will be in touch with you shortly.`,
            timer: 2000
          })
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: error.message,
          timer: 1000
        })
      }
    }
  }
  return (
    <>
      <section className="max-w-7xl mx-auto py-10  sm:px-2 lg:px-8">

        <h1 className="lg:text-desktopHeadlineSmall  sm:text-mobileHeadlineSmall font-semibold  text-center text-gray-800 mb-2">Contact Us for Your Special Event</h1>
        <p className="text-center text-gray-400 mb-12">We would love to hear from you. Please fill out this form to connect with us.<br /> OR <br /> Connect with us via WhatsApp</p>

        <div className="bg-[#FFEFE4] relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Carousel */}
          <div className="sticky top-10">
            <ImageCarousel />
          </div>
          {/* Form */}
          <form
            className="p-6 space-y-6 order-first lg:order-last rounded-2xl shadow-md">
            {/* Bride */}
            <div>
              <label htmlFor="bride" className="block text-sm font-medium text-gray-700">Bride's Name *</label>
              <input
                value={bride}
                type="text"
                id="bride"
                placeholder="Enter bride's name"
                className="mt-1 p-3 block w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary sm:text-sm"
                onChange={(e) => setBride(e.target.value)}
              />
            </div>

            {/* Groom */}
            <div>
              <label htmlFor="groom" className="block text-sm font-medium text-gray-700">Groom's Name *</label>
              <input
                value={groom}
                type="text"
                id="groom"
                placeholder="Enter groom's name"
                className="mt-1 p-3 block w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary sm:text-sm"
                onChange={(e) => setGroom(e.target.value)}
              />
            </div>

            {/* Contact */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Phone or Email *</label>
              <input
                value={contact}
                type="text"
                id="contact"
                placeholder="Enter Phone or Email"
                className="mt-1 p-3 block w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary sm:text-sm"
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            {/* Event Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">Date (From)</label>
                <input
                  value={eventDate.start}
                  type="date"
                  id="date-from"
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary sm:text-sm"
                  onChange={(e) => setEventDate(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">Date (To)</label>
                <input
                  value={eventDate.end}
                  type="date"
                  id="date-to"
                  className="mt-1 p-3 block w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary sm:text-sm"
                  onChange={(e) => setEventDate(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>

            {/* Reach Source */}
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">Where did you find us?</label>
              <input
                value={reach}
                type="text"
                id="source"
                placeholder="Google, Instagram, Referral, etc"
                className="mt-1 p-3 block w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-tertiary focus:border-tertiary sm:text-sm"
                onChange={(e) => setReach(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                type="button"
                className="px-6 py-3 text-white bg-tertiary hover:bg-tertiary_on rounded-md shadow-md transition"
                onClick={handleFormSubmit}
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        <WhatsAppButton studioContact={studioContact} />

      </section >
    </>
  )
}

export default Index 