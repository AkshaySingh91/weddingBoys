import React, { useCallback, useState, useRef, useEffect } from 'react';
import { FiPlay, FiChevronLeft, FiChevronRight, FiX, FiFilm } from 'react-icons/fi';
import Videoplayer from '../../../Component/Videoplayer';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup';
import { Link } from 'react-router-dom'; 

const api_url = import.meta.env.VITE_API_URL;

const VideoSkeleton = () => (
    <div className="absolute inset-0 overflow-hidden bg-[#FAF1E6] animate-pulse">
    {/* Animated shimmer overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFDCCC]/50 to-transparent animate-shimmer" />
    
    {/* Content placeholder */}
    <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
      <div className="h-7 w-48 mb-3 bg-[#FF6969]/20 rounded-full" />
      <div className="h-5 w-64 bg-[#FF4D4D]/20 rounded-full" />
    </div>

    {/* Play button skeleton */}
    <div className="absolute bottom-6 right-6 z-10">
      <div className="w-12 h-12 bg-[#FFD700]/30 rounded-full" />
    </div>

    {/* Decorative elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="w-full h-full pattern-dots pattern-[#FF6969] pattern-opacity-20 pattern-size-8" />
    </div>
  </div>
  )

export default function Herobanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [videos, setVideos] = useState([]);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loadedVideos, setLoadedVideos] = useState({});
    const slideRef = useRef();
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const videoRefs = useRef([]);

    const fetchHeroVideos = useCallback(async () => {
        try {
            const res = await fetch(`${api_url}/api/hero-videos`);
            const data = await res.json();
            if (res.status >= 300) return fireMessage(data.message, 'error');

            setVideos(data.heroVideos);
            videoRefs.current = data.heroVideos.map(() => React.createRef());
        } catch (error) {
            fireMessage(error.message, 'error');
        }
    }, []);

    const handleVideoLoad = useCallback((index) => {
        setLoadedVideos(prev => ({ ...prev, [index]: true }));
    }, []);

    useEffect(() => {
        fetchHeroVideos();
    }, [fetchHeroVideos]);

    useEffect(() => {
        videoRefs.current.forEach((ref, index) => {
            if (ref?.current) {
                const video = ref.current;
                const handleLoad = () => handleVideoLoad(index);

                video.addEventListener('loadeddata', handleLoad);
                video.play().catch(() => { }); // Autoplay with mute

                return () => video.removeEventListener('loadeddata', handleLoad);
            }
        });
    }, [videos, handleVideoLoad]);

    const handleSlideChange = useCallback((direction) => {
        setCurrentSlide(prev => {
            if (!videos.length) return prev;
            return direction === 'next'
                ? (prev + 1) % videos.length
                : prev === 0 ? videos.length - 1 : prev - 1;
        });
    }, [videos.length]);

    const handleTouchEnd = useCallback(() => {
        const change = touchEndX.current - touchStartX.current;
        if (Math.abs(change) > 50) {
            handleSlideChange(change > 0 ? 'prev' : 'next');
        }
    }, [handleSlideChange]);

    useEffect(() => {
        if (slideRef.current) {
            slideRef.current.style.transform = `translateX(${-currentSlide * 100}%)`;
        }
    }, [currentSlide]);

    return (
        <>
            {isVideoPlaying && videoUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <button
                        onClick={() => setIsVideoPlaying(false)}
                        className="absolute top-4 right-4 p-2 text-white hover:text-gray-200 transition-colors"
                    >
                        <FiX className="w-8 h-8" />
                    </button>
                    <Videoplayer src={videoUrl} className="max-w-4xl w-full" />
                </div>
            )}

            <div className="hero-banner relative h-[33rem] rounded-2xl overflow-hidden">
                <div
                    ref={slideRef}
                    className="flex h-full transition-transform duration-500 ease-out"
                    onTouchStart={(e) => touchStartX.current = e.touches[0].clientX}
                    onTouchMove={(e) => touchEndX.current = e.touches[0].clientX}
                    onTouchEnd={handleTouchEnd}
                >
                    {videos.map((video, index) => (
                        <div key={video.videoKey} className="flex-shrink-0 relative w-full h-full">
                            {!loadedVideos[index] && <VideoSkeleton />}

                            <video
                                ref={videoRefs.current[index]}
                                className={`absolute inset-0 w-full h-full object-cover rounded-2xl ${loadedVideos[index] ? 'opacity-100' : 'opacity-0'
                                    }`}
                                src={video.videoUrl}
                                muted
                                autoPlay
                                playsInline
                                loop
                                preload="auto"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                                <div className="absolute bottom-6 right-6">
                                    <button
                                        onClick={() => {
                                            setIsVideoPlaying(true);
                                            setVideoUrl(video.videoUrl);
                                        }}
                                        className="p-3 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                                    >
                                        <FiPlay className="w-6 h-6 text-white" />
                                    </button>
                                </div>

                                <Link
                                    to={`/films/${video.videoId}`}
                                    className="absolute bottom-6 left-6 text-white hover:text-gray-200 transition-colors"
                                >
                                    <h2 className="text-2xl font-bold">
                                        {[video.clientName?.Bride, video.clientName?.Groom].filter(Boolean).join(' & ')}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                        <span>{video.videoShootDate}</span>
                                        <span>•</span>
                                        <span>{video.videoLocation?.city}</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute inset-0 flex items-center justify-between px-4">
                    <button
                        onClick={() => handleSlideChange('prev')}
                        className="p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                        <FiChevronLeft className="w-8 h-8 text-white" />
                    </button>
                    <button
                        onClick={() => handleSlideChange('next')}
                        className="p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                        <FiChevronRight className="w-8 h-8 text-white" />
                    </button>
                </div>
            </div>
        </>
    );
}   