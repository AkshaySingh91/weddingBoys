/**
 * weddingLocations.js — Destination wedding metadata, iconic venues,
 * cinematography guides, and localized AEO context for Indian wedding hubs.
 */
import { indianLocations } from '@/Utils/Data.js';

export const FEATURED_DESTINATIONS = {
    udaipur: {
        slug: 'udaipur',
        name: 'Udaipur',
        state: 'Rajasthan',
        title: 'Destination Wedding Cinematography in Udaipur',
        tagline: 'The City of Lakes & Royal Palace Celebrations',
        heroSubtitle:
            'Where heritage marble reflects upon shimmering waters — bespoke wedding cinematography amidst timeless Rajputana majesty.',
        metaDescription:
            'Bespoke destination wedding films and photography in Udaipur. Explore iconic lake palaces, seasonal cinematography advice, and real royal weddings by The Wedding Boys.',
        coordinates: { latitude: '24.5854', longitude: '73.7125' },
        bestSeason: 'October to March (Crisp skies, golden lakeside sunsets)',
        filmingHighlights: [
            'Lake Pichola boat processions and island palace grand entries',
            'Warm Rajputana architectural tones that glow during dusk golden hour',
            'Courtyard night pheras lit with hundreds of traditional brass diyas',
        ],
        venues: [
            {
                name: 'Jagmandir Island Palace',
                type: 'Island Heritage Palace',
                desc: 'An iconic 17th-century marble palace surrounded by the tranquil waters of Lake Pichola.',
            },
            {
                name: 'The Leela Palace Udaipur',
                type: 'Modern Luxury Palace',
                desc: 'Opulent lakeside pavilions offering breathtaking panoramic views of the City Palace.',
            },
            {
                name: 'The Oberoi Udaivilas',
                type: 'Royal Sanctuary',
                desc: 'Domes, interconnecting reflecting pools, and manicured courtyards celebrating Mewar architecture.',
            },
            {
                name: 'Taj Lake Palace',
                type: 'Heritage Island Wonder',
                desc: 'Floating white marble palace built in 1746, epitomizing ethereal romance.',
            },
            {
                name: 'Raffles Udaipur',
                type: 'Private Island Retreat',
                desc: 'Nestled on Udai Sagar Lake, blending classic European romance with Rajasthani hospitality.',
            },
        ],
        faqs: [
            {
                question: 'What is the best season to host a destination wedding in Udaipur?',
                answer:
                    'October through March offers the most pleasant temperatures with clear blue skies and mild evenings, making it optimal for outdoor lakeside ceremonies and natural-light cinematography.',
            },
            {
                question: 'Are drone permits required for wedding filming in Udaipur?',
                answer:
                    'Yes, Udaipur heritage zones around Lake Pichola require local administrative and venue clearance for aerial drone operations. The Wedding Boys handles all regulatory logistics in advance.',
            },
            {
                question: 'How far in advance should we book The Wedding Boys for an Udaipur wedding?',
                answer:
                    'Due to high demand during peak Rajasthan wedding season (November to February), we recommend reserving your dates 6 to 12 months in advance.',
            },
        ],
    },

    jaipur: {
        slug: 'jaipur',
        name: 'Jaipur',
        state: 'Rajasthan',
        title: 'Luxury Wedding Cinematography in Jaipur',
        tagline: 'The Pink City of Fortresses & Grand Royal Splendor',
        heroSubtitle:
            'From majestic ramparts of Amber to opulent durbar halls — cinematic wedding narratives celebrating heritage and grandeur.',
        metaDescription:
            'Capturing royal destination weddings in Jaipur. Explore heritage palace venues, cinematography guides, and wedding films filmed by The Wedding Boys.',
        coordinates: { latitude: '26.9124', longitude: '75.7873' },
        bestSeason: 'November to February (Cool winter breezes, clear regal sunlight)',
        filmingHighlights: [
            'Elephants, vintage car royal baraats, and regal fort ramparts',
            'Intricate sandstone jalis creating dramatic cinematic shadow play',
            'Rich jewel-toned night celebrations under starlit haveli courtyards',
        ],
        venues: [
            {
                name: 'Rambagh Palace',
                type: 'Former Royal Residence',
                desc: 'The Jewel of Jaipur, featuring 47 acres of tranquil gardens and historic palace suites.',
            },
            {
                name: 'Jai Mahal Palace',
                type: 'Indo-Saracenic Heritage',
                desc: 'Set amidst 18 acres of landscaped Mughal gardens dating back to 1745.',
            },
            {
                name: 'City Palace Jaipur',
                type: 'Living Royal Residence',
                desc: 'Iconic Pritam Niwas Chowk peacock courtyards and heritage reception halls.',
            },
            {
                name: 'Fairmont Jaipur',
                type: 'Palatial Luxury Resort',
                desc: 'Nestled in the Aravalli hills, honoring the traditions of the Great Mughals and Rajputs.',
            },
            {
                name: 'Samode Palace',
                type: 'Historic Haveli',
                desc: 'A 475-year-old palace famed for its mirror-tiled Sheesh Mahal and painted frescoes.',
            },
        ],
        faqs: [
            {
                question: 'What makes Jaipur such a favored destination for royal weddings?',
                answer:
                    'Jaipur provides an unmatched blend of living royal heritage, seamless flight connectivity, and world-class luxury palace hotels that accommodate large destination guest contingents.',
            },
            {
                question: 'How does The Wedding Boys capture the grand scale of Jaipur palace weddings?',
                answer:
                    'We deploy multi-cam cinema rigs, gimbal tracking systems for high-energy royal baraats, and precision golden-hour portrait sessions framed against Jaipur sandstone architecture.',
            },
        ],
    },

    goa: {
        slug: 'goa',
        name: 'Goa',
        state: 'Goa',
        title: 'Coastal Destination Wedding Cinematography in Goa',
        tagline: 'Sunkissed Shores, Portuguese Villas & Coastal Reverie',
        heroSubtitle:
            'Barefoot beachfront pheras, sunset sea breezes, and vibrant sundowners documented with fine-art cinematic nuance.',
        metaDescription:
            'Fine art beach wedding cinematography in Goa. Sunset ceremonies, Portuguese heritage havelis, and luxury coastal wedding films by The Wedding Boys.',
        coordinates: { latitude: '15.2993', longitude: '74.1240' },
        bestSeason: 'November to April (Balmy coastal evenings, vibrant sunset light)',
        filmingHighlights: [
            'Golden-hour beachfront vows framed against crashing Arabian Sea waves',
            'Atmospheric twilight cocktail parties illuminated by fairy-lit palm groves',
            'Portuguese colonial churches and colorful Latin Quarter pre-wedding sessions',
        ],
        venues: [
            {
                name: 'Taj Exotica Resort & Spa',
                type: 'Mediterranean Beachfront Oasis',
                desc: 'Spread over 56 lush acres along Benaulim beach in South Goa.',
            },
            {
                name: 'The St. Regis Goa Resort',
                type: 'Ultra-Luxury Coastal Sanctuary',
                desc: 'Set between the Sal River and the Arabian Sea with pristine private lagoons.',
            },
            {
                name: 'Alila Diwa Goa',
                type: 'Contemporary Tropical Resort',
                desc: 'Overlooking lush paddy fields with serene infinity pool sunset views.',
            },
            {
                name: 'W Goa',
                type: 'Vibrant Coastal Haven',
                desc: 'Perched on the red cliffs of Vagator beach, ideal for high-energy sundowners.',
            },
        ],
        faqs: [
            {
                question: 'What is the sound and acoustic approach for beach vows in Goa?',
                answer:
                    'Beach weddings encounter ocean breeze. We utilize wireless wind-shielded lavalier microphones concealed on the couple and officiant to ensure crisp, studio-grade audio vows without wind rumble.',
            },
            {
                question: 'When should sunset ceremonies be timed for optimal lighting in Goa?',
                answer:
                    'We advise scheduling the ceremony 45 to 60 minutes prior to sunset (typically 5:45 PM in Goa winters) so the pheras coincide with the richest golden sky and twilight transition.',
            },
        ],
    },

    jodhpur: {
        slug: 'jodhpur',
        name: 'Jodhpur',
        state: 'Rajasthan',
        title: 'Imperial Wedding Cinematography in Jodhpur',
        tagline: 'The Sun City & The Fortress of the Blue Kingdom',
        heroSubtitle:
            'Towering sandstones of Mehrangarh and Art Deco majesty of Umaid Bhawan — epic love stories set against the Thar horizon.',
        metaDescription:
            'Imperial destination wedding cinematography in Jodhpur. Umaid Bhawan Palace, Mehrangarh fort celebrations, and cinematic wedding films by The Wedding Boys.',
        coordinates: { latitude: '26.2389', longitude: '73.0243' },
        bestSeason: 'October to March (Warm sunny days, dramatic desert evenings)',
        filmingHighlights: [
            'Dramatic Mehrangarh Fort illumination backdrops for grand sangeets',
            'Umaid Bhawan golden Chittar sandstone and majestic dome architecture',
            'Desert sunset couple portraits amidst dunes and Thar light',
        ],
        venues: [
            {
                name: 'Umaid Bhawan Palace',
                type: 'Art Deco Royal Wonder',
                desc: 'One of the world’s largest private royal residences, home to the Maharaja of Jodhpur.',
            },
            {
                name: 'Mehrangarh Fort',
                type: '15th-Century Imperial Citadel',
                desc: 'Perched 400 feet above the skyline, offering majestic courtyards for banquets.',
            },
            {
                name: 'Indana Palace Jodhpur',
                type: 'Palatial Heritage Architecture',
                desc: 'Echoing the stone carving and courtyards of the Marwar kingdom.',
            },
        ],
        faqs: [
            {
                question: 'What makes Jodhpur weddings visually unique?',
                answer:
                    'The immense scale of Marwar sandstone, the contrast of the blue city alleys, and the monumental silhouette of Mehrangarh Fort provide an unmatched imperial scale for cinema.',
            },
        ],
    },

    varanasi: {
        slug: 'varanasi',
        name: 'Varanasi',
        state: 'Uttar Pradesh',
        title: 'Spiritual Heritage Wedding Cinematography in Varanasi',
        tagline: 'The Eternal City of Ghats, Sacred Mantras & River Light',
        heroSubtitle:
            'Holy Ganga river dawn portraits, evening maha aarti blessings, and profound Vedic wedding rituals captured with reverent artistic vision.',
        metaDescription:
            'Soulful wedding cinematography in Varanasi. Sacred Ganga ghats, heritage havelis, and Vedic wedding rituals filmed by The Wedding Boys.',
        coordinates: { latitude: '25.3176', longitude: '82.9739' },
        bestSeason: 'October to March (Gentle morning river mists, evening temple warmth)',
        filmingHighlights: [
            'Sunrise boat journeys along historical ghats with morning temple reflections',
            'Evening Ganga Maha Aarti with thousands of illuminated brass lamps',
            'Ancient haveli courtyards infused with traditional shehnai and Vedic hymns',
        ],
        venues: [
            {
                name: 'BrijRama Palace',
                type: '18th-Century Ghat Palace',
                desc: 'Directly situated on Darbhanga Ghat, reachable exclusively by river boat.',
            },
            {
                name: 'Taj Nadesar Palace',
                type: 'Royal Sanctuary & Mango Orchards',
                desc: 'Historic palace set amidst quiet fields that once hosted royalty and dignitaries.',
            },
            {
                name: 'Taj Ganges Varanasi',
                type: 'Contemporary Luxury Oasis',
                desc: 'Modern luxury nestled in 40 acres of lush gardens in the ancient cultural capital.',
            },
        ],
        faqs: [
            {
                question: 'How do you film weddings reverently on Varanasi ghats?',
                answer:
                    'We practice mindful, non-intrusive cinematography that honors both sacred Vedic traditions and the spiritual pulse of the city while securing all river permits.',
            },
        ],
    },

    mumbai: {
        slug: 'mumbai',
        name: 'Mumbai',
        state: 'Maharashtra',
        title: 'Cosmopolitan Luxury Wedding Cinematography in Mumbai',
        tagline: 'High-Society Elegance, Sea Fronts & Glamorous Soirées',
        heroSubtitle:
            'Art Deco sea promenades, iconic ballroom galas, and sophisticated contemporary Indian celebrations filmed with cinematic panache.',
        metaDescription:
            'Sophisticated luxury wedding photography and films in Mumbai. Heritage seafront landmarks, ballroom galas, and fine-art celebrations by The Wedding Boys.',
        coordinates: { latitude: '18.9220', longitude: '72.8347' },
        bestSeason: 'November to February (Pleasant coastal winter)',
        filmingHighlights: [
            'The Taj Mahal Palace Colaba overlooking the Gateway of India',
            'Marine Drive twilight couple sessions with the Queen’s Necklace lights',
            'High-production sangeet stages with concert lighting and live sound recording',
        ],
        venues: [
            {
                name: 'The Taj Mahal Palace & Tower, Colaba',
                type: 'Iconic Grand Heritage',
                desc: 'Over a century of legendary hospitality overlooking the Arabian Sea.',
            },
            {
                name: 'The St. Regis Mumbai',
                type: 'Elevated High-Rise Luxury',
                desc: 'Soaring city views, luxurious ballrooms, and refined urban wedding suites.',
            },
            {
                name: 'Jio World Convention Centre',
                type: 'Monumental Event Space',
                desc: 'State-of-the-art infrastructure hosting grand-scale celebrity weddings.',
            },
        ],
        faqs: [
            {
                question: 'Can you film pre-wedding stories in Mumbai heritage quarters?',
                answer:
                    'Yes, we frequently shoot pre-wedding portraits across Ballard Estate, Fort Art Deco zones, and South Mumbai promenades at early dawn.',
            },
        ],
    },

    kerala: {
        slug: 'kerala',
        name: 'Kerala',
        state: 'Kerala',
        title: 'Backwater & Coastal Wedding Cinematography in Kerala',
        tagline: 'God’s Own Country: Palm Groves, Backwaters & Trad Romance',
        heroSubtitle:
            'Serene houseboat cruises, coconut palm canopies, and traditional Kasavu temple nuptials captured with poetic tropical warmth.',
        metaDescription:
            'Intimate backwater and coastal wedding films in Kerala. Kumarakom, Kochi, and Kovalam wedding cinematography by The Wedding Boys.',
        coordinates: { latitude: '9.9312', longitude: '76.2673' },
        bestSeason: 'September to March (Lush green landscapes, gentle tropical breezes)',
        filmingHighlights: [
            'Houseboat cruise processions along Vembanad Lake',
            'Traditional Chenda Melam drum processions and brass lamps',
            'Sunset over backwater lagoons and heritage spice estates',
        ],
        venues: [
            {
                name: 'Kumarakom Lake Resort',
                type: 'Heritage Backwater Sanctuary',
                desc: 'Traditional Kerala illams with private plunge pools beside Vembanad Lake.',
            },
            {
                name: 'Grand Hyatt Kochi Bolgatty',
                type: 'Island Waterfront Destination',
                desc: 'Set on Bolgatty Island with sprawling lawns overlooking backwaters.',
            },
            {
                name: 'The Leela Kovalam',
                type: 'Cliffside Oceanfront Resort',
                desc: 'Perched on a rock face overlooking Kovalam shoreline.',
            },
        ],
        faqs: [
            {
                question: 'How do backwater weddings work for wedding cinematography?',
                answer:
                    'Backwaters offer gentle natural motion, soft diffused morning light, and acoustic serenity that allows vows and vows exchanges to resonate naturally on film.',
            },
        ],
    },
};

/**
 * Normalizes city name/slug to match destination hub or fallback
 */
export function getLocationBySlug(rawSlug = '') {
    const slug = String(rawSlug).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    // /weddings/story/<couple> is a wedding's story page, never a city.
    if (slug === 'story') return null;

    if (FEATURED_DESTINATIONS[slug]) {
        return FEATURED_DESTINATIONS[slug];
    }

    // Dynamic match against indianLocations dataset
    const found = indianLocations.find(
        (loc) => loc.city.toLowerCase().replace(/[^a-z0-9]/g, '') === slug
    );

    if (found) {
        return {
            slug,
            name: found.city,
            state: found.state,
            title: `Wedding Cinematography in ${found.city}`,
            tagline: `Cinematic Wedding Films & Photography in ${found.city}, ${found.state}`,
            heroSubtitle: `Capturing authentic celebrations, heritage traditions, and modern romance across ${found.city}.`,
            metaDescription: `Bespoke wedding cinematography and photography in ${found.city}, ${found.state} by The Wedding Boys. Timeless storytelling and high-definition wedding films.`,
            coordinates: { latitude: '20.5937', longitude: '78.9629' },
            bestSeason: 'October to March',
            filmingHighlights: [
                `Authentic cultural ceremonies and family traditions of ${found.city}`,
                `Golden-hour couple portrait sessions in iconic local landscapes`,
                `High-definition multi-camera coverage of sangeet, wedding, and reception`,
            ],
            venues: [
                {
                    name: `Top Luxury Venues in ${found.city}`,
                    type: 'Heritage & Luxury Hotels',
                    desc: `Curated wedding venues, banquets, and resorts across ${found.city}, ${found.state}.`,
                },
            ],
            faqs: [
                {
                    question: `Does The Wedding Boys travel to ${found.city} for destination weddings?`,
                    answer: `Yes, our cinematography and photography crew travels worldwide, including ${found.city}, ${found.state}, bringing full cinema-grade camera rigs, audio, and lighting gear.`,
                },
            ],
        };
    }

    return null;
}

/**
 * Returns list of primary static parameters for Next.js generateStaticParams
 */
export function getAllDestinationSlugs() {
    return Object.keys(FEATURED_DESTINATIONS).map((slug) => ({ city: slug }));
}
