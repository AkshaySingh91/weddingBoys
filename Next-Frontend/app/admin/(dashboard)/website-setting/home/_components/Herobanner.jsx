'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Videoplayer from '@/Component/Videoplayer';
import { fireMessage } from '@/Utils/fireMessage.js';
import {
  Play,
  X,
  CaretLeft,
  CaretRight,
  FilmSlate,
  MapPin,
  CircleNotch,
} from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function Herobanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalHeroVideos, setTotalHeroVideos] = useState(0);
  const slide = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    const fetchHeroVideos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${api_url}/api/hero-videos`);
        const data = await res.json();
        if (res.status >= 300) {
          return fireMessage(data.message, 'error');
        }
        setTotalHeroVideos(data.heroVideos?.length || 0);
        setVideos(data.heroVideos || []);
      } catch (error) {
        return fireMessage(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHeroVideos();
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => {
      if (totalHeroVideos) return prev === 0 ? totalHeroVideos - 1 : prev - 1;
      return prev;
    });
  }, [totalHeroVideos]);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => {
      if (totalHeroVideos) return (prev + 1) % totalHeroVideos;
      return prev;
    });
  }, [totalHeroVideos]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const changeInPosition = touchEndX.current - touchStartX.current;
    if (changeInPosition > 50) {
      handlePrev();
    } else if (changeInPosition < -50) {
      handleNext();
    }
  };

  useEffect(() => {
    if (slide.current) {
      slide.current.style.transform = `translateX(${-currentSlide * 100}%)`;
    }
  }, [currentSlide]);

  useEffect(() => {
    if (totalHeroVideos <= 1) return;
    const id = setInterval(handleNext, 6000);
    return () => clearInterval(id);
  }, [handleNext, totalHeroVideos]);

  useEffect(() => {
    if (isVideoPlaying) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [isVideoPlaying]);

  return (
    <>
      {/* Video Modal Player */}
      {isVideoPlaying && videoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-edge-subtle bg-black shadow-2xl">
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-ink/80 text-white hover:bg-ink transition cursor-pointer"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
            <div className="aspect-video w-full">
              <Videoplayer src={videoUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Hero Video Carousel Container */}
      <div className="relative overflow-hidden rounded-xl border border-edge-subtle bg-ink shadow-md">
        {loading ? (
          <div className="flex h-80 sm:h-96 items-center justify-center text-ink-muted">
            <CircleNotch size={24} className="animate-spin text-gold-strong" />
          </div>
        ) : !videos.length ? (
          <div className="flex h-80 sm:h-96 flex-col items-center justify-center text-center p-6 text-ink-muted">
            <FilmSlate size={36} className="mb-2 text-ink-muted" />
            <p className="text-sm font-sans text-stone-300">No Hero Videos Configured</p>
            <p className="text-xs text-ink-muted mt-1">
              Add films in the Hero Carousel Manager below to display video reels here.
            </p>
          </div>
        ) : (
          <div className="relative h-80 sm:h-96 w-full">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-out"
              ref={slide}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {videos.map((video) => (
                <div key={video.videoKey} className="relative h-full w-full shrink-0">
                  <video
                    className="h-full w-full object-cover"
                    src={video.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />

                  {/* Play Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsVideoPlaying(true);
                      setVideoUrl(video.videoUrl);
                    }}
                    className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8 p-3 rounded-full bg-white/90 text-ink shadow-xl backdrop-blur-sm transition-transform hover:scale-105 hover:bg-white cursor-pointer"
                    aria-label="Play full reel"
                  >
                    <Play size={22} weight="fill" className="text-accent-ink translate-x-0.5" />
                  </button>

                  {/* Wedding Title & Info */}
                  <div className="absolute left-6 bottom-6 sm:left-8 sm:bottom-8 text-white space-y-1 max-w-lg">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-muted">
                      <span>{video?.videoShootDate || 'Wedding Film'}</span>
                      {video?.videoLocation?.city && (
                        <>
                          <span className="text-gold-strong">·</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-gold-strong" />
                            {video.videoLocation.city}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-sans text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
                      {video?.clientName?.Bride || 'Bride'} & {video?.clientName?.Groom || 'Groom'}
                    </h3>

                    {video?.videoId && (
                      <Link
                        href={`/films/${video.videoId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 pt-1 text-xs text-gold-strong hover:text-ground-sunk transition underline underline-offset-4"
                      >
                        <span>View Public Feature</span>
                        <span>↗</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {totalHeroVideos > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/70 hover:text-white backdrop-blur-sm transition shadow-lg"
                  aria-label="Previous slide"
                >
                  <CaretLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/70 hover:text-white backdrop-blur-sm transition shadow-lg"
                  aria-label="Next slide"
                >
                  <CaretRight size={16} />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {videos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        currentSlide === idx ? 'w-5 bg-gold' : 'w-1.5 bg-white/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
