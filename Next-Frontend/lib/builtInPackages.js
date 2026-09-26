/**
 * The four packages the home "Our packages" section has always shown. Since
 * plan phase 7 the section reads Admin › Pricing; this list is what it shows
 * until the first package is created there, and what Pricing's "Copy the
 * site's packages" (and Backend/scripts/seedPricingPackages.js) copies in.
 */
export const BUILT_IN_PACKAGES = [
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
