import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FiCamera, FiFilm, FiBriefcase, FiZap, FiGlobe, FiHeart, FiStar } from 'react-icons/fi';

// Simplified animations
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.3,
            staggerChildren: 0.1,
        },
    },
};

const TypewriterQuotes = React.memo(({ quotes }) => {
    const [displayText, setDisplayText] = useState('');
    const [quoteIndex, setQuoteIndex] = useState(0);
    const timeoutRef = useRef(null);

    const typeText = useCallback((currentQuote, charIndex) => {
        if (charIndex < currentQuote.length) {
            timeoutRef.current = setTimeout(() => {
                setDisplayText(currentQuote.substring(0, charIndex + 1));
                typeText(currentQuote, charIndex + 1);
            }, 50);
        } else {
            timeoutRef.current = setTimeout(() => {
                setDisplayText('');
                setQuoteIndex(prev => (prev + 1) % quotes.length);
            }, 2000);
        }
    }, []);

    useEffect(() => {
        const currentQuote = quotes[quoteIndex];
        typeText(currentQuote, 0);

        return () => clearTimeout(timeoutRef.current);
    }, [quoteIndex, typeText, quotes]);

    return (
        <motion.blockquote
            className="mt-12 text-center italic text-lg text-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {displayText}
            <span className="ml-1 border-r-2 border-secondary animate-pulse" />
        </motion.blockquote>
    );
});

const TiltCard = React.memo(({ icon, title, description }) => {
    const controls = useAnimation();
    const cardRef = useRef(null);

    const handleHover = useCallback(() => {
        controls.start({
            scale: 1.02,
            transition: { duration: 0.2 }
        });
    }, [controls]);

    const handleHoverEnd = useCallback(() => {
        controls.start({
            scale: 1,
            transition: { duration: 0.2 }
        });
    }, [controls]);

    return (
        <motion.div
            ref={cardRef}
            className="p-6 rounded-lg shadow-lg bg-white relative overflow-hidden cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            animate={controls}
            onHoverStart={handleHover}
            onHoverEnd={handleHoverEnd}
            transition={{ duration: 0.3 }}
        >
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="text-[#FF6969] text-2xl p-3 bg-[#FFF5F5] rounded-lg">
                        {icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                </div>
                <p className="text-gray-600 text-md">{description}</p>
            </div>
        </motion.div>
    );
});

const WhyChooseUs = () => {
    const features = [
        {
            icon: <FiZap className="w-6 h-6" />,
            title: "Decade of Expertise",
            description: (<>
                With <b>8+ years</b> mastering wedding photography, we handle every lighting condition, venue, and cultural tradition seamlessly.
            </>)
        },
        {
            icon: <FiFilm className="w-6 h-6" />,
            title: "Artistic Storytelling",
            description:
                "We combine candid, editorial, and fine-art styles to narrate your love story with elegance and flair."
        },
        {
            icon: <FiGlobe className="w-6 h-6" />,
            title: "Destination Experts",
            description:
                "From tropical beaches to urban rooftops, we’ve covered diverse venues worldwide, adapting to any setting."
        },
        {
            icon: <FiBriefcase className="w-6 h-6" />,
            title: "Tailored Packages",
            description:
                "Choose from fully customizable packages that suit your budget, including efficient post-production for a quick turnaround."
        },
        {
            icon: <FiCamera className="w-6 h-6" />,
            title: "Cinematic Weddings",
            description:
                "We bring a film-like approach to every ceremony, capturing the emotional arc of your day in vivid detail."
        },
        {
            icon: <FiHeart className="w-6 h-6" />,
            title: "Authentic Emotions",
            description:
                "We have a keen eye for genuine laughter, tears, and those spontaneous moments that make your day unique."
        },
    ];


    const quotes = [
        "\"We don't just capture moments - we create timeless emotional artifacts.\"",
        "\"Every snapshot tells a unique story of love, laughter, and cherished memories.\"",
        "\"Your love deserves to be celebrated with every frame, every smile, every tear.\""
    ];
    return (
        <section 
        id='whyToChooseUs'
        className="px-4 sm:py-10 lg:py-16 relative overflow-hidden bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] sm:my-10 lg:my-8  lg:rounded-3xl sm:rounded-lg border-[#fed6c3] border-[1px]">
            {/* Floating Hearts Decoration */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-[#FF6969]/10"
                        initial={{
                            y: Math.random() * 100,
                            x: Math.random() * 100,
                            rotate: Math.random() * 360
                        }}
                        animate={{
                            y: [0, 100],
                            x: [0, Math.random() * 50 - 25],
                            rotate: 360
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
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    className="mb-12 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="bg-[#FF6969]/10 text-[#FF6969] px-6 py-2 rounded-full inline-block mb-4">
                        <FiStar className="inline mr-2 animate-pulse" />
                        Why We Stand Out
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#5E2B17] mb-4 font-serif">
                        Why Choose
                        <br />
                        <span className="text-[#FF6969]">The Wedding Boys?</span>
                    </h2>
                    <motion.div
                        className="mx-auto w-24 h-1 bg-[#FF6969] rounded-full"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    className="grid md:grid-cols-2 gap-6 lg:gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={containerVariants}
                            whileHover={{ y: -5 }}
                        >
                            <TiltCard {...feature} />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Quote Section */}
                <div className="relative mt-16">
                    <FiHeart className="absolute -top-4 left-1/2 -translate-x-1/2 text-[#FF6969]/20 w-16 h-16" />
                    <TypewriterQuotes quotes={quotes} />
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;