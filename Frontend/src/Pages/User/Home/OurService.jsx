import { motion } from 'framer-motion';
import { FiCamera, FiFilm, FiVideo, FiMusic, FiHeart, FiGift } from 'react-icons/fi';
import { useStudioDetails } from '../../../Context/StudioDetailsContext';
import { NavLink } from 'react-router-dom';
import homeImage1 from "../../../Asset/Home/homeImage1.jpg";
import homeImage2 from "../../../Asset/Home/homeImage2.jpeg";
import homeImage3 from "../../../Asset/Home/homeImage3.jpg";
import homeImage4 from "../../../Asset/Home/homeImage4.jpg";
import homeImage5 from "../../../Asset/Home/homeImage5.jpg";
import homeImage6 from "../../../Asset/Home/homeImage6.jpg";

const OurServices = () => {
  const services = [
    {
      title: "Cinematic Wedding Films",
      description: "Hollywood-style storytelling that captures every tear, laugh, and magical moment in 4K brilliance.",
      icon: <FiFilm className="text-xl text-secondary_on" />,
      image: homeImage1,
      color: "bg-secondary_on/10"
    },
    {
      title: "Storybook Photography",
      description: "Timeless images that transform your special day into a visual fairytale.",
      icon: <FiCamera className="text-xl text-secondary_on" />,
      image: homeImage4,
      color: "bg-primary_on/10"
    },
    {
      title: "Pre-Wedding Adventures",
      description: "Romantic shoots that tell your unique love story before the big day.",
      icon: <FiHeart className="text-xl text-secondary_on" />,
      image: homeImage3,
      color: "bg-tertiary_on/10"
    },
    {
      title: "Engagement Stories",
      description: "Capture the excitement of your new journey together.",
      icon: <FiGift className="text-xl text-secondary_on" />,
      image: homeImage6,
      color: "bg-primary_on/10"
    },
    {
      title: "Baby Celebrations",
      description: "Cherish the joy of new beginnings with heartwarming coverage.",
      icon: <FiMusic className="text-xl text-secondary_on" />,
      image: homeImage2,
      color: "bg-tertiary_on/10"
    },
    {
      title: "Same-Day Edits",
      description: "Your highlights delivered within hours - perfect for receptions and social media.",
      icon: <FiVideo className="text-xl text-secondary_on" />,
      image: homeImage5,
      color: "bg-secondary_on/10"
    },
  ];
  const { studioContact } = useStudioDetails();

  // Framer Motion container variant with viewport config for better performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      }
    }
  };

  return (
    <section
      id="services"
      className="py-16 px-4 sm:-mx-2 sm:px-6 lg:px-8 relative overflow-hidden "
    // Use Intersection Observer threshold so the animations start sooner
    >
      {/* Simplified Decorative Grid Background Pattern */}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:mb-16 sm:mb-8"
        >
          <h2 className="sm:text-mobileHeadlineMedium lg:text-desktopHeadlineMedium text-secondary_on font-semibold mb-4">
            Our Magical Offerings
          </h2>
          <p className="sm:text-mobileBodyLarge lg:text-desktopBodyLarge text-tertiary_on max-w-3xl mx-auto">
            Every love story deserves its own visual symphony – discover how we transform moments into everlasting memories.
          </p>
          <p className="sm:text-mobileBodyLarge lg:text-desktopBodyLarge text-black font-primary font-semibold max-w-3xl mx-auto">
            Beyond Photography - Creating Living Memories
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl border-2 border-slate-300 relative group ${index % 2 ? "bg-[#e4b88f67]" : "bg-[#9a724e51]"
                }`}
            >
              <div className="relative lg:h-64 sm:h-60 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                {/* Decorative Accent for Card */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-pink-200/50 rounded-bl-full transform translate-x-1/3 -translate-y-1/3 rotate-45 pointer-events-none"></div>
                <div className="absolute top-4 right-4 p-3 bg-primary rounded-full shadow-lg">
                  {service.icon}
                </div>
              </div>
              <div className="lg:p-6 sm:p-4">
                <h3 className="text-desktopBodyLarge font-bold text-secondary_on mb-2 text-center">
                  {service.title}
                </h3>
                <p className="text-mobileBodyMedium text-tertiary_on mb-4 text-center">
                  {service.description}
                </p>
                <NavLink
                  to={"/photos"}
                  className="text-secondary_on text-mobileBodySmall font-medium hover:underline flex items-center justify-center gap-2"
                >
                  Explore Gallery
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-mobileBodyMedium text-tertiary_on mb-6">
            Don't see exactly what you're looking for? We customize every package!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-tertiary_on text-white lg:px-8 lg:py-3 sm:px-6 sm:py-2 rounded-full font-bold flex items-center gap-3 mx-auto lg:text-desktopBodyMedium sm:text-mobileBodyLarge shadow-lg"
            onClick={() => {
              window.open(`https://wa.me/${studioContact?.[0]}`, '_blank');
            }}
          >
            <FiCamera />
            Create Your Perfect Package
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default OurServices;
