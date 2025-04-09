import React from "react"
import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FiCamera, FiVideo, FiStar, FiCheckCircle, FiPackage, FiMessageCircle, FiXCircle, FiPhone } from 'react-icons/fi';
import { FaInfoCircle, FaCreditCard, FaGlobe } from "react-icons/fa";
import { FiHeart, FiAward, FiClock, FiUsers, FiChevronDown, FiCalendar } from 'react-icons/fi';
import CountUp from 'react-countup';
import { useStudioDetails } from '../../../Context/StudioDetailsContext';

const packages = [
    {
        id: 1,
        title: "Enchanted Pre-Wedding",
        tagline: "Perfect for couples wanting storybook memories",
        total: 50000,
        offer: 40000,
        team: ["1 Cinematographer", "1 Candid Photographer", "1 Drone Pilot"],
        includes: [
            { text: "Story Based Cinematic Teaser", included: true },
            { text: "4-5 Min Cinematic Video", included: true },
            { text: "Instagram Reels (2-3)", included: true },
            { text: "35+ Retouched Photos", included: true },
            { text: "Full RAW Data", included: true },
            { text: "10 Save the Dates", included: true },
            { text: "Complimentary Photo Book", included: true },
            { text: "360° Virtual Tour", included: false },
            { text: "Drone Cinematography", included: false },
        ],
        description: "Ideal for intimate pre-wedding shoots and save-the-date creation. Capture those delicate moments that tell your unique love story.",
        isPopular: true,
        recommendedFor: "Intimate pre-wedding shoots & creative save-the-dates"
    },
    {
        id: 2,
        title: "Basic Wedding Package",
        tagline: "Essential coverage with a touch of elegance",
        total: 100000,
        offer: 85000,
        team: ["1 Traditional Videographer", "1 Traditional Photographer", "1 Cinematographer"],
        includes: [
            { text: "Luxury Cinematic Teaser", included: true },
            { text: "Luxury Cinematic Video", included: true },
            { text: "Instagram Reels (2-3)", included: true },
            { text: "35+ Retouched Photos", included: true },
            { text: "Full Wedding Film in 4k", included: false },
            { text: "300 PhotoBook Album", included: false },
            { text: "Complimentary Couple Frame", included: false },
            { text: "All Raw Data on Pendrive", included: true },
        ],
        description: "Great for couples who want essential coverage of their big day without extra frills. A perfect balance of creativity and tradition.",
        isPopular: false,
        recommendedFor: "Traditional wedding coverage on a budget"
    },
    {
        id: 3,
        title: "Premium 2-Day Wedding",
        tagline: "An all-inclusive celebration of love",
        total: 150000,
        offer: 130000,
        team: ["2 Traditional Videographers", "2 Traditional Photographers", "2 Cinematographers", "2 Candid Photographers", "1 Drone Pilot"],
        includes: [
            { text: "Luxury Cinematic Teaser", included: true },
            { text: "Luxury Cinematic Video", included: true },
            { text: "Instagram Reels (2-3)", included: true },
            { text: "35+ Retouched Photos", included: true },
            { text: "Full Wedding Film in 4k", included: true },
            { text: "300 PhotoBook Album", included: true },
            { text: "Complimentary Mini Book & Table Calendar", included: true },
            { text: "Complimentary Couple Frame", included: true },
            { text: "All Raw Data on Pendrive", included: true },
        ],
        description: "Perfect for a lavish 2-day wedding celebration where every detail matters. Relish every moment with comprehensive coverage.",
        isPopular: false,
        recommendedFor: "Large, elaborate weddings"
    },
    {
        id: 4,
        title: "Ultimate Wedding & Pre-Wedding Combo",
        tagline: "For couples who want it all",
        total: 240000,
        offer: 210000,
        team: ["2 Traditional Videographers", "2 Traditional Photographers", "2 Cinematographers", "2 Candid Photographers", "1 Drone Pilot"],
        includes: [
            { text: "Luxury Cinematic Teaser", included: true },
            { text: "Luxury Cinematic Video", included: true },
            { text: "Instagram Reels (2-3)", included: true },
            { text: "35+ Retouched Photos", included: true },
            { text: "Full Wedding Film in 4k", included: true },
            { text: "300 PhotoBook Album", included: true },
            { text: "Complimentary Mini Book & Table Calendar", included: true },
            { text: "Complimentary Couple Frame", included: true },
            { text: "All Raw Data on Pendrive", included: true },
            { text: "Story Based Cinematic Teaser (Pre-Wedding)", included: true },
            { text: "4-5 Min Cinematic Video (Pre-Wedding)", included: true },
            { text: "Instagram Reels (Pre-Wedding)", included: true },
            { text: "10 Save the Dates (Pre-Wedding)", included: true },
        ],
        description: "The ultimate combo for couples who desire comprehensive coverage for both pre-wedding and wedding events. Experience luxury in every frame.",
        isPopular: true,
        recommendedFor: "Couples who want complete, end-to-end coverage"
    },
];
const features = [
    {
        icon: <FaInfoCircle className="text-red-600 text-3xl" />,
        title: "Booking Information",
        description: "50% advance payment required to secure your date, with the balance due one week before the event."
    },
    {
        icon: <FaCreditCard className="text-red-600 text-3xl" />,
        title: "Payment Options",
        description: "We accept bank transfers, credit cards, and UPI payments for your convenience."
    },
    {
        icon: <FaGlobe className="text-red-600 text-3xl" />,
        title: "Travel Coverage",
        description: "We cover all locations in Mumbai at no extra cost. Additional charges apply for destination weddings."
    }
];
const stats = [
    { id: 1, number: 500, title: 'Weddings Captured', icon: <FiCamera className="lg:text-3xl sm:text-2xl" />, description: 'Magical moments preserved' },
    { id: 2, number: 10, title: 'Awards Won', icon: <FiAward className="lg:text-3xl sm:text-2xl" />, description: 'Industry recognition' },
    { id: 3, number: 1500, title: 'Happy Clients', icon: <FiHeart className="lg:text-3xl sm:text-2xl" />, description: 'Satisfied families' },
    { id: 4, number: 8, title: 'Years Experience', icon: <FiClock className="lg:text-3xl sm:text-2xl" />, description: 'In the industry' },
];

// Function to create the WhatsApp message text
const createWhatsAppMessage = (pkg) => {
    let message = `Hi, I'm interested in the "${pkg.title}" package.\n\n`;
    message += `${pkg.description}\n\n`;
    message += `Team: ${pkg.team.join(', ')}\n`;
    message += `Includes:\n`;
    pkg.includes.forEach(item => {
        message += `${item.included ? '✓' : '✗'} ${item.text}\n`;
    });
    message += `\nOffer Price: ${pkg.offer}\nTotal: ${pkg.total}\n\n`;
    message += `Please contact me with more details.`;
    return encodeURIComponent(message);
};
const PackageCard = ({ pkg, isExpanded, onToggle, studioContact }) => {
    return (
        <motion.div
            className="relative rounded-3xl p-8 mb-8 bg-gradient-to-br from-[#fdf1e9d9] to-[#f9e7db] hover:from-[#FFE9D9] hover:to-[#fbf3ef] shadow-lg overflow-hidden group"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            {/* Floating Sparkles */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                        initial={{ y: 0, x: Math.random() * 100 }}
                        animate={{
                            y: [0, 100, 0],
                            x: [Math.random() * 10, Math.random() * 10 + 10]
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </div>

            {/* Golden Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            {/* Popular Ribbon */}
            {pkg.isPopular && (
                <div className="absolute top-6 -right-10 bg-gradient-to-r from-[#FF6969] to-[#FF4D4D] text-white px-12 py-2 rotate-45 shadow-lg flex items-center gap-2">
                    <FiStar className="animate-pulse" />
                    <span className="text-sm font-bold tracking-wide text-nowrap">POPULAR CHOICE</span>
                </div>
            )}

            {/* Package Header */}
            <div className="mb-8 text-center">
                <h3 className="lg:text-desktopHeadlineSmall sm:text-mobileHeadlineSmall font-bold text-gray-800 relative pb-4 ">
                    {pkg.title}
                </h3>

                <div className="mt-6 space-y-4">
                    <div className="flex justify-center items-baseline gap-4">
                        <span className="lg:text-desktopBodyLarge sm:text-mobileBodyLarge text-gray-400 line-through text-nowrap">₹{Number(pkg.total).toLocaleString()}/-</span>
                        <span className="lg:text-desktopHeadlineSmall sm:text-mobileHeadlineSmall font-bold text-[#FF6969] text-nowrap">₹{Number(pkg.offer).toLocaleString()}/-</span>
                    </div>
                    <span className="inline-block bg-[#FF6969]/10 text-[#FF6969] px-4 py-2 rounded-full text-sm font-medium text-nowrap">
                        Save {Math.ceil(((pkg.total - pkg.offer) / pkg.total) * 100)}% • Limited Offer!
                    </span>
                </div>
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 mx-auto">
                <div className="flex items-center gap-3 p-4 sm:py-2 bg-[#ffdccc] rounded-xl">
                    <FiClock className="text-2xl text-[#FF6969] sm:text-xl" />
                    <div  >
                        <p className="text-xs text-gray-500 text-nowrap">Duration</p>
                        <p className="font-medium text-nowrap">{pkg.duration} Hours</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4  sm:py-2 bg-[#ffdccc] rounded-xl">
                    <FiUsers className="text-2xl text-[#FF6969] sm:text-xl" />
                    <div  >
                        <p className="text-xs text-gray-500 text-nowrap">Team Members</p>
                        <p className="font-medium text-nowrap">{pkg.team.length} Experts</p>
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-100 pt-8"
                    >
                        {/* Team Section */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FiVideo className="text-[#FF6969]" />
                                Your Dedicated Team
                            </h4>
                            <div className="grid gap-3">
                                {pkg.team.map((member, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#FFF5F5] rounded-lg">
                                        <FiCheckCircle className="text-[#FF6969]" />
                                        <span className="text-gray-700">{member}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Inclusions Section */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPackage className="text-[#FF6969]" />
                                What's Included
                            </h4>
                            <div className="grid gap-3">
                                {pkg.includes.map((item, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${item.included ? 'bg-[#FFF5F5]' : 'opacity-50'}`}>
                                        {item.included ? (
                                            <FiCheckCircle className="text-[#FF6969]" />
                                        ) : (
                                            <FiXCircle className="text-gray-400" />
                                        )}
                                        <span className={item.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gradient-to-r from-[#f97d7d] to-[#FF4D4D] rounded-xl p-6 text-center shadow-lg"
                        >
                            <div className="mb-4">
                                <p className="text-white text-lg font-bold mb-2">
                                    🎉 Special Launch Offer!
                                </p>
                                <p className="text-white/90 text-sm">
                                    Book now & get 2 free 8x10 premium prints
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.open(`https://wa.me/${studioContact?.[0] || ''}?text=${createWhatsAppMessage(pkg)}`, '_blank')}
                                className="w-full bg-white text-[#FF6969] py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                <FiMessageCircle className="text-xl" />
                                Instant Booking on WhatsApp
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expand Button */}
            <button
                onClick={() => onToggle(pkg.id)}
                className="w-full mt-6 flex items-center justify-center gap-2 text-[#FF6969] hover:text-[#FF4D4D] font-medium"
            >
                {isExpanded ? 'Show Less Details' : 'View Complete Package'}
                <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                >
                    <FiChevronDown />
                </motion.span>
            </button>
        </motion.div>
    );
};

const PackagesSection = () => {
    const [expandedPackageId, setExpandedPackageId] = useState(null);
    const { studioContact } = useStudioDetails();

    return (<>
        <section
            id="pricing"
            className="lg:py-10 sm:py-0 px-4 bg-gradient-to-b from-[#fedecf] to-[#faefe7]/50 relative overflow-hidden bg-opacity-50 lg:rounded-3xl sm:rounded-lg border-[#fed6c3] border-[1px]">
            {/* Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Floating Hearts */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-[#FF6969]/10"
                        initial={{ y: 0, x: Math.random() * 100, rotate: Math.random() * 360 }}
                        animate={{
                            y: [0, 100],
                            rotate: Math.random() * 360
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 32 + 24}px`
                        }}
                    >
                        <FiHeart />
                    </motion.div>
                ))}

                {/* Golden Swirls */}
                <motion.div
                    className="absolute -left-24 -top-24 w-48 h-48 opacity-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
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

                {/* Gradient Waves */}
                <div className="absolute top-0 left-0 w-full -translate-y-1/3">
                    <svg viewBox="0 0 1440 320" className="w-full">
                        <path
                            fill="#FF6969"
                            fillOpacity="0.05"
                            d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                        ></path>
                    </svg>
                </div>
            </div>

            <div className="max-w-7xl mx-auto relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="bg-[#FF6969]/10 text-[#FF6969] px-6 py-2 rounded-full inline-block mb-4">
                        <FiStar className="inline mr-2" />
                        Most Chosen Packages
                    </div>
                    <h2 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium font-bold text-gray-900 mb-4">
                        Perfect Plans for Your Perfect Day
                    </h2>
                    <p className="lg:text-desktopHeadlineSmall sm:text-mobileBodyLarge text-gray-600 max-w-2xl mx-auto">
                        Tailored packages that capture every magical moment of your wedding journey
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 lg:gap-8 sm:gap-4">
                    {packages.map((pkg) => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            isExpanded={expandedPackageId === pkg.id}
                            onToggle={(id) => setExpandedPackageId(prev => prev === id ? null : id)}
                            studioContact={studioContact}
                        />
                    ))}
                </div>
            </div>
        </section>
        <ComparativeCTA studioContact={studioContact} />
        <TrackRecord />
        {/* Consultation CTA */}
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="my-10 bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] rounded-2xl p-8  border border-gray-100"
        >
            <div className="text-center max-w-3xl mx-auto">
                <div className="mb-6">
                    <FiHeart className="text-[#FF6969] w-12 h-12 mx-auto mb-4" />
                    <h3 className="lg:text-desktopHeadlineSmall sm:text-mobileHeadlineSmall font-bold text-gray-900 mb-2 text-nowrap">
                        Need Personal Assistance?
                    </h3>
                    <p className="text-gray-600">
                        Schedule a free 30-minute consultation with our wedding experts
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4  ">
                    <motion.button
                        onClick={() =>
                            window.open(
                                `https://wa.me/${studioContact[0]}?text=${encodeURIComponent(
                                    "Hello! I'm interested in discussing a quote with you. Please get in touch."
                                )}`,
                                '_blank'
                            )
                        }
                        whileHover={{ scale: 1.05 }}
                        className="sm:text-modileBodySmall bg-[#FF4D4D] text-white lg:px-8 py-3 sm:px-4 rounded-lg flex items-center justify-center gap-2 text-nowrap"
                    >
                        <FiCalendar className="sm:h-4 sm:w-4 lg:h-8 lg:w-8" />
                        Free Consultation
                    </motion.button>

                    <motion.button
                        onClick={() => (window.location.href = `tel:${studioContact[1]}`)}
                        whileHover={{ scale: 1.05 }}
                        className="sm:text-modileBodySmall bg-white text-[#FF6969] lg:px-8 py-3 sm:px-4 rounded-lg border-2 border-[#FF6969] flex items-center justify-center gap-2 text-nowrap"
                    >
                        <FiPhone className="sm:h-4 sm:w-4 lg:h-8 lg:w-8" />
                        Instant Call Back
                    </motion.button>

                </div>
            </div>
        </motion.div>
    </>);
};


const ComparativeCTA = ({ studioContact }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="relative bg-[#FAF1E6] lg:p-8 sm:p-6 lg:rounded-3xl sm:rounded-lg -mx-4 lg:mt-8 sm:mt-4 text-center bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] overflow-hidden"
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full -translate-y-1/3">
                <svg viewBox="0 0 1440 320" className="w-full">
                    <path
                        fill="#FF6969"
                        fillOpacity="0.1"
                        d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                    ></path>
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

            {/* Animated Golden Swirl */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -right-24 -top-24 w-48 h-48 opacity-10"
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

            <h2 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium font-bold text-gray-900 relative z-10">
                Need a Custom Package?
                {/* Animated Underline */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    className="w-24 h-1 bg-[#FF6969] mx-auto mt-2 rounded-full"
                    style={{ originX: 0.5 }}
                />
            </h2>

            <p className="mt-4 text-gray-600 max-w-2xl mx-auto relative z-10">
                We understand that every wedding is unique. Contact us to create a tailored photography and cinematography
                package that perfectly fits your specific requirements and budget.
            </p>

            <div className="mt-6 relative z-10">
                <motion.button
                    onClick={() => window.open(
                        `https://wa.me/${studioContact?.[0] || ''}?text=${encodeURIComponent(
                            "Hello! I'm interested in booking your studio for my event. " +
                            "Could you please share available dates and package details?"
                        )}`,
                        '_blank'
                    )}
                    whileHover={{ scale: 1.05 }}
                    className="flex mx-auto justify-between items-center bg-[#FF4D4D] text-white font-semibold py-3 px-6 rounded-md shadow-lg hover:bg-red-400 transition-all relative overflow-hidden"
                >
                    {/* Button Sparkle */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-4 -top-4 opacity-30"
                    >
                        <FiStar className="w-8 h-8 text-[#FFD700]" />
                    </motion.div>

                    <FiVideo className="mr-2" />
                    Schedule Free Consultation
                </motion.button>
            </div>

            <div className="lg:mt-12 sm:mt-6 grid sm:grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        className="bg-[#FDFAF6] p-6 rounded-lg lg:shadow-md hover:shadow-xl transition-all relative overflow-hidden group"
                        whileHover={{ y: -5 }}
                    >
                        {/* Feature Card Accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6969]/10 rounded-bl-full transform translate-x-1/3 -translate-y-1/3 rotate-45" />

                        <div className="flex items-center justify-center lg:mb-4 mx-auto bg-red-100 p-4 rounded-full w-fit group-hover:bg-[#FFD700]/20 transition-colors">
                            {feature.icon}
                        </div>
                        <h3 className="lg:text-desktopBodyMedium sm:text-mobileBodyMedium font-semibold text-gray-900">
                            {feature.title}
                        </h3>
                        <p className="lg:text-desktopBodySmall sm:text-mobileBodySmall mt-2 text-gray-600">
                            {feature.description}
                        </p>

                        {/* Hover Element */}
                        <div className="absolute inset-0 border-2 border-[#FF6969]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg m-1" />
                    </motion.div>
                ))}
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                        initial={{ y: 0, x: Math.random() * 100 }}
                        animate={{
                            y: [0, 100, 0],
                            x: [Math.random() * 10, Math.random() * 10 + 10]
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>
        </motion.div>
    )
}


const StatItem = ({ stat }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
    const [startCounter, setStartCounter] = useState(false);

    if (isInView && !startCounter) {
        setStartCounter(true);
    }

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#FDFAF6] text-primary rounded-2xl lg:p-8 sm:p-4 text-center shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
        >
            {/* Golden Flare */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="inline-block bg-[#FF4D4D] text-white lg:p-4 sm:p-3 lg:rounded-2xl sm:rounded-md mb-3 lg:mb-6 transform group-hover:-rotate-12 transition-transform">
                    {stat.icon}
                </div>
                <h3 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium tracking-wider font-extrabold text-[#B33A3A] mb-2">
                    {startCounter && (
                        <CountUp
                            end={stat.number}
                            duration={2.5}
                            separator=","
                            suffix={stat.id !== 4 ? "+" : ""}
                        />
                    )}
                    <span className="text-[#FFD700] ml-2">★</span>
                </h3>
                <p className="lg:text-desktopBodyMedium sm:text-mobileBodyMedium font-semibold text-secondary_on mb-2 text-nowrap">
                    {stat.title}
                </p>
                <p className="lg:text-desktopBodySmall sm:text-mobileBodySmall text-[#74583E]">
                    {stat.description}
                </p>
            </div>

            {/* Animated Border */}
            <div className="absolute inset-0 border-2 border-[#FFD700] opacity-0 group-hover:opacity-30 transition-opacity rounded-2xl" />
        </motion.div>
    );
};

const TrackRecord = () => {
    return (
        <section className="lg:py-10 lg:mt-5 lg:rounded-3xl sm:rounded-lg -mx-4 bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 py-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                    className="text-center lg:mb-12 sm:mb-8"
                >
                    <div className="inline-block bg-[#FF4D4D] text-[#FFF0E6] px-6 py-2 rounded-full lg:text-desktopBodySmall sm:text-mobileBodySmall font-medium mb-6 shadow-lg">
                        <span className="drop-shadow-md text-nowrap">Our Legacy in Numbers</span>
                    </div>
                    <h2 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineSmall text-secondary_on mb-4">
                        Crafting Timeless Memories Since 2020
                    </h2>
                    <p className="lg:text-desktopBodyLarge sm:text-mobileBodyLarge text-[#74583E] max-w-2xl mx-auto">
                        Trusted by generations, our lens has witnessed countless stories of love,
                        tradition, and celebration.
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 sm:gap-4">
                    {stats.map((stat) => (
                        <StatItem key={stat.id} stat={stat} />
                    ))}
                </div>

                {/* Authenticity Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-12 text-mobileBodySmall text-[#74583E] text-nowrap"
                >
                    *Verified through client records & vendor partnerships
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-[#f6c2b9c9] rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#FF4D4D]/10 rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
        </section>
    );
};


export default PackagesSection;

