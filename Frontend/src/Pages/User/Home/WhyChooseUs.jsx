import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { FiCamera, FiFilm, FiBriefcase, FiZap, FiGlobe, FiHeart } from 'react-icons/fi';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            staggerChildren: 0.2,
            when: 'beforeChildren',
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 120 }
    },
};
const quotes = [
    "\"We don't just capture moments - we create timeless emotional artifacts.\"",
    "\"Every snapshot tells a unique story of love, laughter, and cherished memories.\"",
    "\"Your love deserves to be celebrated with every frame, every smile, every tear.\""
];
const TypewriterQuotes = ({ variants }) => {
    const [displayText, setDisplayText] = useState('');
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        const currentQuote = quotes[quoteIndex];
        let timeout;

        if (charIndex < currentQuote.length) {
            // Type one character at a time
            timeout = setTimeout(() => {
                setDisplayText(currentQuote.substring(0, charIndex + 1));
                setCharIndex(charIndex + 1);
            }, 100); // Adjust typing speed here
        } else {
            // Pause at the end of the quote before moving to next one
            timeout = setTimeout(() => {
                // Reset for next quote
                setDisplayText('');
                setCharIndex(0);
                setQuoteIndex((prev) => (prev + 1) % quotes.length);
            }, 3000); // Pause duration after finishing a quote
        }
        return () => clearTimeout(timeout);
    }, [charIndex, quoteIndex]);

    return (
        <motion.blockquote
            className="mt-16 text-center italic lg:text-desktopBodyLarge sm:text-mobileBodyMedium text-secondary font-primary max-w-2xl mx-auto"
            variants={variants}
        >
            {displayText}
            <span className="border-r-2 border-secondary ml-1 animate-pulse" />
        </motion.blockquote>
    );
};
function TiltCard({ icon, title, description, idx }) {
    const cardRef = useRef(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e) => {
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
        setDimensions({ w: rect.width, h: rect.height });
    };

    const handleMouseLeave = () => {
        mouseX.set(dimensions.w / 2);
        mouseY.set(dimensions.h / 2);
    };
    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setDimensions({ w: rect.width, h: rect.height });
            // Initialize the cursor to the center, so the card stays flat
            mouseX.set(rect.width / 2);
            mouseY.set(rect.height / 2);
        }
    }, []);

    // Tilt transformations
    const rotateX = useTransform(mouseY, [0, dimensions.h], [8, -8]);
    const rotateY = useTransform(mouseX, [0, dimensions.w], [-8, 8]);
    const translateZ = useTransform(
        mouseY,
        [0, dimensions.h],
        [0, 15]
    );

    // Gradient effect
    const gradient = useTransform([mouseX, mouseY], ([x, y]) =>
        `radial-gradient(300px at ${x}px ${y}px, 
      rgba(250, 215, 160, 0.4) 0%, 
      rgba(255, 247, 238, 0.2) 50%, 
      rgba(229, 189, 167, 0) 100%)`
    );

    // Border highlight
    const borderMask = useTransform([mouseX, mouseY], ([x, y]) =>
        `radial-gradient(200px at ${x}px ${y}px, 
      rgba(0,0,0,1) 20%, 
      rgba(0,0,0,0.3) 60%, 
      rgba(0,0,0,0) 100%)`
    );

    return (
        <motion.div
            ref={cardRef}
            className="p-6 rounded-lg shadow-lg bg-primary relative overflow-hidden 
                 cursor-pointer group"
            style={{
                rotateX,
                rotateY,
                translateZ,
                perspective: 1000,
                transformStyle: 'preserve-3d',
            }}
            variants={itemVariants}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            {/* Gradient overlay */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: gradient }}
            />

            {/* Border highlight */}
            <motion.div
                className="absolute inset-0 border-2 pointer-events-none opacity-0 
                   group-hover:opacity-100 transition-opacity"
                style={{
                    borderColor: '#5E6572',
                    mask: borderMask,
                    WebkitMask: borderMask,
                }}
            />

            {/* Content */}
            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="text-tertiary text-2xl p-3 bg-primary_on rounded-lg">
                        {icon}
                    </div>
                    <h3 className="lg:text-xl sm:text-mobileHeadlineSmall font-semibold text-primary font-primary">
                        {title}
                    </h3>
                </div>
                <p className="text-tertiary_on font-primary lg:text-desktopBodyMedium sm:text-mobileBodyMedium text-center">{description}</p>
            </div>
        </motion.div>
    );
}

const WhyChooseUs = () => {
    const features = [
        {
            icon: <FiZap className="w-6 h-6" />,
            title: "Decade of Expertise",
            description:
                "With 8+ years mastering wedding photography, we handle every lighting condition, venue, and cultural tradition seamlessly."
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


    return (
        <motion.section
            className="px-4 py-8 lg:py-24 bg-primary my-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
        >
            <div className="max-w-6xl mx-auto">
                <motion.div className="mb-12 text-center" variants={itemVariants}>
                    <motion.h2
                        className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium font-bold mb-6 text-primary font-primary"
                        variants={itemVariants}>
                        WHY CHOOSE
                        <br />
                        <span className="text-secondary lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium">THE WEDDING BOYS?</span>
                    </motion.h2>
                    <motion.div
                        className="mx-auto h-1 bg-secondary"
                        variants={itemVariants}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 1, ease: 'circOut' }}
                    />
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {features.map((feature, index) => (
                        <TiltCard key={index} {...feature} idx={index} />
                    ))}
                </div>

                <TypewriterQuotes
                    variants={itemVariants}
                />
            </div>

        </motion.section>
    );
};

export default WhyChooseUs;