import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const categories = ["All Work", "Wedding", "Pre-Wedding", "Garden", "Haldi"];
const api_url = process.env.REACT_APP_API_URL;

const PortfolioSkeleton = () => (
    <div className="space-y-8">
        <div className="flex justify-center gap-4 animate-pulse">
            {categories.map((_, i) => (
                <div key={i} className="h-10 w-24 bg-primary/20 rounded-lg" />
            ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-primary/20 rounded-xl animate-pulse" />
            ))}
        </div>
    </div>
);

export default function OurPortfolio() {
    const [activeCategory, setActiveCategory] = useState("All Work");
    const [portfolio, setPortfolio] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${api_url}/api/home/sample-photos?category=${activeCategory}`);
                const data = await res.json();
                console.log(data)
                if (res.status >= 300) {
                    Swal.fire({
                        toast: true,
                        position: 'top-right',
                        icon: 'error',
                        title: data.message,
                        timer: 1500,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });
                }
                setPortfolio(data.photos);
            } catch (error) {
                Swal.fire({
                    toast: true,
                    position: 'top-right',
                    icon: 'error',
                    title: error.message,
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPortfolio();
    }, [activeCategory]);

    return (
        <section
        id="ourPortfolio"
        className="lg:py-10 sm:py-5 px-4 sm:px-6 lg:px-8  bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden lg:rounded-3xl sm:rounded-lg">

            {/* henna top border */}
            <div className="absolute top-0 left-0 w-full">
                <svg viewBox="0 0 1440 320" className="w-full">
                    <path
                        fill="#FF6969"
                        fillOpacity="0.1"
                        d="M0,128L48,138.7C96,149,192,171,288,160C384,149,480,107,576,112C672,117,768,171,864,192C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                    ></path>
                </svg>
            </div>
            {/* Henna-inspired bottom Border */}
            <div className="absolute bottom-0 left-0 w-full opacity-10 transform rotate-180">
                <svg viewBox="0 0 1440 120" className="w-full">
                    <path fill="#FF6969" d="M0,120 C200,80 400,40 720,40 C1040,40 1240,80 1440,120 L1440,0 L0,0 Z"
                        stroke="#FFD700" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
            </div>
            {/* Floating Florals */}
            <div className="absolute top-4 left-4 w-16 h-16 opacity-20">
                <motion.svg
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    viewBox="0 0 24 24"
                >
                    <path fill="#FFD700" d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2zm0 18c-3 0-6-3-6-6s3-6 6-6 6 3 6 6-3 6-6 6z" />
                    <path fill="#FF6969" d="M12 6c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
                </motion.svg>
            </div>
            <motion.div
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-20 right-0 w-48 opacity-15"
            >
                <svg viewBox="0 0 100 40">
                    <path fill="none" stroke="#FF6969" strokeWidth="2"
                        d="M0,20 Q20,0 40,20 T80,20 T120,20"
                        strokeDasharray="4 4" />
                    <circle cx="10" cy="20" r="3" fill="#FFD700" />
                    <circle cx="30" cy="20" r="3" fill="#FFD700" />
                    <circle cx="50" cy="20" r="3" fill="#FFD700" />
                    <circle cx="70" cy="20" r="3" fill="#FFD700" />
                </svg>
            </motion.div>
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={`henna-${i}`}
                        className="absolute w-32 h-32 opacity-10"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            rotate: Math.random() * 360
                        }}
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 10 + i * 2, repeat: Infinity }}
                    >
                        <svg viewBox="0 0 100 100">
                            <path fill="none" stroke="#FF6969" strokeWidth="2"
                                d="M20,80 Q40,60 60,80 T100,80 M30,70 Q50,50 70,70" />
                        </svg>
                    </motion.div>
                ))}
            </div>
            {/* Animated Golden Swirl */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -right-24 -top-24 w-48 h-48 opacity-10"
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
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-[#FF6969]/20"
                        initial={{ y: 0, x: Math.random() * 100 }}
                        animate={{
                            y: [0, 100, 0],
                            x: [Math.random() * 10, Math.random() * 10 + 10]
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            <div className="max-w-7xl -mx-4">
                <div className="text-center lg:mb-10 sm:mb-6">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-desktopBodySmall uppercase tracking-widest text-secondary_on bg-red-100 rounded-md px-2 py-1 text-red-400"
                    >
                        Our portfolio
                    </motion.span>
                    <motion.h2
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        className="text-desktopHeadlineMedium font-bold text-tertiary_on mt-4"
                    >
                        Moments We've Captured
                    </motion.h2>
                    <p className="sm:text-mobileBodyLarge lg:text-desktopBodyLarge text-tertiary_on mt-4 max-w-2xl mx-auto">
                        Browse our collection of wedding stories from across Mumbai and beyond, showcasing our artistic approach to wedding photography and cinematography.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-4 lg:mb-10 sm:mb-6">
                    {categories.map((category) => (
                        <motion.button
                            key={category}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`lg:px-4 lg:py-2 sm:px-3 sm:py-2 text-sm  rounded-full transition-colors ${activeCategory === category
                                ? "bg-secondary_on/20 text-primary"
                                : "bg-secondary_on/10 text-tertiary_on hover:bg-primary_on/20"
                                }`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </motion.button>
                    ))}
                </div>

                {/* Portfolio Grid */}
                {isLoading ? (
                    <PortfolioSkeleton />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid sm:grid-cols-1 lg:grid-cols-4 gap-8"
                        >
                            {portfolio.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative group overflow-hidden rounded-xl shadow-xl"
                                >
                                    <img
                                        src={item.url}
                                        alt={`${item.client?.Bride} & ${item.client?.Groom}`}
                                        className="w-full sm:h-64 lg:h-80 object-cover transform transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <h3 className="text-desktopBodyLarge font-bold">{item.client?.Bride} & {item.client?.Groom}</h3>
                                        <p className="text-mobileBodySmall">{item.photoLocation?.city}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* View All CTA */}
                <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link
                        to="/photos"
                        className="inline-flex items-center gap-2 text-desktopBodyMedium text-tertiary_on hover:text-secondary_on transition-colors"
                    >
                        Explore Complete Gallery
                        <svg className="w-5 h-5 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}