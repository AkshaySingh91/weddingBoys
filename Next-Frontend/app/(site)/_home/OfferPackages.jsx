'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiVideo, FiStar, FiCheckCircle, FiPackage, FiMessageCircle, FiPhone } from 'react-icons/fi';
import { FaInfoCircle, FaCreditCard, FaGlobe } from "react-icons/fa";
import { FiHeart, FiUsers, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import PackageModal from '@/Component/PackageModal.jsx';
import Section from '@/Component/ui/Section.jsx';
import { BUILT_IN_PACKAGES as packages } from '@/lib/builtInPackages.js';

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
    // A package with no discount shows its one price and no "Save".
    const save = pkg.total > pkg.offer ? Math.ceil(((pkg.total - pkg.offer) / pkg.total) * 100) : 0;
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
                    {save > 0 && (
                        <span className="text-[14px] text-ink-muted line-through">
                            ₹{Number(pkg.total).toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
                {/* Kept as an empty line without a discount, so the cards' rows stay level. */}
                <p className={`mt-2.5 w-fit rounded-pill px-2.5 py-1 text-[12px] font-semibold ${save > 0 ? 'bg-accent-tint text-accent-ink' : 'invisible'}`}>
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

/**
 * A package from Admin › Pricing (plan phase 7), in the shape the cards and the
 * modal read. `packages` (lib/builtInPackages.js) is the built-in fallback: shown until the
 * first package is created there (Backend/scripts/seedPricingPackages.js copies
 * it in), or when the section renders without the CMS.
 */
const fromPricing = (p) => ({
    id: p._id,
    title: p.name,
    tagline: p.tagline,
    total: p.originalPrice,
    offer: p.discountedPrice ?? p.originalPrice,
    team: p.team || [],
    includes: p.includes || [],
    description: p.description,
    isPopular: p.isFeatured,
    recommendedFor: p.recommendedFor,
});

const PackagesSection = ({ data }) => {
    const list = Array.isArray(data?.packages) ? data.packages.map(fromPricing) : packages;
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
                    {list.map((pkg) => (
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
                    <motion.a
                        href={`https://wa.me/${studioContact?.[0] || ''}?text=${encodeURIComponent(
                            "Hello! I'm interested in discussing a quote with you. Please get in touch."
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-pill
                                   bg-[#FF4D4D] px-8 py-3 text-[15px] font-semibold text-white"
                    >
                        <FiCalendar aria-hidden="true" className="h-5 w-5" />
                        Free Consultation
                    </motion.a>

                    <motion.a
                        href={`tel:${studioContact?.[1] || ''}`}
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-pill
                                   border-2 border-[#FF6969] bg-white px-8 py-3 text-[15px] font-semibold
                                   text-[#FF6969]"
                    >
                        <FiPhone aria-hidden="true" className="h-5 w-5" />
                        Instant Call Back
                    </motion.a>

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
        <Section width="wide" rhythm="tight" aria-labelledby="custom-package-heading">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            /* Was `-mx-4` on a bare motion.div: it sat off the page axis that
               every other band shares, and the negative margin pushed it wider
               than its own container. Band padding matches the others. */
            className="relative px-5 py-10 sm:px-7 lg:py-12 lg:rounded-3xl sm:rounded-lg text-center bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] overflow-hidden"
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

            <h2 id="custom-package-heading" className="t-display-2 mx-auto text-gray-900 relative z-10">
                Need a Custom Package?
                {/* Animated Underline */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    className="w-24 h-1 bg-[#FF6969] mx-auto mt-2 rounded-full"
                    style={{ originX: 0.5 }}
                />
            </h2>

            <p className="t-body-lead mt-4 mx-auto relative z-10 text-gray-600">
                We understand that every wedding is unique. Contact us to create a tailored photography and cinematography
                package that perfectly fits your specific requirements and budget.
            </p>

            <div className="mt-6 relative z-10">
                {/* Was a <button> calling window.open(url,'_blank') — the same
                    defect fixed in the services and Varanasi sections. A
                    destination is a link: middle-clickable, keyboard-openable,
                    and no window.opener handed to the new tab. */}
                <motion.a
                    href={`https://wa.me/${studioContact?.[0] || ''}?text=${encodeURIComponent(
                        "Hello! I'm interested in booking your studio for my event. "
                        + "Could you please share available dates and package details?"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex mx-auto min-h-[48px] justify-center items-center bg-[#FF4D4D] text-white font-semibold py-3 px-6 rounded-pill shadow-lg hover:bg-red-400 transition-all relative overflow-hidden"
                >
                    {/* Button Sparkle */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-4 -top-4 opacity-30"
                    >
                        <FiStar className="w-8 h-8 text-[#FFD700]" />
                    </motion.div>

                    <FiVideo aria-hidden="true" className="mr-2" />
                    Schedule Free Consultation
                </motion.a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-6 relative z-10">
                {features.map((feature) => (
                    <motion.div
                        key={feature.title}
                        className="bg-[#FDFAF6] p-6 rounded-lg lg:shadow-md hover:shadow-xl transition-all relative overflow-hidden group"
                        whileHover={{ y: -5 }}
                    >
                        {/* Feature Card Accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6969]/10 rounded-bl-full transform translate-x-1/3 -translate-y-1/3 rotate-45" />

                        <div className="flex items-center justify-center lg:mb-4 mx-auto bg-red-100 p-4 rounded-full w-fit group-hover:bg-[#FFD700]/20 transition-colors">
                            {feature.icon}
                        </div>
                        <h3 className="t-heading-3 mx-auto text-gray-900">
                            {feature.title}
                        </h3>
                        <p className="t-body-sm mx-auto mt-2 text-gray-600">
                            {feature.description}
                        </p>

                        {/* Hover Element */}
                        <div className="absolute inset-0 border-2 border-[#FF6969]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg m-1" />
                    </motion.div>
                ))}
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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
        </Section>
    )
}


export default PackagesSection;
