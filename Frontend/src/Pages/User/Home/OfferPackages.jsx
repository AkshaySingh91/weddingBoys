import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FiCamera, FiVideo, FiGift, FiStar, FiCheck, FiX } from 'react-icons/fi';
import { useStudioDetails } from '../../../Context/StudioDetailsContext';

const packages = [
    {
        id: 1,
        title: "Enchanted Pre-Wedding",
        tagline: "Perfect for couples wanting storybook memories",
        total: "₹50,000/-",
        offer: "₹40,000/-",
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
        total: "₹1,00,000/-",
        offer: "₹85,000/-",
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
        total: "₹1,50,000/-",
        offer: "₹1,30,000/-",
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
        total: "₹2,40,000/-",
        offer: "₹2,10,000/-",
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

const PackageCard = ({ pkg, isExpanded, onToggle, studioContact }) => {
    // Function to create the WhatsApp message text
    const createWhatsAppMessage = () => {
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

    return (
        <motion.div
            className="bg-primary rounded-3xl sm:px-6 p-8  sm:-mx-4 lg:mx-0 shadow-2xl relative overflow-hidden mb-8 border-2 border-primary_on/10 hover:border-secondary_on transition-all"
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/30 to-transparent" />

            {/* Popular Ribbon */}
            {pkg.isPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-secondary to-secondary_on text-primary px-6 py-2 rounded-b-lg shadow-lg flex items-center gap-2">
                    <FiStar className="animate-pulse" />
                    <span className="text-mobileBodySmall font-bold">BEST VALUE</span>
                </div>
            )}

            <div className="relative z-10">
                {/* Package Header */}
                <div className="flex flex-col gap-2 mb-6">
                    <h3 className="sm:text-mobileHeadlineMedium lg:text-desktopHeadlineSmall font-bold text-secondary_on text-center">
                        {pkg.title}
                    </h3>
                    <p className="text-mobileBodyMedium text-tertiary_on text-center italic">
                        {pkg.recommendedFor}
                    </p>

                    <div className="flex flex-col items-center gap-2">
                        <span className="sm:text-mobileHeadlineSmall lg:text-desktopBodyLarge line-through text-tertiary">
                            {pkg.total}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="sm:text-mobileHeadlineMedium lg:text-desktopHeadlineSmall font-bold text-tertiary_on">
                                {pkg.offer}
                            </span>
                            <span className="text-mobileBodySmall bg-secondary_on/20 text-secondary_on px-3 py-1 rounded-full">
                                Save 20%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Always Visible Highlights */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 p-3 bg-secondary_on/5 rounded-lg sm:w-fit w-auto mx-auto">
                        <FiCamera className="text-secondary_on shrink-0" />
                        <span className="text-mobileBodySmall text-tertiary_on text-nowrap">Candid Shots</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-secondary_on/5 rounded-lg sm:w-fit w-auto mx-auto">
                        <FiVideo className="text-secondary_on shrink-0" />
                        <span className="text-mobileBodySmall text-tertiary_on text-nowrap">Cinematic Video</span>
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6 border-t border-primary_on/10 pt-6 mb-4"
                        >
                            {/* Team Section */}
                            <div>
                                <h4 className="text-mobileBodyMedium font-bold text-secondary_on mb-4 flex items-center gap-2">
                                    <FiCamera className="text-secondary_on" />
                                    Professional Team
                                </h4>
                                <div className="grid lg:gap-3 sm:gap-1">
                                    {pkg.team.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-primary_on/5 rounded-lg">
                                            <FiCheck className="text-secondary_on shrink-0" />
                                            <span className="lg:text-desktopBodySmall sm:text-mobileBodyMedium text-tertiary_on">
                                                {member}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inclusions Section */}
                            <div>
                                <h4 className="text-mobileBodyMedium font-bold text-secondary_on mb-4 flex items-center gap-2">
                                    <FiGift className="text-secondary_on" />
                                    Package Inclusions
                                </h4>
                                <div className="grid lg:gap-3 sm:gap-2">
                                    {pkg.includes.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${item.included ? 'bg-secondary_on/5' : 'bg-tertiary_on/5 opacity-50'
                                                }`}
                                        >
                                            {item.included ? (
                                                <FiCheck className="text-secondary_on shrink-0" />
                                            ) : (
                                                <FiX className="text-tertiary_on shrink-0" />
                                            )}
                                            <span className={`lg:text-desktopBodySmall sm:text-mobileBodyMedium ${item.included ? 'text-tertiary_on' : 'text-tertiary_on line-through'
                                                }`}>
                                                {item.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Button inside expanded details */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    // Redirect to WhatsApp with the package details in the message
                                    const message = createWhatsAppMessage();
                                    window.open(`https://wa.me/${studioContact?.[0] || ''}?text=${message}`, '_blank');
                                }}
                                className="w-full my-3 bg-gradient-to-r from-secondary to-secondary_on text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                            >
                                <FiCamera className="text-primary" />
                                <span>Start Customization</span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Expand Button */}
            <motion.button
                onClick={() => onToggle(pkg.id)}
                className="relative z-10 mx-auto bg-secondary_on/10 shadow-lg rounded-lg px-3 py-1 w-fit flex text-desktopBodySmall items-center justify-center gap-2 text-secondary_on hover:text-tertiary_on mb-3"
            >
                <span className="text-mobileBodyLarge font-medium">
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                </span>
            </motion.button>
        </motion.div>
    );
};

const PackagesSection = () => {
    const [expandedPackageId, setExpandedPackageId] = useState(null);
    const { studioContact } = useStudioDetails();

    const togglePackage = (id) => {
        setExpandedPackageId(prev => (prev === id ? null : id));
    };

    return (
        <section className="py-20 px-8 bg-primary">
            <div className="max-w-6xl mx-auto">
                <h2 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineSmall text-secondary_on text-center mb-16">
                    Tailored Experiences, Unforgettable Memories
                </h2>

                <div className="grid lg:grid-cols-2 gap-8">
                    {packages.map((pkg) => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            isExpanded={expandedPackageId === pkg.id}
                            onToggle={togglePackage}
                            studioContact={studioContact}
                        />
                    ))}
                </div>

                {/* Comparative CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="bg-secondary_on/10 p-8 rounded-3xl mt-16 text-center"
                >
                    <h3 className="text-desktopBodyLarge text-secondary_on mb-4">
                        Not Sure Which Package to Choose?
                    </h3>
                    <p className="text-mobileBodyMedium text-tertiary_on mb-8">
                        Let our wedding experts guide you to the perfect choice for your dream celebration.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="bg-tertiary_on/90 text-nowrap text-white lg:px-8 lg:py-4 sm:px-4 sm:py-2 rounded-full flex items-center gap-3 mx-auto"
                        onClick={() => {
                            window.open(`https://wa.me/${studioContact?.[0] || ''}`, '_blank');
                        }}
                    >
                        <FiVideo />
                        Schedule Free Consultation
                    </motion.button>
                </motion.div>
            </div>
        </section >
    );
};

export default PackagesSection;
