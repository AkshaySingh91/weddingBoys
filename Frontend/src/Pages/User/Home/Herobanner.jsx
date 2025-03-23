import React, { useCallback } from 'react'
import { useState, useRef, useEffect } from 'react';
import Videoplayer from '../../../Component/Videoplayer';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup'
import { Link } from 'react-router-dom';
const api_url = process.env.REACT_APP_API_URL;

export default function Herobanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [totalHeroVideos, setTotalHeroVideos] = useState(0);
    const slide = useRef();
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const [videos, setVideos] = useState([])
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null)

    const fetchHeroVideos = async () => {
        try {
            const res = await fetch(`${api_url}/api/hero-videos`)
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            setTotalHeroVideos(data.heroVideos.length)
            console.log(data.heroVideos)
            setVideos(data.heroVideos)
        } catch (error) {
            return fireMessage(error.message, 'error')
        }
    }
    useEffect(() => {
        fetchHeroVideos();
    }, [])

    const handlePrev = useCallback(() => {
        setCurrentSlide((prev) => {
            if (totalHeroVideos)
                return prev === 0 ? totalHeroVideos - 1 : prev - 1
            else return prev
        });
    }, [totalHeroVideos]);

    const handleNext = useCallback(() => {
        setCurrentSlide((prev) => {
            if (totalHeroVideos)
                return (prev + 1) % totalHeroVideos
            else return prev
        });
    }, [totalHeroVideos]);

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

    useEffect(() => {
        const id = setInterval(handleNext, 5000)
        return () => {
            clearInterval(id)
        }
    }, [handleNext]);

    useEffect(() => {
        if (isVideoPlaying) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [isVideoPlaying]);

    return (
        <>
            {
                isVideoPlaying && videoUrl ?
                    <div className="homepage-video-underlay fixed top-0 left-0 flex lg:flex-row sm:flex-col items-center w-screen h-screen underlay bg-[rgba(0,0,0,0.87)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[2px] lg:px-4 lg:py-4 overflow-hidden z-[99999] sm:justify-center">
                        <button onClick={() => setIsVideoPlaying(false)} className='close-video-player lg:order-last lg:self-start video-end-btn bg-gray-600 rounded-full lg:p-1 sm:p-1 sm:self-end w-fit h-fit m-4'>
                            <svg className='lg:w-6 lg:h-6 sm:h-4 sm:w-4 fill-gray-100 ' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                        </button>
                        <Videoplayer src={videoUrl} ></Videoplayer>
                    </div>
                    : null
            }
            <div className="hero-banner w-auto lg:h-[33rem] relative rounded-2xl sm:h-[33rem] overflow-hidden">
                <div className="flex herobanner-wrapper h-full w-auto transition-transform duration-[5000]" ref={slide} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}> {
                    !videos.length ?
                        <div className="">No available video</div>
                        :
                        videos.map((video) => {
                            return (
                                <div key={video.videoKey} className="flex-shrink-0 h-full w-full relative" >
                                    <video className='bg-no-repeat object-cover aspect-video  w-full h-full rounded-2xl ' src={video.videoUrl} autoPlay muted preload='true'></video>
                                    <button
                                        className="play-btn absolute lg:bottom-6 lg:right-6 bg-slate-600 text-gray-800 rounded-full shadow-md hover:bg-gray-400 sm:bottom-[90%] sm:right-3 "
                                        onClick={() => {
                                            setIsVideoPlaying(true)
                                            setVideoUrl(video.videoUrl)
                                        }}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="white"
                                            viewBox="0 0 24 24"
                                            className="lg:w-10 lg:h-10 sm:w-8 sm:h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.197-2.42A1 1 0 009 9.5v5a1 1 0 001.555.832l4.197-2.42a1 1 0 000-1.664z" />
                                        </svg>
                                    </button>
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent rounded-b-3xl opacity-60 -z-10"></div>

                                    <Link to={`/films/${video.videoId}`}>
                                        <div className="absolute lg:bottom-8 leading-4 lg:left-8 text-white flex flex-col gap-0 sm:left-4 sm:bottom-4">
                                            <div className="flex gap-2 lg:text-3xl tracking-widest font-bold sm:text-mobileHeadlineSmall">
                                                <span>{video.clientName.Bride}</span>
                                                <span>&</span>
                                                <span>{video.clientName.Groom}</span>
                                            </div>
                                            <div className="flex items-center leading-4 lg:text-lg uppercase font-light tracking-wide sm:text-mobileHeadlineSmall">
                                                <span>{video.videoShootDate}</span>
                                                <svg className='w-10 h-10' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="white"><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                                                <span>{video.videoLocation.city}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )
                        })
                }
                </div>
                <button
                    className="focus:outline-none focus:border-none left-video absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-700 rounded-full p-2  " onClick={handlePrev}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="#FFFFFF" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    className="focus:outline-none focus:border-none right-video absolute right-2 top-1/2 transform -translate-y-1/2  text-gray-700 rounded-full p-2 " onClick={handleNext}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="#FFFFFF" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </>
    )
}
