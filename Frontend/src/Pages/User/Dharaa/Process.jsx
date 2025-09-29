import { ClipboardList, PhoneCall, Users, UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'

function Process() {
  const howItWorksData = [
    {
      icon: PhoneCall,
      title: 'Contact Us',
      description: 'Reach out via call or WhatsApp to discuss your requirements.',
    },
    {
      icon: Users,
      title: 'Consultation',
      description: 'We guide you through catering packages based on your gathering size.',
    },
    {
      icon: ClipboardList,
      title: 'Choose Package',
      description: 'Pick from Silver, Gold, or Platinum packages tailored to your event.',
    },
    {
      icon: UtensilsCrossed,
      title: 'Catering Delivered',
      description: 'We serve fresh, delicious food at your event venue with perfection.',
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative bg-gradient-to-b from-[#FFDCCC] to-[#FFF7F0] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-12 rounded-none sm:rounded-2xl lg:rounded-3xl overflow-hidden"
    >
      {/* Decorative Wave */}
      <div className="absolute top-0 left-0 w-full -translate-y-1/3 opacity-70">
        <svg viewBox="0 0 1440 320" className="w-full">
          <path
            fill="#FF6969"
            fillOpacity="0.1"
            d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L0,0Z"
          ></path>
        </svg>
      </div>

      {/* Animated swirl (hidden on mobile to avoid clutter) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="hidden sm:block absolute -right-28 -top-28 w-56 h-56 opacity-10"
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

      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center">
        How It Works
      </h2>
      <p className="text-gray-600 text-center mt-2 mb-10 sm:mb-14 max-w-xl mx-auto text-sm sm:text-base">
        Booking catering with Dharaa Event Management is simple, transparent, and stress-free.
      </p>

      {/* Steps */}
      <div className="grid grid-cols-1  lg:grid-cols-4 gap-6 sm:gap-8">
        {howItWorksData.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="bg-white/90 backdrop-blur-sm p-6 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 text-center"
          >
            <item.icon className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-500">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Floating Particles (background only) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
            initial={{ y: 0 }}
            animate={{ y: [0, 100, 0] }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </motion.section>
  )
}

export default Process
