import React, { useState, useRef, useEffect } from 'react'
import Swal from "sweetalert2"
const api_url = process.env.REACT_APP_API_URL;

function Index() {
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
        return prev === 0 ? bannerImage.length - 1 : prev - 1
      else return prev
    });
  };
  const handleNext = () => {
    setCurrentSlide((prev) => {
      if (bannerImage.length)
        return (prev + 1) % bannerImage.length
      else return prev
    });
  };
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((prev) => {
        if (bannerImage.length)
          return (prev + 1) % bannerImage.length
        else return prev
      });
    }, 2000)
    return () => {
      clearInterval(id)
    }
  }, [bannerImage])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  }
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  }
  const handleTouchEnd = () => {
    const changeInPosition = touchEndX.current - touchStartX.current;
    if (changeInPosition > 50) {
      // Swipe Right
      handlePrev();
    } else if (changeInPosition < -50) {
      // Swipe Left
      handleNext();
    }
  }
  useEffect(() => {
    if (slide.current) {
      slide.current.style.transform = `translateX(${-currentSlide * 100}%)`;
    }
  }, [currentSlide]);

  async function fetchTeamImage() {
    setIsLoading(true)
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
        confirmButtonColor: "#d33"
      });
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchTeamImage()
  }, [])
  return (
    <>
      <div className="hero-banner w-auto lg:h-[33rem] relative rounded-2xl sm:h-96 overflow-hidden lg:my-4 sm:my-6">
        <div className="flex herobanner-wrapper h-full w-auto transition-transform duration-700" ref={slide} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}> {
          isLoading ?
            <div className="skeleton flex-shrink-0 h-full w-full relative" >
              <div className='animate-pulse bg-slate-300 aspect-video  w-full h-full rounded-2xl px-2'></div>
              <div className="absolute sm:bottom-7 sm:left-7 lg:bottom-10 lg:left-10 space-y-2">
                <div className="animate-pulse sm:w-28 lg:w-40  h-4 rounded-md bg-slate-400 "></div>
                <div className="animate-pulse sm:w-20 lg:w-32  h-4 rounded-md bg-slate-400 "></div>
              </div>
            </div> : (
              bannerImage.length ?
                bannerImage.map((image, i) => {
                  return (
                    <div key={i} className="flex-shrink-0 h-full w-full relative" >
                      <img className='bg-no-repeat object-cover aspect-video  w-full h-full rounded-2xl px-2' src={image.url}
                        alt="team-banner-image" />
                    </div>
                  )
                }) :
                <div className="mx-auto my-auto text-lg font-bold tracking-widest">No available Images</div>)
        }
        </div>
        <button
          className="left-image focus:outline-none focus:border-none  absolute left-4 top-1/2 transform -translate-y-1/2 placeholder: text-gray-700 rounded-full p-2 shadow-md  " onClick={handlePrev}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="4" stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="right-image focus:outline-none focus:border-none  absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-700 rounded-full p-2 shadow-md  " onClick={handleNext}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="4" stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="team-member grid xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-2  gap-x-5 gap-y-6 px-2 py-4">
        {
          isLoading ?
            [...Array(3)].map((_, i) => (
              <ImageCardSkeleton key={i} />
            )) :
            (teamImages.map((photo, i) => (
              <div key={i} className="w-auto lg:h-72 sm:h-52 relative lg:rounded-2xl  sm:rounded-xl overflow-hidden">
                <img src={photo.url} alt="team-member-name"
                  className='w-full h-full object-cover bg-center lg:rounded-2xl sm:rounded-xl ' />
                <div className="grayscale absolute bottom-0 left-0 bg-gradient-to-t from-black to-[30%] h-full w-full ">
                </div>
                <div className="member-name absolute top-auto bottom-4 left-4 text-white text-nowrap">
                  <h2 className='text-lg lgtracking-wider sm:tracking-tighter'>{photo.about?.name}</h2>
                  <h2 className='text-sm'>{photo.about?.designation}</h2>
                </div>
              </div>
            )))
        }
      </div>
    </>
  )
}

const ImageCardSkeleton = () => (
  <div className="w-auto animate-pulse bg-slate-300  lg:h-72 sm:h-60 relative lg:rounded-2xl  sm:rounded-xl overflow-hidden">
    <div className="absolute sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6 space-y-2">
      <div className="animate-pulse w-20 h-4 rounded-md bg-slate-400 " aria-hidden="true"></div>
      <div className="animate-pulse w-14 h-4 rounded-md bg-slate-400 " aria-hidden="true"></div>
    </div>
  </div>
)
export default Index
