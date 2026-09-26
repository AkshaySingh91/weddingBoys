'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import CountUp from 'react-countup';
import { FiCamera, FiAward, FiHeart, FiClock, FiStar } from 'react-icons/fi';
import Section from '@/Component/ui/Section.jsx';

/**
 * The studio's track record: the CMS `stats` block (Admin › Content › Home).
 *
 * This was `TrackRecord`, hardcoded inside "Our packages", while the CMS block
 * drew the same four figures again, off-design, at the foot of the page. The
 * figures render once now, from the block, in this design (plan phase 7).
 *
 * `items`: { title: '1000+', subtitle: 'Weddings Captured', body?: 'Magical moments preserved' }.
 * A value that starts with a number counts up to it; anything else shows as written.
 */
const DEFAULT_ITEMS = [
    { title: '1000+', subtitle: 'Weddings Captured', body: 'Magical moments preserved' },
    { title: '25+', subtitle: 'Awards Won', body: 'Industry recognition' },
    { title: '1500+', subtitle: 'Happy Clients', body: 'Satisfied families' },
    { title: '5+', subtitle: 'Years Experience', body: 'In the industry' },
];
const DEFAULT_TITLE = 'Crafting Timeless Memories Since 2020';
const DEFAULT_LEAD = 'Trusted by generations, our lens has witnessed countless stories of love, tradition, and celebration.';

const ICON_CLASS = 'lg:text-3xl sm:text-2xl';
const iconFor = (label = '') => {
    const l = label.toLowerCase();
    if (/wedding|shoot|film|photo/.test(l)) return <FiCamera className={ICON_CLASS} />;
    if (/award|recogni/.test(l)) return <FiAward className={ICON_CLASS} />;
    if (/client|couple|famil|happy/.test(l)) return <FiHeart className={ICON_CLASS} />;
    if (/year|experience/.test(l)) return <FiClock className={ICON_CLASS} />;
    return <FiStar className={ICON_CLASS} />;
};

/** "1000+" → { number: 1000, prefix: '', suffix: '+' }; null when it is not a figure. */
function parseFigure(value = '') {
    const m = String(value).trim().match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return null;
    const number = Number(m[2].replace(/,/g, ''));
    return Number.isFinite(number) ? { prefix: m[1], number, suffix: m[3] } : null;
}

export default function StatsBand({ title, subtitle, items }) {
    const stats = (items?.length ? items : DEFAULT_ITEMS).filter((it) => it?.title || it?.subtitle);
    if (!stats.length) return null;
    const heading = title || DEFAULT_TITLE;
    const lead = title ? subtitle : DEFAULT_LEAD;

    return (
        <Section width="wide" rhythm="tight" aria-labelledby="legacy-heading">
        <div className="lg:rounded-3xl sm:rounded-lg bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden">
            {/* Was `-mx-4` on a bare <section> whose inner container was
                max-w-6xl: it measured 1455px against a 1425px viewport and its
                content started at x=152 while every other band starts at 40. */}
            <div className="px-5 py-10 sm:px-7 lg:py-12">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                    className="text-center lg:mb-12 sm:mb-8"
                >
                    <p className="inline-block bg-[#FF4D4D] text-[#FFF0E6] px-5 py-1.5 rounded-pill text-[13px] font-semibold mb-5 shadow-lg">
                        <span className="drop-shadow-md">Our Legacy in Numbers</span>
                    </p>
                    <h2 id="legacy-heading" className="t-display-2 mx-auto mb-4 text-secondary_on">
                        {heading}
                    </h2>
                    {lead && (
                        <p className="t-body-lead mx-auto text-[#74583E]">
                            {lead}
                        </p>
                    )}
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                    {stats.map((stat, i) => (
                        <StatItem key={stat._id || i} stat={stat} />
                    ))}
                </div>

                {/* Authenticity Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="t-caption mx-auto mt-10 text-center text-[#74583E]"
                >
                    *Verified through client records & vendor partnerships
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-[#f6c2b9c9] rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#FF4D4D]/10 rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
        </div>
        </Section>
    );
}

function StatItem({ stat }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
    const [startCounter, setStartCounter] = useState(false);
    const figure = parseFigure(stat.title);
    const icon = iconFor(stat.subtitle);

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
                    {icon}
                </div>
                {/* Was an <h3> holding the number, with the label in a <p>
                    beneath — inverted, and until the counter fired the heading's
                    entire text content was a star glyph. A stat is a term and a
                    value, so it is a <dl>; the star is ornament. */}
                <dl>
                    <dd className="font-display text-[27px] lg:text-[40px] font-semibold tracking-wide text-[#B33A3A] mb-2">
                        {figure && startCounter
                            ? <CountUp end={figure.number} duration={2.5} separator="," prefix={figure.prefix} suffix={figure.suffix} />
                            : <span>{figure ? `${figure.prefix}${figure.number.toLocaleString('en-IN')}${figure.suffix}` : stat.title}</span>}
                        <span aria-hidden="true" className="text-[#FFD700] ml-2">★</span>
                    </dd>
                    <dt className="t-heading-3 mx-auto mb-1 text-secondary_on">
                        {stat.subtitle}
                    </dt>
                </dl>
                {stat.body && (
                    <p className="t-body-sm mx-auto text-[#74583E]">
                        {stat.body}
                    </p>
                )}
            </div>

            {/* Animated Border */}
            <div className="absolute inset-0 border-2 border-[#FFD700] opacity-0 group-hover:opacity-30 transition-opacity rounded-2xl" />
        </motion.div>
    );
}
