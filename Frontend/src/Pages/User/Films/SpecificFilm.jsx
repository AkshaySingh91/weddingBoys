import React, { useCallback } from 'react'
import VideoPlayer from "../../../Component/Videoplayer"
import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup'
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiPlayCircle, FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi';
const api_url = process.env.REACT_APP_API_URL;
function SpecificFilm() {
    const [clientName, setClientName] = useState({ Bride: "", Groom: "" })
    const [mainVideo, setMainVideo] = useState(null)
    const [clientPhotos, setClientPhotos] = useState([]);
    const [recommendedVideos, setRecommendedVideos] = useState([]);
    const [currentPhotoSlide, setCurrentPhotoSlide] = useState(0);
    const photoSlide = useRef();
    // const touchStartX = useRef(0);
    // const touchEndX = useRef(0); 
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
    // const handleTouchStart = (e) => {
    //     touchStartX.current = e.touches[0].clientX;
    // }
    // const handleTouchMove = (e) => {
    //     touchEndX.current = e.touches[0].clientX;
    // }
    // const handleTouchEnd = () => {
    //     const changeInPosition = touchEndX.current - touchStartX.current;
    //     if (changeInPosition > 50) {
    //         // Swipe Right
    //         handlePrev();
    //     } else if (changeInPosition < -50) {
    //         // Swipe Left
    //         handleNext();
    //     }
    // }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Video Player Section */}
            {mainVideo && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-12 shadow-2xl rounded-2xl overflow-hidden border-2 border-[#FFDCCC]"
                >
                    <div className="relative aspect-video sm:h-50 sm:w-full">
                        <VideoPlayer src={mainVideo.url} />
                    </div>
                </motion.div>
            )}

            {/* Client Details Section */}
            {mainVideo && (
                <motion.div
                    className="mb-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Decorative Header */}
                    <div className="relative mb-8">
                        <h1 className="text-4xl font-bold text-center font-cursive text-[#FF6969] mb-2">
                            {clientName.Bride} & {clientName.Groom}
                        </h1>
                        <div className="flex justify-center items-center gap-4 text-lg text-gray-700 mb-6">
                            <div className="flex items-center gap-2">
                                <FiCalendar className="text-[#FF6969]" />
                                <span>{mainVideo.videoShootDate}</span>
                            </div>
                            <div className="w-1 h-1 bg-[#FF6969] rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <FiMapPin className="text-[#FF6969]" />
                                <span>{mainVideo.videoLocation?.city}</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#FF6969]/30 rounded-full"></div>
                    </div>

                    {/* Tags Section */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {mainVideo.tags?.map((tag, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="px-4 py-2 bg-[#FF6969]/10 text-[#FF6969] rounded-full font-medium shadow-sm"
                            >
                                {tag}
                            </motion.div>
                        ))}
                    </div>

                    {/* Production Team Section */}
                    <div className="bg-[#FFF0E6] p-6 rounded-2xl shadow-inner">
                        <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                            <FiUsers className="text-[#FF6969]" />
                            <span>Production Team</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mainVideo.bts?.map((member, i) => (
                                <div key={i} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-[#FF6969]">{member.key}</h3>
                                    <p className="text-gray-700">{member.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Photo Gallery */}
            {clientPhotos.length > 0 && (
                <motion.section
                    className="mb-16 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Decorative Elements */}
                    <div className="absolute -top-6 -left-6 w-16 h-16 opacity-20">
                        <motion.svg
                            animate={{ rotate: [0, 15, 0] }}
                            transition={{ duration: 8, repeat: Infinity }}
                            viewBox="0 0 24 24"
                        >
                            <path fill="#FFD700" d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2zm0 18c-3 0-6-3-6-6s3-6 6-6 6 3 6 6-3 6-6 6z" />
                            <path fill="#FF6969" d="M12 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
                        </motion.svg>
                    </div>

                    <h2 className="text-2xl font-bold mb-6 text-center relative">
                        <span className="relative z-10 px-4 bg-white">Gallery Moments</span>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#FF6969]/30 z-0"></div>
                    </h2>

                    <div className="relative h-[500px] rounded-2xl overflow-hidden border-2 border-[#FFDCCC]">
                        <div
                            ref={photoSlide}
                            className="absolute inset-0 flex transition-transform duration-500 ease-out"
                        >
                            {clientPhotos.map((photo, i) => (
                                <div key={i} className="relative flex-shrink-0 w-full h-full">
                                    <img
                                        src={photo.photoMetaData.url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {/* Photo Counter */}
                                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                        {i + 1}/{clientPhotos.length}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons with Decorative Background */}
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-[#FF6969] p-3 rounded-full shadow-lg hover:bg-white transition-all"
                        >
                            <FiChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-[#FF6969] p-3 rounded-full shadow-lg hover:bg-white transition-all"
                        >
                            <FiChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </motion.section>
            )}

            {/* Related Videos */}
            {recommendedVideos.length > 0 && (
                <motion.section
                    className="mb-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <h2 className="text-2xl font-bold mb-6 text-center relative">
                        <span className="relative z-10 px-4 bg-white">More Love Stories</span>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#FF6969]/30 z-0"></div>
                    </h2>

                    <div className="relative">
                        {/* Decorative Swirl */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -right-16 -top-16 w-32 h-32 opacity-10"
                        >
                            <svg viewBox="0 0 100 100">
                                <path
                                    fill="none"
                                    stroke="#FFD700"
                                    strokeWidth="2"
                                    d="M50,5a45,45 0 1,0 0,90a45,45 0 1,0 0,-90"
                                    pathLength="1"
                                    strokeDasharray="0.1 0.9"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </motion.div>

                        <div className="relative overflow-x-auto pb-4 scrollbar-hide">
                            <div ref={recommendedVideoSlide} className="flex gap-6">
                                {recommendedVideos.map((video) => (
                                    <motion.div
                                        key={video._id}
                                        whileHover={{ y: -5 }}
                                        className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg overflow-hidden border border-[#FFDCCC]"
                                    >
                                        <Link to={`/films/${video._id}`} className="block">
                                            <div className="relative aspect-video">
                                                <img
                                                    src={video.thumbnailMetaData.url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <FiPlayCircle className="w-16 h-16 text-white/90 hover:text-[#FF6969] transition-colors drop-shadow-lg" />
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-lg mb-2">
                                                    {video.clientName?.Bride} & {video.clientName?.Groom}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                                    <FiCalendar />
                                                    <span>{video.videoShootDate}</span>
                                                    <FiMapPin className="ml-2" />
                                                    <span>{video.videoLocation?.city}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {video.tags?.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="px-2 py-1 bg-[#FF6969]/10 text-[#FF6969] rounded-full text-xs">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {video.tags?.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                            +{video.tags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-[#FF6969] p-3 rounded-full shadow-lg hover:bg-gray-50"
                            onClick={() => moveVideoLeft(recommendedVideoSlide)}
                        >
                            <FiChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-[#FF6969] p-3 rounded-full shadow-lg hover:bg-gray-50"
                            onClick={() => moveVideoRight(recommendedVideoSlide)}
                        >
                            <FiChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </motion.section>
            )}

            {/* Floating Particles */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                        initial={{
                            y: Math.random() * 100,
                            x: Math.random() * 100,
                            scale: 0
                        }}
                        animate={{
                            y: ["0%", "-100%"],
                            x: ["0%", `${Math.random() * 20 - 10}%`],
                            scale: [0, 1, 0]
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default SpecificFilm
