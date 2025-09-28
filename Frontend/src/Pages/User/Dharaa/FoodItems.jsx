import React, { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence, useInView } from 'framer-motion';

import basundi from "../../../Asset/Dharaa/Food/basundi.jpg"
import briyani from "../../../Asset/Dharaa/Food/briyani.jpg"
import drinks from "../../../Asset/Dharaa/Food/drinks.jpg"
import gulubjamun from "../../../Asset/Dharaa/Food/gulabjamun.jpg"
import icecream from "../../../Asset/Dharaa/Food/icecream.jpg"
import kebab from "../../../Asset/Dharaa/Food/kebab.jpg"
import paniPuri from "../../../Asset/Dharaa/Food/pani-puri.jpg"
import panner from "../../../Asset/Dharaa/Food/panner.jpg"
import pizza from "../../../Asset/Dharaa/Food/pizza.jpg"

function FoodItems() {
    const scrollRef = useRef(null)

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current
            const scrollTo =
                direction === "left"
                    ? scrollLeft - clientWidth
                    : scrollLeft + clientWidth
            scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" })
        }
    }

    const topDishes = [
        { img: basundi, title: "Basundi", package: "Gold" },
        { img: briyani, title: "Veg Dum Biryani", package: "Gold/Platinum" },
        { img: drinks, title: "Refreshing Drinks", package: "All Packages" },
        { img: gulubjamun, title: "Gulab Jamun", package: "Silver" },
        { img: icecream, title: "Ice Cream Varieties", package: "Gold/Platinum" },
        { img: kebab, title: "Hara Bhara Kabab", package: "Platinum" },
        { img: paniPuri, title: "Pani Puri", package: "Gold/Platinum" },
        { img: panner, title: "Paneer Tikka Masala", package: "Gold/Platinum" },
        { img: pizza, title: "Cheese Pizza", package: "Platinum" },
    ]

    return (
        <section className="lg:py-10 sm:py-5 px-4 sm:px-6 lg:px-8  bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden lg:rounded-3xl sm:rounded-lg">

            {/* henna top border */}
            <div className="absolute top-0 left-0 w-full">
                <svg viewBox="0 0 1440 320" className="w-full">
                    <path
                        fill="#FF6969"
                        fillOpacity="0.1"
                        d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                    ></path>
                </svg>
            </div>
            {/* Henna-inspired bottom Border */}
            <div className="absolute bottom-0 left-0 w-full opacity-10 transform rotate-180">
                <svg viewBox="0 0 1440 120" className="w-full">
                    <path fill="#FF6969" d="M0,120 C200,80 400,40 720,40 C1040,40 1240,80 1440,120 L1440,0 L0,0 Z"
                        stroke="#FFD700" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
            </div>
            {/* Floating Florals */}
            <div className="absolute top-4 left-4 w-16 h-16 opacity-20">
                <motion.svg
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    viewBox="0 0 24 24"
                >
                    <path fill="#FFD700" d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2zm0 18c-3 0-6-3-6-6s3-6 6-6 6 3 6 6-3 6-6 6z" />
                    <path fill="#FF6969" d="M12 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
                </motion.svg>
            </div>
            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
                Our Top Dishes
            </h2>
            <p className="text-gray-600 text-center mt-2 mb-10 max-w-lg mx-auto text-sm sm:text-base">
                Explore our most loved dishes from different packages.
            </p>

            {/* Scroll Container */}
            <div className="relative">
                {/* Left Button */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-2 rounded-full hover:bg-white transition sm:flex hidden"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>

                {/* Right Button */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md p-2 rounded-full hover:bg-white transition sm:flex hidden"
                >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>

                {/* Dish Cards */}
                <div
                    ref={scrollRef}
                    className="flex space-x-5 overflow-x-hidden pb-4 "
                >
                    {topDishes.map((dish, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-56 sm:w-64 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100"
                        >
                            <img
                                src={dish.img}
                                alt={dish.title}
                                className="w-full h-40 object-cover rounded-t-2xl"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {dish.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Included in:{" "}
                                    <span className="font-semibold text-orange-600">
                                        {dish.package}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Footer */}
            <p className="text-center mt-8 text-gray-700 text-sm sm:text-base">
                🍴 These are just a <span className="font-semibold">few</span> of our
                specialties — we have{" "}
                <span className="text-orange-600 font-bold">many more</span> to make
                your event unforgettable!
            </p>
        </section>
    )
}

export default FoodItems
