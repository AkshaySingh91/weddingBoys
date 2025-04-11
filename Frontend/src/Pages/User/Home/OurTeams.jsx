import { motion } from 'framer-motion';
import { FiInstagram, FiLinkedin, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import aman from "../../../Asset/Home/aman.jpg"
import yogesh from "../../../Asset/Home/yogesh.jpg"
import suraj from "../../../Asset/Home/suraj.jpg"

const teamMembers = [
  {
    name: "Aman Singh",
    role: "Founder",
    image: aman,
    social: { instagram: "mansa_official_80", linkedin: "/mansa" }
  },
  {
    name: "Yogesh Dubey",
    role: "Founder",
    image: yogesh,
    social: { instagram: "yogesh_dubey13", linkedin: "/yogesh" }
  },
  {
    name: "Suraj Singh",
    role: "Managing director",
    image: suraj,
    social: { instagram: "suraj_sin18", linkedin: "/suraj" }
  },
];

const TeamCard = ({ member }) => {
  return (
    <motion.div
      className="relative group overflow-hidden rounded-2xl shadow-xl"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <img
        src={member.image}
        alt={member.name}
        className="w-full h-96 object-cover transform transition-all duration-500 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-2 text-white">
        <motion.div
          className="translate-y-8 group-hover:translate-y-0 transition-all duration-300"
        >
          <h3 className="lg:text-desktopBodyLarge sm:text-mobileBodyLarge font-bold mb-1 tracking-widest">{member.name}</h3>
          <p className="lg:text-desktopBodyLarge sm:text-mobileBodyLarge opacity-80 tracking-wider">{member.role}</p>
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="flex gap-3 mt-4 opacity-0 group-hover:opacity-100 translate-y-8 group-hover:translate-y-0 transition-all duration-300"
        >
          <a
            target='_blank'
            rel="noreferrer"
            href={`https://www.instagram.com/${member.social.instagram}`}
            className="p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20">
            <FiInstagram className="w-5 h-5" />
          </a>
          <a href={`https://www.linkedin.com/${member.social.linkedin}`}
            target='_blank'
            rel="noreferrer"
            className="p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20">
            <FiLinkedin className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function OurTeam() {
  return (
    <section className="py-20 sm:px-2 lg:px-8 ">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="lg:text-desktopHeadlineMedium sm:text-mobileHeadlineMedium font-bold text-primary mb-4">
            Visionaries Behind the Lens
          </h2>
          <p className="lg:text-desktopBodyLarge sm:text-mobileBodyLarge text-primary max-w-2xl mx-auto">
            Our award-winning team combines technical mastery with artistic sensibility to craft your visual legacy
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid  sm:grid-row-3 lg:grid-cols-3 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TeamCard member={member} />
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <Link
            to="/team"
            className="inline-flex items-center gap-2 text-desktopBodyMedium text-tertiary_on hover:text-secondary_on transition-colors"
          >
            Meet Full Creative Ensemble
            <FiArrowRight className="w-5 h-5 mt-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}