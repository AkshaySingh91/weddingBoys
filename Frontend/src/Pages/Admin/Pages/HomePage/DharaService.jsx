import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom"; 
import { useMediaQuery } from "react-responsive";
import dharaaStoryImg from "../../../../Asset/Dharaa/Client2.webp"
import dharaaLogo from "../../../../Asset/Dharaa/Logo.png"
// Service data to be displayed
const dharaaServices = [
    "Comprehensive Event Planning",
    "Thematic Decor & Design",
    "Vendor & Venue Management",
    "Day-of Coordination",
    "Budget Management & Consulting",
]; 

export default function DharaaStory() {
    const isMobile = useMediaQuery({ maxWidth: 640 });

    return (
        <div className="bg-[#FFEFE4] relative overflow-hidden w-full lg:rounded-3xl shadow-lg sm:rounded-lg my-8">
            {/* Floating Particles Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                        initial={{
                            y: Math.random() * 100,
                            x: Math.random() * 100,
                            scale: 0,
                        }}
                        animate={{
                            y: [0, -100],
                            x: [0, Math.random() * 50 - 25],
                            scale: [0, 1, 0],
                            rotate: 360,
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "linear",
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            {/* Henna Pattern Accent */}
            <div className="absolute top-0 left-0 w-full">
                <svg viewBox="0 0 1440 320" className="w-full">
                    <path
                        fill="#FF6969"
                        fillOpacity="0.1"
                        d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                    ></path>
                </svg>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-8 relative">
                <div className="flex flex-row items-center justify-center ">
                    <img
                        src={dharaaLogo}
                        alt="Dharaa Event Management Logo"
                        className="w-14 h-14 md:h-28 md:w-28 object-contain flex-shrink-0"
                    />
                    <div className="tracking-widest">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                            Dharaa
                        </h2>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                            EventManagement
                        </h2>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row-reverse lg:items-start gap-10">
                    {/* Right Column: Image & Stats */}
                    <div className="w-full lg:w-2/5 relative">
                        <motion.div
                            initial={{ opacity: 0, x: isMobile ? 0 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="relative"
                        >
                            <img
                                src={dharaaStoryImg}
                                alt="Beautifully decorated event space"
                                className="rounded-t-lg shadow-lg w-full h-64 md:h-72 object-cover relative z-10"
                            />
                        </motion.div>

                        {/* Statistics Overlay */}
                        <div
                            className="bg-white rounded-b-lg shadow-lg px-2 py-4 mt-0 flex justify-evenly items-center relative z-20"
                        >
                            <p className="text-center text-md px-3 text-gray-600">Our Clients</p>
                        </div>
                    </div>

                    {/* Left Column: Story Content */}
                    <div className="w-full lg:w-3/5 relative text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="md:mt-6 lg:mt-0 sm:px-2 lg:px-0"
                        > 

                            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 relative z-10">
                                Crafting Your Perfect Event
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-32 sm:w-48 h-1 bg-amber-500 mt-2 rounded-full mx-auto lg:mx-0"
                                    style={{ originX: 0 }}
                                />
                            </h1>

                            <div className="relative">
                                <p className="text-sm sm:text-base text-left text-gray-700 mb-4 relative z-10">
                                   Under the guidance of our trusted parent company, <b>Wedding Boys</b>, Dharaa Event Management is a new name in event planning. We're bringing the same passion and expertise that made them a success to all of your special moments. With a decade of experience from our parent company, we're ready to make your vision a beautiful reality.
                                </p>
                            </div>

                            {/* Services List */}
                            <h2 className="text-base sm:text-lg font-bold mb-4 text-gray-900 relative z-10">
                                Our Services Include
                            </h2>
                            <ul className="text-gray-700 mb-8 space-y-2 relative z-10">
                                {dharaaServices.map((service, index) => (
                                    <motion.li
                                        key={index}
                                        className="flex items-start lg:items-center text-left lg:text-center"
                                        whileHover={{ x: 10 }}
                                    >
                                        <motion.span
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="mr-2 text-amber-500 flex-shrink-0"
                                        >
                                            <FaCheckCircle />
                                        </motion.span>
                                        {service}
                                    </motion.li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Link
                                to="/dharaa-event-management"
                                className="bg-amber-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:bg-amber-700 transition-colors duration-300 relative inline-block z-10"
                            >
                                Learn More About Us
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}