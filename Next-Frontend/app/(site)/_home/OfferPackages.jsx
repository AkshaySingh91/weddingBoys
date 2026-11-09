'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { FiVideo, FiStar, FiPhone } from 'react-icons/fi';
import { FaInfoCircle, FaCreditCard, FaGlobe } from "react-icons/fa";
import { FiHeart, FiCalendar } from 'react-icons/fi';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import PackageModal from '@/Component/PackageModal.jsx';
import { PlanCard, PlanRail, PlanDashes, firstPlan } from './PricingPlans.jsx';
import Section from '@/Component/ui/Section.jsx';
import { BUILT_IN_PACKAGES as packages } from '@/lib/builtInPackages.js';

const features = [
    {
        icon: <FaInfoCircle className="text-accent-ink text-3xl" />,
        title: "Booking Information",
        description: "50% advance payment required to secure your date, with the balance due one week before the event."
    },
    {
        icon: <FaCreditCard className="text-accent-ink text-3xl" />,
        title: "Payment Options",
        description: "We accept bank transfers, credit cards, and UPI payments for your convenience."
    },
    {
        icon: <FaGlobe className="text-accent-ink text-3xl" />,
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

const EASE_ENTRANCE = [0.16, 1, 0.3, 1];
const IN_VIEW = { once: true, margin: '0px 0px -80px 0px' };
const RISE_VARIANTS = {
    hide: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: EASE_ENTRANCE } },
};
const RISE = { initial: 'hide', whileInView: 'show', viewport: IN_VIEW, variants: RISE_VARIANTS };

const PackagesSection = ({ data }) => {
    const list = Array.isArray(data?.packages) ? data.packages.map(fromPricing) : packages;
    const [openPackage, setOpenPackage] = useState(null);
    const [active, setActive] = useState(() => firstPlan(list));
    const { studioContact } = useStudioDetails();

    return (<>
        <Section width="wide" rhythm="tight" id="pricing" aria-labelledby="pricing-heading">
            {/* Full-bleed on a phone so the cards get the width; a rounded panel from sm. */}
            <div className="-mx-5 rounded-[28px] px-5 pb-4 pt-9 ring-1 ring-ink/[0.05] sm:mx-0 sm:rounded-[36px] sm:px-8 sm:pb-10 sm:pt-12 lg:px-10
                            bg-[linear-gradient(165deg,rgb(var(--ground-raised-rgb))_0%,rgb(var(--ground-rgb))_45%,rgb(var(--gold-rgb)/0.22)_100%)]">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-ink">Packages</p>
                        <h2 id="pricing-heading" className="mt-2 font-display text-[40px] font-medium leading-none tracking-[-0.01em] text-ink sm:text-[52px]">
                            Pricing
                        </h2>
                    </div>
                    <span className="mb-2 sm:hidden"><PlanDashes count={list.length} active={active} /></span>
                    <p className="hidden max-w-sm text-right text-[14px] leading-relaxed text-ink-secondary sm:block">
                        Every package can be tailored — tell us what your celebration needs.
                    </p>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-secondary sm:hidden">
                    Every package can be tailored — tell us what your celebration needs.
                </p>

                {/* One entrance, once: the rail on a phone, the four cards left to right
                    from sm. Opacity + 16px rise on the wrappers only (never the
                    drop-shadowed surface). reducedMotion="user" keeps just the fade. */}
                <MotionConfig reducedMotion="user">
                    {list.length > 0 && (
                        <motion.div className="mt-7 sm:hidden" {...RISE}>
                            <PlanRail list={list} onOpen={setOpenPackage} active={active} onActiveChange={setActive} />
                        </motion.div>
                    )}

                    {/* Tablet and up: the price table — two across, four at lg. */}
                    <motion.div className="mt-10 hidden items-stretch gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
                        initial="hide" whileInView="show" viewport={IN_VIEW}
                        variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
                        {list.map((pkg) => (
                            <motion.div key={pkg.id ?? pkg.title} variants={RISE_VARIANTS} className="h-full">
                                <PlanCard pkg={pkg} onOpen={setOpenPackage} lift className="h-full" />
                            </motion.div>
                        ))}
                    </motion.div>
                </MotionConfig>
            </div>
        </Section>

        {openPackage && (
            <PackageModal
                pkg={openPackage}
                whatsappHref={`https://wa.me/${studioContact?.[0] || ''}?text=${createWhatsAppMessage(openPackage)}`}
                callHref={studioContact?.[1] ? `tel:${studioContact[1]}` : null}
                onClose={() => setOpenPackage(null)}
            />
        )}

        <ComparativeCTA studioContact={studioContact} />
        {/* Consultation CTA */}
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="my-10 bg-gradient-to-b from-ground-sunk to-ground rounded-2xl p-8  border border-gray-100"
        >
            <div className="text-center max-w-3xl mx-auto">
                <div className="mb-6">
                    <FiHeart className="text-accent-ink w-12 h-12 mx-auto mb-4" />
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
                                   bg-accent px-8 py-3 text-[15px] font-semibold text-white"
                    >
                        <FiCalendar aria-hidden="true" className="h-5 w-5" />
                        Free Consultation
                    </motion.a>

                    <motion.a
                        href={`tel:${studioContact?.[1] || ''}`}
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-pill
                                   border-2 border-accent bg-white px-8 py-3 text-[15px] font-semibold
                                   text-accent-ink"
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
            className="relative px-5 py-10 sm:px-7 lg:py-12 lg:rounded-3xl sm:rounded-lg text-center bg-gradient-to-b from-ground-sunk to-ground overflow-hidden"
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full -translate-y-1/3">
                <svg viewBox="0 0 1440 320" className="w-full">
                    <path
                        fill="var(--accent)"
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
                    <path fill="var(--gold)" d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2zm0 18c-3 0-6-3-6-6s3-6 6-6 6 3 6 6-3 6-6 6z" />
                    <path fill="var(--accent)" d="M12 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
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
                        stroke="var(--gold)"
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
                    className="w-24 h-1 bg-accent mx-auto mt-2 rounded-full"
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
                    className="inline-flex mx-auto min-h-[48px] justify-center items-center bg-accent text-white font-semibold py-3 px-6 rounded-pill shadow-lg hover:bg-accent-hover transition-all relative overflow-hidden"
                >
                    {/* Button Sparkle */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-4 -top-4 opacity-30"
                    >
                        <FiStar className="w-8 h-8 text-gold" />
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
                        <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 rounded-bl-full transform translate-x-1/3 -translate-y-1/3 rotate-45" />

                        <div className="flex items-center justify-center lg:mb-4 mx-auto bg-accent-wash p-4 rounded-full w-fit group-hover:bg-gold/20 transition-colors">
                            {feature.icon}
                        </div>
                        <h3 className="t-heading-3 mx-auto text-gray-900">
                            {feature.title}
                        </h3>
                        <p className="t-body-sm mx-auto mt-2 text-gray-600">
                            {feature.description}
                        </p>

                        {/* Hover Element */}
                        <div className="absolute inset-0 border-2 border-accent/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg m-1" />
                    </motion.div>
                ))}
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {particles?.map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-accent/20"
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
