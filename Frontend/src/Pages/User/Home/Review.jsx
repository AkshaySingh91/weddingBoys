import React, { useCallback, useRef, useState } from 'react'
import Swal from "sweetalert2"
import { useEffect } from 'react';

export default function Review() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [totalReviews, setTotalReviews] = useState(1);
    const [reviews, setReviews] = useState([]);
    const slide = useRef();
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

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
                const res = await fetch("http://localhost:5000/api/reviews");
                const data = await res.json();
                if (res.status !== 200) throw new Error(data.message);
                if (data.reviews && data.reviews.length) {
                    setReviews(data.reviews);
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
    return (<>
        <div className="reviews flex justify-center mt-40 w-full px-4">
            <div className="flex-auto relative w-full lg:w-4/5 bg-[#ffe3ba] border-[1px] border-[#ffcb77] py-8 px-10 rounded-2xl shadow-lg sm:px-6">
                {/* Section Title */}
                <h1 className="text-center text-primary pb-16 font-semibold sm:text-xl lg:text-2xl sm:pb-10">
                    Love Notes from Our Couples
                </h1>

                {/* Reviews Wrapper */}
                <div className="reviews-wrapper overflow-hidden relative "
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}>
                    <div className="flex transition-transform duration-500" ref={slide}>
                        {/* item 1 */}
                        {
                            reviews.length ?
                                reviews.map((review) => (
                                    <div key={review.photo.key} className="wrapper flex-shrink-0 w-full transition-transform duration-500">
                                        <div className="flex-shrink-0 w-full flex lg:flex-row lg:gap-2 sm:flex-col sm:text-center sm:gap-4 sm:pb-8">
                                            <div className="lg:w-1/2 flex flex-col gap-3 justify-center items-center leading-5 sm:w-auto">
                                                <p className='text-primary text-desktopBodySmall font-semifont text-center'>
                                                    {review.reviewText}
                                                </p>
                                                <span className='text-primary text-desktopBodyLarge font-medium capitalize text-center'>{review.person.name}</span>
                                                <span className='text-primary text-desktopBodyLarge font-medium capitalize text-center'>{review.person.gender}</span>
                                            </div>
                                            <div className="lg:order-none flex-auto lg:w-1/2 lg:h-60 md:h-[22rem]  overflow-hidden sm:order-first sm:w-auto">
                                                <img className='lg:w-full h-full md:w-11/12 rounded-xl mx-auto object-cover bg-center' src={review.url} alt="client name" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                                : <div className="">No Reviews</div>
                        }
                    </div>
                </div>

                {/* Navigation Buttons */}
                <button
                    className="absolute left-4 lg:top-1/2 border-0 outline-none bg-[#FFE3C8] text-primary rounded-full p-2 shadow-lg sm:top-[90%]"
                    onClick={handlePrev}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <button
                    className="absolute right-4 lg:top-1/2 border-0 outline-none bg-[#FFE3C8] text-primary rounded-full p-2 shadow-lg sm:top-[90%]"
                    onClick={handleNext}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </div>

    </>
    )
}
