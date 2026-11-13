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
        tagline: 'Lake palaces and royal courtyards',
        heroSubtitle:
            'Marble palaces on the lake, and the evening light on the water. We film and photograph weddings across Udaipur.',
        metaDescription:
            'Destination wedding films and photographs in Udaipur by The Wedding Vachan. Lake palace venues, the best season to marry and real weddings we have filmed.',
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
                desc: 'Lakeside pavilions looking straight across at the City Palace.',
            },
            {
                name: 'The Oberoi Udaivilas',
                type: 'Royal Sanctuary',
                desc: 'Domes, interconnecting reflecting pools, and manicured courtyards celebrating Mewar architecture.',
            },
            {
                name: 'Taj Lake Palace',
                type: 'Heritage Island Wonder',
                desc: 'A white marble palace on the lake, built in 1746.',
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
                    'Yes, Udaipur heritage zones around Lake Pichola require local administrative and venue clearance for aerial drone operations. The Wedding Vachan handles all regulatory logistics in advance.',
            },
            {
                question: 'How far in advance should we book The Wedding Vachan for an Udaipur wedding?',
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
        tagline: 'Forts, palaces and the Pink City',
        heroSubtitle:
            'The walls of Amber, old durbar halls and palace courtyards. We film and photograph weddings across Jaipur.',
        metaDescription:
            'Destination wedding films and photographs in Jaipur by The Wedding Vachan. Palace venues, the best season to marry and real weddings we have filmed.',
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
                    'Jaipur provides an unmatched blend of living royal heritage, good flight connections, and world-class luxury palace hotels that accommodate large destination guest contingents.',
            },
            {
                question: 'How does The Wedding Vachan capture the grand scale of Jaipur palace weddings?',
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
        tagline: 'Beaches, old Portuguese villas and sunsets',
        heroSubtitle:
            'Pheras on the sand, sunset by the sea and parties that run late. We film and photograph weddings across Goa.',
        metaDescription:
            'Beach wedding films and photographs in Goa by The Wedding Vachan. Sunset ceremonies, old Portuguese houses and real weddings we have filmed.',
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
        tagline: 'Mehrangarh, Umaid Bhawan and the blue city',
        heroSubtitle:
            'Mehrangarh at dusk, Umaid Bhawan and the edge of the Thar. We film and photograph weddings across Jodhpur.',
        metaDescription:
            'Destination wedding films and photographs in Jodhpur by The Wedding Vachan. Umaid Bhawan, Mehrangarh and real weddings we have filmed.',
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
        tagline: 'The ghats, the Ganga and the evening aarti',
        heroSubtitle:
            'Portraits on the river at dawn, the evening aarti and the wedding rituals themselves. We film and photograph weddings across Varanasi.',
        metaDescription:
            'Wedding and pre-wedding films and photographs in Varanasi by The Wedding Vachan. The ghats, old havelis and real weddings we have filmed.',
        coordinates: { latitude: '25.3176', longitude: '82.9739' },
        bestSeason: 'October to March (Gentle morning river mists, evening temple warmth)',
        filmingHighlights: [
            'Sunrise boat rides past the ghats, with the temples reflected in the river',
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
        tagline: 'Sea fronts, ballrooms and our home city',
        heroSubtitle:
            'Art Deco sea fronts, hotel ballrooms and big city celebrations. Mumbai is where our studio is.',
        metaDescription:
            'Wedding films and photographs in Mumbai by The Wedding Vachan. Sea front landmarks, hotel ballrooms and real weddings we have filmed.',
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
                type: 'High-rise hotel',
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
        tagline: 'Backwaters, palm groves and temple weddings',
        heroSubtitle:
            'Houseboats, palm-lined backwaters and traditional Kasavu temple weddings. We film and photograph weddings across Kerala.',
        metaDescription:
            'Intimate backwater and coastal wedding films in Kerala. Kumarakom, Kochi, and Kovalam wedding cinematography by The Wedding Vachan.',
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
            tagline: `Wedding films and photographs in ${found.city}, ${found.state}`,
            heroSubtitle: `We film and photograph weddings across ${found.city}.`,
            metaDescription: `Wedding films and photographs in ${found.city}, ${found.state} by The Wedding Vachan.`,
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
                    desc: `Wedding venues, banquet halls and resorts across ${found.city}, ${found.state}.`,
                },
            ],
            faqs: [
                {
                    question: `Does The Wedding Vachan travel to ${found.city} for destination weddings?`,
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
