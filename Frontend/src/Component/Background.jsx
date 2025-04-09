import { motion } from 'framer-motion';
import { FiDroplet } from 'react-icons/fi';

export default function CinematicBackground() {
    return (
        <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#fceee6] to-[#FDE9D9]">
            {/* Film Grain Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgo...')] opacity-10 mix-blend-overlay" />

            {/* Floating Wedding Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Floating Petals */}
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={`petal-${i}`}
                        className="absolute text-rose-200/40"
                        initial={{
                            y: -100,
                            x: Math.random() * 100,
                            rotate: Math.random() * 360,
                        }}
                        animate={{
                            y: [0, 1000, 0],
                            x: [Math.random() * 50, Math.random() * 100],
                            rotate: Math.random() * 360,
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 2,
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                        }}
                    >
                        <FiDroplet className="w-6 h-6 transform -rotate-45" />
                    </motion.div>
                ))}

                {/* Animated Wedding Ring using Actual ring.svg */}
                <motion.div
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="400px"
                        height="400px"
                        viewBox="0 0 1000 1000"
                        className="opacity-40"
                    >
                        <defs>
                            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#C0A080" />
                                <stop offset="100%" stopColor="#FFD700" />
                            </linearGradient>
                        </defs>

                        <g transform="translate(0,511) scale(0.1,-0.1)">
                            {/* Main Band */}
                            <path fill="url(#ringGradient)" d="M3518.2,4521.9c-232.5-265.8-424.2-495.7-429.3-511.1c-5.1-12.8,163.5-23,421.6-23h431.9l421.6,490.6c230,268.3,424.2,498.3,426.7,511.1c5.1,10.2-184,20.4-421.6,20.4h-431.9L3518.2,4521.9z" />

                            {/* Diamond Setting */}
                            <path fill="#ffffff" stroke="#FFD700" strokeWidth="20" d="M5209.9,4989.6c5.1-12.8,196.8-242.8,426.7-511.1l421.6-490.6h431.8c247.9,0,426.8,10.2,421.6,23c-2.5,12.8-196.8,242.8-429.3,511.1L6060.8,5010h-429.3C5393.9,5010,5204.8,4999.8,5209.9,4989.6z" />

                            {/* Lower Band */}
                            <path fill="url(#ringGradient)" d="M4583.8,4481c-222.3-260.6-401.2-477.9-393.5-483c5.1-5.1,375.6-7.7,822.8-5.1l812.6,7.7l-406.3,477.9c-222.3,263.2-411.4,477.8-419.1,477.8C4992.7,4956.3,4806.1,4741.7,4583.8,4481z" />

                            {/* Circular Details */}
                            <path fill="none" stroke="#C0A080" strokeWidth="50" d="M3150.2,3752.8C3454.3,3425.7,4675.8,2148,4683.5,2148c12.8,0,25.6-33.2-393.5,894.4l-355.2,779.4l-431.9,7.7l-429.3,7.7L3150.2,3752.8z" />

                            <path fill="none" stroke="#FFD700" strokeWidth="30" d="M4131.5,3816.6c0-35.8,853.5-1898.6,868.8-1898.6c15.3,0,868.8,1862.9,868.8,1898.6c0,10.2-391,17.9-868.8,17.9S4131.5,3826.9,4131.5,3816.6z" />

                            {/* Inner Details */}
                            <path fill="#C0A080" d="M5999.5,3676.1C5291.7,2114.8,5304.4,2148,5317.2,2148c7.7,0,1244.5,1293,1533.2,1604.8l76.7,81.8h-426.8h-429.3L5999.5,3676.1z" />

                            {/* Main Circular Band */}
                            <path fill="none" stroke="url(#ringGradient)" strokeWidth="80" d="M3362.3,2804.7c-437-191.6-843.3-483-1226.6-879.1c-925-958.3-1300.7-2294.7-1017-3605.6c334.8-1543.5,1569-2739.4,3148.2-3051.1c375.6-74.1,1027.3-79.2,1410.6-10.2C6911.7-4524.1,7992.7-3719.1,8552.3-2605c644,1282.8,544.3,2810.9-258.1,4014.5C8074.4,1736.6,7548,2263,7226.1,2475.1c-219.7,143.1-631.2,360.3-756.4,398.6c-40.9,10.2-76.7-17.9-173.8-140.5c-69-84.3-120.1-158.4-115-163.5c5.1-5.1,104.8-51.1,219.8-99.7c447.2-191.7,840.7-467.6,1188.2-830.5c465.1-490.6,771.7-1073.3,914.8-1740.2c84.3-391,84.3-1052.8,0-1428.5c-319.4-1448.9-1362-2488.9-2813.4-2803.2c-339.9-74.1-1073.3-69-1428.5,10.2C2838.5-4002.8,1783.1-2927,1484.1-1493.4c-71.5,345-66.4,1029.8,12.8,1392.7C1742.2,1051.7,2529.3,2010,3600,2470c115,48.5,214.6,94.5,219.8,99.7c10.2,10.2-219.8,301.5-247.9,311.8C3564.2,2886.5,3469.7,2850.7,3362.3,2804.7z" />
                        </g>
                    </svg>
                </motion.div>


            </div>

            {/* Cinematic Light Flares */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={`flare-${i}`}
                        className="absolute w-64 h-64 bg-gradient-to-r from-rose-200/10 to-transparent transform -skew-x-12"
                        initial={{ x: -200, y: Math.random() * 100 }}
                        animate={{ x: "200%", y: Math.random() * 100 }}
                        transition={{
                            duration: 15 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>

            {/* Subtle Grid Overlay */}
            <div
                className="absolute inset-0 bg-[length:40px_40px] bg-repeat [mask-image:radial-gradient(ellipse_at_center,transparent_70%,black)]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, #F5E6DC 1px, transparent 1px), linear-gradient(to bottom, #F5E6DC 1px, transparent 1px)',
                }}
            />
        </div>
    );
}
