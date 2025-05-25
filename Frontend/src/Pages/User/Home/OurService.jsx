import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiFilm, FiVideo, FiMusic, FiHeart, FiGift } from 'react-icons/fi';
import { useStudioDetails } from '../../../Context/StudioDetailsContext';
import { NavLink } from 'react-router-dom';

// Pre-import images statically for reliable bundling
import homeImage1 from '../../../Asset/Home/homeImage1.jpg';
import homeImage2 from '../../../Asset/Home/homeImage2.jpeg';
import homeImage3 from '../../../Asset/Home/homeImage3.jpg';
import homeImage4 from '../../../Asset/Home/homeImage4.jpg';
import homeImage5 from '../../../Asset/Home/homeImage5.jpg';
import homeImage6 from '../../../Asset/Home/homeImage6.jpg';

// LazyImage with skeleton overlay and smooth transition
const LazyImage = memo(({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'
          }`}
      />
    </div>
  );
});

// Static service definitions
const services = [
  {
    title: 'Cinematic Wedding Films',
    description: 'Hollywood-style storytelling that captures every tear, laugh, and magical moment in 4K brilliance.',
    icon: <FiFilm className="text-xl text-secondary_on" />,
    image: homeImage1,
  },
  {
    title: 'Storybook Photography',
    description: 'Timeless images that transform your special day into a visual fairytale.',
    icon: <FiCamera className="text-xl text-secondary_on" />,
    image: homeImage4,
  },
  {
    title: 'Pre-Wedding Adventures',
    description: 'Romantic shoots that tell your unique love story before the big day.',
    icon: <FiHeart className="text-xl text-secondary_on" />,
    image: homeImage3,
  },
  {
    title: 'Engagement Stories',
    description: 'Capture the excitement of your new journey together.',
    icon: <FiGift className="text-xl text-secondary_on" />,
    image: homeImage6,
  },
  {
    title: 'Baby Celebrations',
    description: 'Cherish the joy of new beginnings with heartwarming coverage.',
    icon: <FiMusic className="text-xl text-secondary_on" />,
    image: homeImage2,
  },
  {
    title: 'Same-Day Edits',
    description: 'Your highlights delivered within hours - perfect for receptions and social media.',
    icon: <FiVideo className="text-xl text-secondary_on" />,
    image: homeImage5,
  },
];
 

const OurServices = () => {
  const { studioContact } = useStudioDetails();

  return (
    <section id="services" className="py-16 px-4 lg:px-8 relative overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:mb-16 sm:mb-8"
        >
          <h2 className="sm:text-mobileHeadlineMedium lg:text-desktopHeadlineMedium text-secondary_on font-semibold mb-4">
            Our Magical Offerings
          </h2>
          <p className="sm:text-mobileBodyLarge lg:text-desktopBodyLarge text-tertiary_on max-w-3xl mx-auto mb-2">
            Every love story deserves its own visual symphony – discover how we transform moments into everlasting memories.
          </p>
          <p className="sm:text-mobileBodyLarge lg:text-desktopBodyLarge text-black font-primary font-semibold max-w-3xl mx-auto">
            Beyond Photography - Creating Living Memories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, idx) => (
            <div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5 }}
              className={`rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl border-2 border-slate-300 relative group ${idx % 2 ? 'bg-[#e4b88f67]' : 'bg-[#9a724e51]'
                }`}
            >
              <div className="relative h-60 sm:h-60 lg:h-64">
                <LazyImage src={svc.image} alt={svc.title} />
                <div className="absolute top-0 right-0 w-16 h-16 bg-pink-200/50 rounded-bl-full transform translate-x-1/3 -translate-y-1/3 rotate-45 pointer-events-none" />
                <div className="absolute top-4 right-4 p-3 bg-primary rounded-full shadow-lg">
                  {svc.icon}
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-desktopBodyLarge font-bold text-secondary_on mb-2">
                  {svc.title}
                </h3>
                <p className="text-mobileBodyMedium text-tertiary_on mb-4">
                  {svc.description}
                </p>
                <NavLink
                  to="/photos"
                  className="text-secondary_on text-mobileBodySmall font-medium hover:underline flex items-center justify-center gap-2"
                >
                  Explore Gallery
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>
              </div>
            </div>
          ))}
        </div>

        <div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-16">
          <p className="text-mobileBodyMedium text-tertiary_on mb-6">
            Don't see exactly what you're looking for? We customize every package!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-tertiary_on text-white px-8 py-3 rounded-full font-bold flex items-center gap-3 mx-auto sm:text-mobileBodyLarge lg:text-desktopBodyMedium shadow-lg"
            onClick={() => window.open(`https://wa.me/${studioContact?.[0]}`, '_blank')}
          >
            <FiCamera />
            Create Your Perfect Package
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default memo(OurServices);
