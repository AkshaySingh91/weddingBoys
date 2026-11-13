'use client';

import { useState } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { FiMessageCircle, FiPhone, FiSliders, FiCalendar, FiCreditCard, FiMapPin } from 'react-icons/fi';
import PackageModal from '@/Component/PackageModal.jsx';
import { PlanCard, PlanRail, firstPlan } from './PricingPlans.jsx';
import Chapter, { Em, CARD, CARD_TINT } from '@/Component/home/Chapter.jsx';
import { BUILT_IN_PACKAGES as packages } from '@/lib/builtInPackages.js';
import { STUDIO_PHONES, STUDIO_WHATSAPP } from '@/lib/siteConfig.js';

const FACTS = [
    { Icon: FiCalendar, title: 'Booking', body: '50% advance secures your date; the balance is due one week before the event.' },
    { Icon: FiCreditCard, title: 'Payments', body: 'Bank transfer, card or UPI — whichever is easiest for you.' },
    { Icon: FiMapPin, title: 'Travel', body: 'Anywhere in Mumbai at no extra cost. Destination weddings are quoted with travel.' },
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

    const whatsapp = `https://wa.me/${STUDIO_WHATSAPP}?text=${encodeURIComponent("Hello! I'd like to talk about a package for our wedding.")}`;
    const call = `tel:${STUDIO_PHONES[1]}`;

    return (<>
        <Chapter id="pricing" label="Packages" glow="left"
            title={<>Clear <Em>pricing</Em>, open to change</>}
            lead="Every package can be tailored to your events, guest count and budget.">
                {/* One entrance, once: the rail on a phone, the four cards left to right
                    from sm. Opacity + 16px rise on the wrappers only (never the
                    drop-shadowed surface). reducedMotion="user" keeps just the fade. */}
                <MotionConfig reducedMotion="user">
                    {list.length > 0 && (
                        <motion.div className="mt-8 sm:hidden" {...RISE}>
                            <PlanRail list={list} onOpen={setOpenPackage} active={active} onActiveChange={setActive} />
                        </motion.div>
                    )}

                    {/* Tablet and up: the price table — two across, four at lg. */}
                    <motion.div className="mt-12 hidden items-stretch gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
                        initial="hide" whileInView="show" viewport={IN_VIEW}
                        variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
                        {list.map((pkg) => (
                            <motion.div key={pkg.id ?? pkg.title} variants={RISE_VARIANTS} className="h-full">
                                <PlanCard pkg={pkg} onOpen={setOpenPackage} lift className="h-full" />
                            </motion.div>
                        ))}
                    </motion.div>
                </MotionConfig>

            {/* Make it yours — the custom-package and consultation blocks, merged. */}
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-[1.2fr_1fr] lg:gap-4">
                <div className={`flex flex-col p-6 sm:p-8 ${CARD_TINT}`}>
                    <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-ground-raised text-accent-ink shadow-sm">
                        <FiSliders className="h-5 w-5" />
                    </span>
                    <h3 className="mt-6 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
                        Need something <Em>different</Em>?
                    </h3>
                    <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-ink-secondary">
                        A free 30-minute call to shape a package around your celebration.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 md:mt-auto md:pt-6">
                        <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                            className="group inline-flex h-12 cursor-pointer items-center gap-3 rounded-full bg-accent pl-5 pr-1.5 text-[14.5px] font-semibold text-ink-onAccent
                                       transition-colors duration-micro ease-standard hover:bg-accent-hover focus-ring">
                            Book a free consultation
                            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><FiMessageCircle className="h-4 w-4" /></span>
                        </a>
                        {call && (
                            <a href={call} aria-label="Call the studio"
                                className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-ground-raised text-ink ring-1 ring-ink/[0.08] transition-colors hover:bg-ground focus-ring">
                                <FiPhone aria-hidden="true" className="h-[18px] w-[18px]" />
                            </a>
                        )}
                    </div>
                </div>
                <ul className="grid gap-3">
                    {FACTS.map((f) => (
                        <li key={f.title} className={`flex items-start gap-4 p-4 sm:p-5 ${CARD}`}>
                            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-wash text-accent-ink"><f.Icon className="h-5 w-5" /></span>
                            <span>
                                <span className="block text-[15px] font-semibold text-ink">{f.title}</span>
                                <span className="mt-0.5 block text-[14px] leading-snug text-ink-muted">{f.body}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </Chapter>

        {openPackage && (
            <PackageModal
                pkg={openPackage}
                whatsappHref={`https://wa.me/${STUDIO_WHATSAPP}?text=${createWhatsAppMessage(openPackage)}`}
                callHref={`tel:${STUDIO_PHONES[1]}`}
                onClose={() => setOpenPackage(null)}
            />
        )}
    </>);
};

export default PackagesSection;
