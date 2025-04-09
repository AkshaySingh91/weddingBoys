import React, { useState, useRef, useEffect } from 'react';
import Swal from "sweetalert2";
import { motion } from "framer-motion";
const api_url = process.env.REACT_APP_API_URL;

function TeamPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = useRef();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [teamImages, setTeamImages] = useState([]);
  const [bannerImage, setBannerImage] = useState([]);

  const handlePrev = () => {
    setCurrentSlide((prev) => {
      if (bannerImage.length)
        return prev === 0 ? bannerImage.length - 1 : prev - 1;
      else return prev;
    });
  };
  const handleNext = () => {
    setCurrentSlide((prev) => {
      if (bannerImage.length)
        return (prev + 1) % bannerImage.length;
      else return prev;
    });
  };
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((prev) => {
        if (bannerImage.length)
          return (prev + 1) % bannerImage.length;
        else return prev;
      });
    }, 4000);
    return () => {
      clearInterval(id);
    };
  }, [bannerImage]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const changeInPosition = touchEndX.current - touchStartX.current;
    if (changeInPosition > 50) {
      // Swipe Right
      handlePrev();
    } else if (changeInPosition < -50) {
      // Swipe Left
      handleNext();
    }
  };
  useEffect(() => {
    if (slide.current) {
      slide.current.style.transform = `translateX(${-currentSlide * 100}%)`;
    }
  }, [currentSlide]);

  async function fetchTeamImage() {
    setIsLoading(true);
    try {
      const res = await fetch(`${api_url}/api/team`);
      const data = await res.json();
      if (!res.ok || !data.teamImages || !data.bannerImage) {
        throw new Error(data.message);
      }
      setTeamImages(data.teamImages);
      setBannerImage(data.bannerImage);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchTeamImage();
  }, []);

  return (
    <>
      {/* Banner Section */}
      <div className="hero-banner relative w-full lg:h-[36rem] sm:h-80 rounded-2xl overflow-hidden my-6 shadow-lg">
        <div
          className="flex transition-transform duration-700 h-full"
          ref={slide}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading ? (
            <div className="skeleton flex-shrink-0 h-full w-full relative">
              <div className="animate-pulse bg-slate-300 w-full h-full rounded-2xl"></div>
            </div>
          ) : bannerImage.length ? (
            bannerImage.map((image, i) => (
              <div key={i} className="flex-shrink-0 h-full w-full relative">
                <img
                  className="object-cover w-full h-full rounded-2xl"
                  src={image.url}
                  alt="Team Banner"
                />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-full text-lg font-bold tracking-widest">
              No available Images
            </div>
          )}
        </div>
        {/* Banner Navigation Buttons */}
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full shadow-lg focus:outline-none"
          onClick={handlePrev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full shadow-lg focus:outline-none"
          onClick={handleNext}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/* Overlay Text on Banner */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-white text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg"
          >
            Meet Our Visionaries
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-white text-base lg:text-xl max-w-2xl"
          >
            Our strong team of creative professionals is dedicated to capturing timeless moments with passion and expertise.
          </motion.p>
        </div>
      </div>

      {/* Team Members Section */}
      <section className="team-members max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-2xl lg:text-4xl font-bold text-gray-800 mb-3"
          >
            Our Expert Team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-gray-600 text-base lg:text-lg max-w-xl mx-auto"
          >
            We believe in creativity, collaboration, and a passion for excellence. Our team brings decades of combined experience, ensuring that every project is a masterpiece.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => <ImageCardSkeleton key={i} />)
          ) : (
            teamImages.map((photo, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="relative rounded-2xl overflow-hidden shadow-lg group"
              >
                <img
                  src={photo.url}
                  alt={photo.about?.name || "Team Member"}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition-opacity" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-bold">{photo.about?.name}</h3>
                  <p className="text-sm">{photo.about?.designation}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

const ImageCardSkeleton = () => (
  <div className="animate-pulse bg-slate-300 rounded-2xl h-64 w-full relative">
    <div className="absolute bottom-4 left-4 space-y-2">
      <div className="w-20 h-4 bg-slate-400 rounded"></div>
      <div className="w-14 h-4 bg-slate-400 rounded"></div>
    </div>
  </div>
);

export default TeamPage;
