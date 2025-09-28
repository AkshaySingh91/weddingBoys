import React from 'react'
import Wedding from "../../../Asset/Dharaa/Wedding.jpg"
import OfficeEvent from "../../../Asset/Dharaa/office-event.jpg"
import BirthdayParty from "../../../Asset/Dharaa/birthday.jpg"
import Party from "../../../Asset/Dharaa/party.jpg"
import { motion, AnimatePresence, useInView } from 'framer-motion';

function EventTypes() {
    const eventTypes = [
        { img: Wedding, title: "Wedding" },
        { img: OfficeEvent, title: "Office Event" },
        { img: BirthdayParty, title: "Birthday Party" },
        { img: Party, title: "Festival / Party" },
    ];

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
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center">
                Events We Cater
            </h2>
            <p className="text-gray-600 text-center mt-2 mb-10 sm:mb-14 max-w-xl mx-auto text-sm sm:text-base">
                From weddings to office parties, we serve with passion and perfection.
                <br className="hidden sm:block" />
                For more events, contact us for <span className="font-semibold text-orange-600">free consultation</span>.
            </p>

            {/* Event Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {eventTypes.map((event, index) => (
                    <div
                        key={index}
                        className="relative rounded-2xl overflow-hidden shadow-md group"
                    >
                        <img
                            src={event.img}
                            alt={event.title}
                            className="w-full h-52 sm:h-56 lg:h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-4">
                            <span className="text-white font-semibold text-lg sm:text-xl drop-shadow-lg">
                                {event.title}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <button
                    className="bg-orange-600 text-white px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:bg-orange-700 transition-all font-bold text-sm sm:text-base cursor-pointer z-10"
                    onClick={() => window.open(`https://wa.me/9054794444`, '_blank')}
                >
                    Book Your Event
                </button>
            </div>
        </section>
    )
}

export default EventTypes
