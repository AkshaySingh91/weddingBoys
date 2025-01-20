import React, { useCallback } from 'react'
import VideoPlayer from "../../../Component/Videoplayer"
import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup'
const api_url = process.env.REACT_APP_API_URL;

function SpecificFilm() {
    const [clientName, setClientName] = useState({ Bride: "", Groom: "" })
    const [mainVideo, setMainVideo] = useState(null)
    const [clientPhotos, setClientPhotos] = useState([]);
    const [clientOtherVideos, setClientOtherVideos] = useState([]);
    const [recommendedVideos, setRecommendedVideos] = useState([]);
    const [currentPhotoSlide, setCurrentPhotoSlide] = useState(0);
    const photoSlide = useRef();
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const videoSlide = useRef();
    const recommendedVideoSlide = useRef();
    const { videoId } = useParams();

    // for images 
    const handlePrev = () => {
        setCurrentPhotoSlide((prev) => {
            if (clientPhotos.length)
                return prev === 0 ? clientPhotos.length - 1 : prev - 1
            else return prev
        });
    };
    const handleNext = () => {
        setCurrentPhotoSlide((prev) => {
            if (clientPhotos.length)
                return (prev + 1) % clientPhotos.length
            else return prev
        });
    };
    useEffect(() => {
        if (photoSlide.current) {
            photoSlide.current.style.transform = `translateX(${-currentPhotoSlide * 100}%)`;
        }
    }, [currentPhotoSlide]);
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
    const moveVideoLeft = (slide) => {
        const container = slide.current;
        if (container) {
            const scrollAmount = container.offsetWidth;  // Use container width for consistent scrolling
            container.scrollBy({
                left: -scrollAmount,   // Scroll left (negative)
                behavior: 'smooth'
            });
        }
    };

    const moveVideoRight = (slide) => {
        const container = slide.current;
        if (container) {
            const scrollAmount = container.offsetWidth;  // Use container width
            container.scrollBy({
                left: scrollAmount,    // Scroll right (positive)
                behavior: 'smooth'
            });
        }
    };


    const fetchClientVideoAndPhotos = useCallback(
        async () => {
            try {
                const res = await fetch(`${api_url}/api/videos/${videoId}`);
                const data = await res.json();
                if (!res.ok || !data.clientName || !data.selectedVideo || !data.remainingVideos || !data.photos) {
                    return fireMessage(data.message, 'error')
                }
                setClientName(data.clientName)
                setMainVideo(data.selectedVideo)
                setClientOtherVideos(data.remainingVideos)
                setClientPhotos(data.photos)
            } catch (error) {
                fireMessage(error, 'error')
            }
        }, [videoId]);

    const fetchRecommendedVideos = useCallback(
        async () => {
            try {
                const res = await fetch(`${api_url}/api/videos/${videoId}/recommended`)
                const data = await res.json();
                if (!res.ok || !data.recommendedVideos) {
                    return fireMessage(data.message, 'error')
                }
                setRecommendedVideos(data.recommendedVideos)
            } catch (error) {
                console.log(error)
                fireMessage(error.message, 'error')
            } finally {
            }
        }, [videoId]);

    useEffect(() => {
        if (mainVideo) {
            fetchRecommendedVideos()
        }
    }, [mainVideo, fetchRecommendedVideos]);

    useEffect(() => {
        if (videoId && videoId.trim())
            fetchClientVideoAndPhotos();
    }, [videoId, fetchClientVideoAndPhotos]);

    return (
        <>
            {
                mainVideo ?
                    <>
                        <div className='w-full lg:h-[32rem] sm:h-80 sm:py-4 flex justify-center'>
                            <VideoPlayer src={mainVideo.url} />
                        </div>
                        <div className="text-container flex lg:flex-row sm:flex-col gap-4 justify-between lg:text-mobileHeadlineLarge lg:px-4 lg:py-10 lg:pt-0 sm:py-5">
                            <div className="left-part flex flex-col lg:gap-4 sm:gap-2 w-fit">
                                <div className="flex-col lg:gap-2 sm:gap-1 w-fit">
                                    <div className="bride-and-groom flex items-center gap-2  sm:px-4 lg:px-0 ">
                                        <span className='uppercase whitespace-nowrap sm:text-xl lg:text-2xl'>{clientName.Bride}</span>
                                        <span className='sm:text-xl lg:text-2xl'>&</span>
                                        <span className='uppercase sm:text-xl lg:text-2xl'>{clientName.Groom}</span>
                                    </div>
                                    <div className="data-and-location flex items-center gap-2  sm:px-4 lg:px-0">
                                        <span className='uppercase whitespace-nowrap sm:text-lg lg:text-xl'>{mainVideo.videoShootDate}</span>
                                        <svg className='w-10 h-10 fill-black' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                                        <span className='uppercase sm:text-lg lg:text-xl'>{mainVideo.videoLocation ? mainVideo.videoLocation.city : ""}</span>
                                    </div>
                                </div>
                                <div className="tags flex flex-wrap gap-3 lg:text-desktopBodySmall sm:text-mobileBodySmall sm:px-4 lg:px-0">
                                    {
                                        (mainVideo.tags && mainVideo.tags.length) ?
                                            mainVideo.tags.map((t, i) => (
                                                <div key={i} className="bg-[#ffeee4] tag-btn border-[1px] rounded-full text-center border-gray-500 px-3 py-1  tracking-wider">
                                                    {t}
                                                </div>
                                            ))
                                            : null
                                    }
                                </div>
                            </div>
                            <div className="bts-details lg:text-desktopBodyLarge tracking-wider text-gray-600 lg:px-4 sm:px-4 sm:text-mobileBodyMedium">
                                {
                                    (mainVideo.bts && mainVideo.bts.length) ?
                                        mainVideo.bts.map((keyPair, i) => (
                                            <div key={i} className="pair inline-flex">
                                                <div className="key px-1">{keyPair.key}</div>
                                                <span>:</span>
                                                <div className="value px-1">{keyPair.value}</div>
                                            </div>
                                        ))
                                        : null
                                }
                            </div>
                        </div>
                    </>
                    : null
            }
            <div className="same-client-content">
                {
                    clientPhotos.length ?
                        <div className="photo relative sm:mx-2  rounded-2xl lg:w-full lg:h-svh  overflow-hidden scrollbar-none">
                            <div className="flex h-full w-auto transition-transform" ref={photoSlide}
                                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}> {
                                    clientPhotos.map((photo, i) => {
                                        return (
                                            <Link key={i} className='flex-shrink-0 h-full w-full '>
                                                <div className="flex-shrink-0 h-full w-full " >
                                                    <img src={photo.photoMetaData.url}
                                                        alt="client-photo"
                                                        className='bg-no-repeat object-cover w-full h-full lg:rounded-2xl sm:rounded-md' />
                                                </div>
                                            </Link>
                                        )
                                    })
                                }
                            </div>
                            <button
                                className="prev-photo-btn sm:p-1 left-video absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 rounded-full lg:p-2 shadow-md hover:bg-gray-200 focus:border-none focus:outline-none" onClick={handlePrev}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lg:w-6 lg:h-6 sm:w-4 sm:h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className="next-photo-btn sm:p-1 right-video absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 rounded-full lg:p-2 shadow-md hover:bg-gray-200 focus:border-none focus:outline-none" onClick={handleNext}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lg:w-6 lg:h-6 sm:w-4 sm:h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div> : null
                }
                {
                    clientOtherVideos.length ?
                        <div className="videos relative">
                            <div className="w-full mx-2 my-10 overflow-x-auto scrollbar-none" role='list'>
                                <div ref={videoSlide} role='listitem' className="movies flex gap-4">
                                    {clientOtherVideos.map((video, i) => (
                                        <Link to={`/films/${video._id}`} key={i} className='other-video flex flex-col lg:gap-2 sm:gap-3'>
                                            <div className="relative lg:w-72 lg:h-48 sm:w-72 sm:h-[10rem]">
                                                <img className='object-cover rounded-xl w-full h-full' src={video.thumbnailMetaData.url} alt="client-video-thumbnail" />
                                                <button className="play-btn absolute top-[45%] left-[45%] bg-gray-400 text-gray-800 rounded-full shadow-md hover:bg-gray-400 drop-shadow-lg ">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="2"
                                                        stroke="currentColor"
                                                        className="lg:w-10 lg:h-10 sm:w-8 sm:h-8">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.197-2.42A1 1 0 009 9.5v5a1 1 0 001.555.832l4.197-2.42a1 1 0 000-1.664z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="text-primary flex flex-col gap-0 px-2">
                                                <div className="flex items-center lg:text-desktopBodyMedium uppercase  tracking-wide sm:text-mobileBodyMedium whitespace-nowrap font-bold uppercase">
                                                    <span>{video.videoShootDate ? video.videoShootDate : ""}</span>
                                                    <svg className='lg:w-8 lg:h-8 sm:w-4 sm:h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                                                    <span>{video.videoLocation ? video.videoLocation.city : ""}</span>
                                                </div>
                                                <div className="flex gap-2 lg:text-mobileHeadlineMedium font-bold sm:text-mobileBodyLarge whitespace-wrap">
                                                    <span>{video.clientName ? video.clientName.Bride : ""}</span>
                                                    <span>&</span>
                                                    <span>{video.clientName ? video.clientName.Groom : ""}</span>
                                                </div>
                                            </div>

                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="prev-photo-btn sm:p-1 left-video absolute left-4 top-2/3  transform -translate-y-1/2 bg-white text-gray-700 rounded-full lg:p-2 shadow-md hover:bg-gray-200 focus:border-none focus:outline-none"
                                onClick={() => moveVideoLeft(videoSlide)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lg:w-6 lg:h-6 sm:w-4 sm:h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                className="next-photo-btn sm:p-1 right-video absolute right-4 top-2/3 transform -translate-y-1/2 bg-white text-gray-700 rounded-full lg:p-2 shadow-md hover:bg-gray-200 focus:border-none focus:outline-none"
                                onClick={() => moveVideoRight(videoSlide)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lg:w-6 lg:h-6 sm:w-4 sm:h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div> : null
                }
            </div>

            {
                recommendedVideos.length ?
                    <div className="related-content relative lg:py-8 min-w-full">
                        <h2 className='lg:text-desktopHeadlineMedium text-center py-4 pb-8 tracking-wider font-bold sm:text-mobileHeadlineMedium sm:pt-10'> Related videos
                            <hr className='border-1 border-gray-400 sm:w-1/2 lg:w-1/4 mx-auto' />
                        </h2>
                        <div className="w-full  overflow-x-auto   py-2 bg-[#e9e5e5] mb-4" role='list'>
                            <div ref={recommendedVideoSlide} role='listitem'
                                className="movies flex gap-4 lg:px-4 overflow-x-auto scrollbar-none scroll-smooth">
                                {recommendedVideos.map((video, i) => (
                                    <Link key={i} to={`/films/${video._id}`} className=' flex flex-col lg:gap-2 sm:gap-3'>
                                        <div className="relative thumbnail lg:w-72 lg:h-48 sm:w-72 sm:h-[10rem]">
                                            <img className='object-cover rounded-xl w-full h-full'
                                                src={video.thumbnailMetaData.url} alt="video-thumbnail" />
                                            <button className="play-btn absolute top-[45%] left-[45%] bg-gray-400 text-gray-800 rounded-full shadow-md hover:bg-gray-400 drop-shadow-lg ">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2"
                                                    stroke="currentColor"
                                                    className="lg:w-10 lg:h-10 sm:w-8 sm:h-8">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.197-2.42A1 1 0 009 9.5v5a1 1 0 001.555.832l4.197-2.42a1 1 0 000-1.664z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="text-primary flex flex-col gap-0 px-2">
                                            <div className="flex items-center lg:text-desktopBodyMedium uppercase  tracking-wide sm:text-mobileBodyMedium whitespace-nowrap font-bold">
                                                <span>{video.videoShootDate ? video.videoShootDate : ""}</span>
                                                <svg className='lg:w-8 lg:h-8 sm:w-4 sm:h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                                                <span>{video.videoLocation ? video.videoLocation.city : ""}</span>
                                            </div>
                                            <div className="flex gap-2 lg:text-mobileHeadlineMedium font-bold sm:text-mobileBodyLarge whitespace-wrap">
                                                <span>{video.clientName ? video.clientName.Bride : ""}</span>
                                                <span>&</span>
                                                <span>{video.clientName ? video.clientName.Groom : ""}</span>
                                            </div>
                                            <div className="tags w-full flex flex-wrap gap-2 my-3 text-nowrap max-w-full">
                                                {(video.tags && video.tags.length) ?
                                                    video.tags.map((t, i) => (
                                                        <div key={i} className="tag text-nowrap px-2 py-1 rounded-full bg-gray-100 border-[1px] border-slate-500">{t}</div>
                                                    ))
                                                    : ""}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <button
                            className="prev-photo-btn sm:p-1 left-video absolute left-4 top-2/3  transform -translate-y-1/2 bg-white text-gray-700 rounded-full lg:p-2 shadow-md hover:bg-gray-200 focus:border-none focus:outline-none"
                            onClick={() => moveVideoLeft(recommendedVideoSlide)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lg:w-6 lg:h-6 sm:w-4 sm:h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="next-photo-btn sm:p-1 right-video absolute right-4 top-2/3 transform -translate-y-1/2 bg-white text-gray-700 rounded-full lg:p-2 shadow-md hover:bg-gray-200 focus:border-none focus:outline-none"
                            onClick={() => moveVideoRight(recommendedVideoSlide)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="lg:w-6 lg:h-6 sm:w-4 sm:h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    : null
            }
        </>
    )
}

export default SpecificFilm
