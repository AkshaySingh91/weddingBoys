'use client';

import React from "react"
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FiCamera, FiVideo, FiStar, FiCheckCircle, FiPackage, FiMessageCircle, FiPhone } from 'react-icons/fi';
import { FaInfoCircle, FaCreditCard, FaGlobe } from "react-icons/fa";
import { FiHeart, FiAward, FiClock, FiUsers, FiChevronRight, FiCalendar } from 'react-icons/fi';
import CountUp from 'react-countup';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import PackageModal from '@/Component/PackageModal.jsx';
import Section from '@/Component/ui/Section.jsx';

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
    { id: 1, number: 1000, title: 'Weddings Captured', icon: <FiCamera className="lg:text-3xl sm:text-2xl" />, description: 'Magical moments preserved' },
    { id: 2, number: 25, title: 'Awards Won', icon: <FiAward className="lg:text-3xl sm:text-2xl" />, description: 'Industry recognition' },
    { id: 3, number: 1500, title: 'Happy Clients', icon: <FiHeart className="lg:text-3xl sm:text-2xl" />, description: 'Satisfied families' },
    { id: 4, number: 5, title: 'Years Experience', icon: <FiClock className="lg:text-3xl sm:text-2xl" />, description: 'In the industry' },
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

/**
 * One package, at a glance.
 *
 * Was a tall expanding card in a two-column grid. Expanding grew the grid ROW,
 * so opening one stretched its neighbour and left a column of empty card beside
 * the detail. The detail now opens in PackageModal and the four cards keep
 * their shape.
 *
 * **Every zone has a reserved height** so the four cards line up row for row:
 * badge, title, tagline, price, the team/deliverables rule, then the list. A
 * one-line title next to a two-line title would otherwise push every row below
 * it out of step, and the popular badge would push two of the four down by its
 * own height. Measured across all four; the rows share a baseline.
 */
const PackageCard = ({ pkg, onOpen }) => {
    const save = Math.ceil(((pkg.total - pkg.offer) / pkg.total) * 100);
    const included = pkg.includes.filter((i) => i.included);
    const preview = included.slice(0, 4);
    const moreCount = included.length - preview.length;

    return (
        <article
            /* border-2 on every card, colour is the only difference. A 2px
               border on the popular ones against 1px elsewhere pushed their
               rows down by exactly 1px — visible when four cards are read
               across. */
            className={`relative flex h-full w-[82vw] shrink-0 snap-start flex-col overflow-hidden
                        rounded-media border-2 sm:w-auto sm:shrink
                        bg-ground-raised shadow-panel transition-transform duration-ui ease-standard
                        hover:-translate-y-1 focus-within:-translate-y-1
                        ${pkg.isPopular ? 'border-accent' : 'border-gold/35'}`}
        >
            {/* The original diagonal corner ribbon, restored. Positioned
                absolutely and clipped by the card's own overflow-hidden, so it
                costs the card no vertical space — which is what keeps all four
                cards' rows on the same baselines. The top band it replaces cost
                30px and pushed two of the four down by exactly that. */}
            {pkg.isPopular && (
                <p className="pointer-events-none absolute -right-[58px] top-[30px] z-10 w-[196px]
                              rotate-45 bg-accent py-1 text-center text-[9px] font-bold
                              tracking-[0.06em] text-white shadow-panel">
                    POPULAR CHOICE
                </p>
            )}

            <div className="flex flex-1 flex-col p-5">
                {/* Two lines reserved: titles run one to three words or seven. */}
                {/* pr-12 on every title, not only the popular ones: the corner
                    ribbon sits over that space, and padding only the two that
                    have it would give the four cards different wrap points.
                    Three lines reserved (3 x 1.3em leading) because the longest
                    title needs three once the ribbon's space is taken out — with
                    two reserved it grew and pushed that card's rows 32px below
                    its neighbours'. */}
                <h3 className="t-heading-2 min-h-[3.9em] max-w-none pr-12">{pkg.title}</h3>
                <p className="t-body-sm mt-1 min-h-[3.2em] text-ink-muted">{pkg.tagline}</p>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-display text-[28px] font-semibold leading-none text-accent-ink">
                        ₹{Number(pkg.offer).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[14px] text-ink-muted line-through">
                        ₹{Number(pkg.total).toLocaleString('en-IN')}
                    </span>
                </div>
                <p className="mt-2.5 w-fit rounded-pill bg-accent-tint px-2.5 py-1 text-[12px] font-semibold text-accent-ink">
                    Save {save}%
                </p>

                {/* Two real, derived figures. The old card showed
                    `{pkg.duration} Hours` and no package object has a `duration`
                    field, so every card rendered the word "Hours" with nothing
                    in front of it. */}
                <dl className="mt-4 grid grid-cols-2 gap-2 border-y border-gold/25 py-3">
                    <div>
                        <dt className="text-[12px] text-ink-muted">Team</dt>
                        <dd className="text-[15px] font-semibold text-ink">{pkg.team.length} people</dd>
                    </div>
                    <div>
                        <dt className="text-[12px] text-ink-muted">Deliverables</dt>
                        <dd className="text-[15px] font-semibold text-ink">{included.length} items</dd>
                    </div>
                </dl>

                <ul className="mt-4 flex-1 space-y-2">
                    {preview.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[14px] leading-snug text-ink-secondary">
                            <FiCheckCircle aria-hidden="true" className="mt-[3px] h-3.5 w-3.5 shrink-0 text-accent-ink" />
                            {item.text}
                        </li>
                    ))}
                    {moreCount > 0 && (
                        <li className="pl-[22px] text-[14px] text-ink-muted">+{moreCount} more</li>
                    )}
                </ul>

                <button
                    type="button"
                    onClick={() => onOpen(pkg)}
                    className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-pill
                               border border-gold-strong/60 px-4 text-[14px] font-semibold text-ink
                               transition-colors duration-micro ease-standard hover:bg-accent-wash
                               hover:text-accent-ink focus-ring"
                >
                    View full details
                    <FiChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
            </div>
        </article>
    );
};

// Random values for PackagesSection's floating hearts decoration. Generated
// client-side only (post-mount) so server and client markup match on first
// paint — Math.random() during render is a hydration mismatch under SSR.
function makeHearts() {
    return Array.from({ length: 8 }, () => ({
        initialX: Math.random() * 100,
        initialRotate: Math.random() * 360,
        animRotate: Math.random() * 360,
        duration: 15 + Math.random() * 10,
        left: `${Math.random() * 100}%`,
        fontSize: `${Math.random() * 32 + 24}px`,
    }));
}

const PackagesSection = () => {
    const [openPackage, setOpenPackage] = useState(null);
    const { studioContact } = useStudioDetails();
    const [hearts, setHearts] = useState(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHearts(makeHearts());
    }, []);

    return (<>
        <Section width="wide" rhythm="tight" id="pricing" aria-labelledby="pricing-heading">
        <div className="py-10 px-5 sm:px-7 lg:py-12 bg-gradient-to-b from-[#fedecf] to-[#faefe7]/50 relative overflow-hidden bg-opacity-50 lg:rounded-3xl sm:rounded-lg border-[#fed6c3] border-[1px]">
            {/* Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Floating Hearts */}
                {hearts?.map((heart, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-[#FF6969]/10"
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
                <div
                    className="text-center mb-16"
                >
                    <div className="bg-[#FF6969]/10 text-[#FF6969] px-6 py-2 rounded-full inline-block mb-4">
                        <FiStar className="inline mr-2" />
                        Most Chosen Packages
                    </div>
                    <h2 id="pricing-heading" className="t-display-2 mx-auto mb-4">
                        Perfect Plans for Your Perfect Day
                    </h2>
                    <p className="t-body-lead mx-auto max-w-2xl">
                        Tailored packages that capture every magical moment of your wedding journey
                    </p>
                </div>

                {/* Four in one row on desktop, as a price table should be —
                    they exist to be compared against each other. */}
                {/* A swipe rail on phones — four full-width cards ran 3 screens.
                    From sm up it is the grid, four across at lg, which is what a
                    price table should be. */}
                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-none pb-2
                                -mr-5 pr-5
                                sm:mr-0 sm:pr-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible
                                lg:grid-cols-4 lg:gap-6 sm:items-stretch">
                    {packages.map((pkg) => (
                        <PackageCard key={pkg.id} pkg={pkg} onOpen={setOpenPackage} />
                    ))}
                </div>
            </div>
        </div>
        </Section>

        {openPackage && (
            <PackageModal
                pkg={openPackage}
                whatsappHref={`https://wa.me/${studioContact?.[0] || ''}?text=${createWhatsAppMessage(openPackage)}`}
                onClose={() => setOpenPackage(null)}
            />
        )}

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
                    <h3 className="font-display text-[24px] lg:text-[32px] font-semibold text-gray-900 mb-2">
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


// Random values for ComparativeCTA's floating particles decoration.
function makeParticles() {
    return Array.from({ length: 8 }, () => ({
        initialX: Math.random() * 100,
        animX0: Math.random() * 10,
        animX1: Math.random() * 10 + 10,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 2,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
    }));
}

const ComparativeCTA = ({ studioContact }) => {
    const [particles, setParticles] = useState(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setParticles(makeParticles());
    }, []);

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

            <h2 className="t-display-2 mx-auto text-gray-900 relative z-10">
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
                {particles?.map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                        initial={{ y: 0, x: particle.initialX }}
                        animate={{
                            y: [0, 100, 0],
                            x: [particle.animX0, particle.animX1]
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay
                        }}
                        style={{
                            left: particle.left,
                            top: particle.top
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
                {/* Was an <h3> holding the number, with the label in a <p>
                    beneath — inverted, and until the counter fired the heading's
                    entire text content was a star glyph. A stat is a term and a
                    value, so it is a <dl>; the star is ornament. */}
                <dl>
                    <dd className="font-display text-[27px] lg:text-[40px] font-semibold tracking-wide text-[#B33A3A] mb-2">
                        {startCounter
                            ? (
                                <CountUp
                                    end={stat.number}
                                    duration={2.5}
                                    separator=","
                                    suffix={stat.id !== 4 ? "+" : ""}
                                />
                            )
                            : <span>{stat.number.toLocaleString('en-IN')}{stat.id !== 4 ? '+' : ''}</span>}
                        <span aria-hidden="true" className="text-[#FFD700] ml-2">★</span>
                    </dd>
                    <dt className="lg:text-desktopBodyMedium sm:text-mobileBodyMedium font-semibold text-secondary_on mb-2 text-nowrap">
                        {stat.title}
                    </dt>
                </dl>
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
                    <h2 className="font-display text-[27px] lg:text-[40px] font-semibold text-secondary_on mb-4">
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
