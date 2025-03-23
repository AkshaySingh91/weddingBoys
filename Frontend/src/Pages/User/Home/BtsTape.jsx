import React, { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2';
import { useScroll, useTransform, motion } from 'framer-motion';
const api_url = process.env.REACT_APP_API_URL;

export default function BtsTape() {
    const btsTapeRef = useRef();
    const containerRef = useRef();
    const [btsImageUrl, setBtsImageUrl] = useState([]);
    const [duplicatedImages, setDuplicatedImages] = useState([]);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

    useEffect(() => {
        const fetchBtsImage = async () => {
            try {
                const res = await fetch(`${api_url}/api/homepage/bts-image`);
                const data = await res.json();
                if (res.status >= 300) {
                    Swal.fire({
                        title: "Error!",
                        text: data.message,
                        icon: "error",
                        confirmButtonColor: "#d33"
                    });
                    return;
                }

                // Duplicate images for seamless loop
                const images = data.btsUrls.length > 0 ? data.btsUrls : [];
                setBtsImageUrl(images);
                setDuplicatedImages([...images, ...images]);

            } catch (error) {
                Swal.fire({
                    title: "Error!",
                    text: error.message,
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }
        };
        fetchBtsImage();
    }, []);

    return (
        <div className="relative overflow-hidden py-20 -mx-4" ref={containerRef}>
            <div className="bts-text-content text-center mb-16 px-4">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="md:text-desktopHeadlineSmall sm:text-mobileHeadlineMedium font-bold text-gray-800 max-w-4xl mx-auto leading-tight"
                >
                    Behind Every Beautiful Shot is a Dedicated Team
                </motion.h1>
            </div>

            <div className="relative -mx-2  py-4 bg-tertiary transform  -rotate-2 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.05)]">
                <motion.div
                    style={{ x }}
                    className="flex gap-3 px-4"
                    ref={btsTapeRef}
                >
                    {duplicatedImages.map((btsUrl, index) => (
                        <div
                            key={`${btsUrl.key}-${index}`}
                            className="relative flex-none w-72 h-56 group overflow-hidden shadow-lg rounded-xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
                            <img
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                src={btsUrl.url || '/placeholder-bts.jpg'}
                                alt="Behind the scenes"
                            />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}