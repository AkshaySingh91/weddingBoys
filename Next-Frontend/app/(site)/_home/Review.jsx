'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react'
import Swal from "sweetalert2"
import { motion, useAnimation } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar, FiHeart } from 'react-icons/fi';
import { Link as ScrollLink } from "react-scroll"

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Random values are generated client-side only (post-mount) so server and
// client markup match on first paint — Math.random() during render would
// otherwise produce a hydration mismatch under Next.js SSR (see
// Component/Background.jsx for the established fix pattern).
function makeHearts() {
    return Array.from({ length: 5 }, () => ({
        initialX: Math.random() * 100,
        initialRotate: Math.random() * 360,
        animRotate: Math.random() * 360,
        duration: 15 + Math.random() * 10,
        left: `${Math.random() * 100}%`,
        fontSize: `${Math.random() * 32 + 24}px`,
    }));
}

export default function Review() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [totalReviews, setTotalReviews] = useState(1);
    const [reviews, setReviews] = useState([]);
    const [hearts, setHearts] = useState(null);
    const slide = useRef();
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHearts(makeHearts());
    }, []);

    const handlePrev = useCallback(() => {
        setCurrentSlide((prev) => (prev === 0 ? totalReviews - 1 : prev - 1));
    }, [totalReviews]);

    const handleNext = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % totalReviews);
    }, [totalReviews]);
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
        async function fetchReviews() {
            try {
                const res = await fetch(`${api_url}/api/reviews`);
                const data = await res.json();
                if (res.status !== 200) throw new Error(data.message);
                if (data.reviews && data.reviews.length) {
                    // Precompute each review's star rating once here (an
                    // effect body, not render) instead of calling
                    // Math.random() during render on every re-render.
                    setReviews(
                        data.reviews.map((review) => ({
                            ...review,
                            rating: Math.floor(Math.random() * 3) + 3,
                        }))
                    );
                    setTotalReviews(data.reviews.length);
                }
            } catch (error) {
                Swal.fire({
                    title: "Error!",
                    text: error.message,
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }
        }
        fetchReviews();
    }, []);
    const controls = useAnimation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="relative py-20  bg-gradient-to-b from-ground to-ground-sunk overflow-hidden"
        >
            {/* Floating Hearts */}
            {hearts?.map((heart, i) => (
                <motion.div
                    key={i}
                    className="absolute text-accent/20"
                    initial={{ y: 0, x: heart.initialX, rotate: heart.initialRotate }}
                    animate={{
                        y: [0, 100],
                        rotate: heart.animRotate
                    }}
                    transition={{
                        duration: heart.duration,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        left: heart.left,
                        fontSize: heart.fontSize
                    }}
                >
                    <FiHeart />
                </motion.div>
            ))}

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        className="bg-accent-wash text-accent-ink font-semibold py-2 px-6 rounded-full inline-block mb-4"
                    >
                        CLIENT LOVE
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#5E2B17] mb-4 ">
                        What Our Couples Say
                    </h1>
                    <p className="text-[#7F5347] max-w-2xl mx-auto">
                        Hear directly from the couples who trusted us to capture their special day across Mumbai and beyond.
                    </p>
                </div>

                <div className="relative group">
                    <div
                        className="reviews-wrapper overflow-hidden relative"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <motion.div
                            className="flex"
                            ref={slide}
                            animate={controls}
                        >
                            {reviews.map((review) => (
                                <div key={review.photo.key} className="min-w-full px-4">
                                    <motion.div
                                        className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col lg:flex-row group relative hover:shadow-xl transition-shadow"
                                        whileHover={{ y: -5 }}
                                    >
                                        {/* Rating Badge */}
                                        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-1">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <FiStar key={i} className="w-5 h-5 text-gold" />
                                            ))}
                                        </div>

                                        <div className="lg:w-1/2 relative overflow-hidden">
                                            <img
                                                className="w-full h-96 object-cover transform transition-transform duration-500 group-hover:scale-105"
                                                src={review.url}
                                                alt={review.person.name}
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 p-6">
                                                <FiHeart className="text-white w-12 h-12 mb-4 opacity-75" />
                                                <h3 className="text-2xl font-bold text-white">
                                                    {review.person.name}
                                                </h3>
                                                <p className="text-ink-onDeep/80">{review.person.gender}</p>
                                            </div>
                                        </div>

                                        <div className="lg:w-1/2 p-8 flex flex-col justify-center">
                                            <blockquote className="text-xl text-[#5E2B17] mb-6 relative before:content-['“'] before:absolute before:-left-6 before:-top-4 before:text-6xl before:text-accent/30 before:">
                                                {review.reviewText}
                                            </blockquote>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 h-px bg-accent/20" />
                                                <span className="text-accent-ink uppercase tracking-widest text-sm">
                                                    Wedding Story
                                                </span>
                                                <div className="flex-1 h-px bg-accent/20" />
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Navigation Buttons */}
                    <motion.button
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                        onClick={handlePrev}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiChevronLeft className="w-6 h-6 text-[#5E2B17]" />
                    </motion.button>
                    <motion.button
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                        onClick={handleNext}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiChevronRight className="w-6 h-6 text-[#5E2B17]" />
                    </motion.button>
                </div>

                {/* Animated Scroll Indicator */}
                <motion.div
                    className="mt-12 flex justify-center"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ScrollLink
                        to="top" // ID of the top section
                        smooth={true}
                        duration={500}
                        offset={-80} // adjust if you have a fixed navbar
                        className="flex flex-col items-center text-accent-ink cursor-pointer"
                    >
                        <FiChevronLeft className="w-8 h-8 transform rotate-90" />
                        <span className="text-sm mt-2">Go to Top</span>
                    </ScrollLink>
                </motion.div>

            </div>
        </motion.div>
    )
}
