import React, { useState, useEffect, useRef } from 'react'
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion, AnimatePresence } from 'framer-motion';
import "leaflet/dist/leaflet.css";
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup';
import { Link } from 'react-router-dom';

const api_url = process.env.REACT_APP_API_URL;

// Animation variants
const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 }
};

const overlayVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 }
};

export default function Map() {
    const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(true);
    const [clients, setClients] = useState([]);
    const [showInstructions, setShowInstructions] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const mapRef = useRef(null);

    useEffect(() => {
        const fetchMapClients = async () => {
            try {
                const res = await fetch(`${api_url}/api/map-clients`);
                const data = await res.json();
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error');
                }
                setClients(data.clients);
            } catch (error) {
                fireMessage(error.message, 'error');
            }
        };
        fetchMapClients();
    }, []);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    useEffect(() => {
        const handleScroll = () => setShowInstructions(true);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMapInteraction = () => {
        setShowInstructions(false);
    };

    const heartIcon = new L.DivIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>`,
        className: "text-red-600 transition-all duration-300 hover:text-red-700",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });

    return (
        <div className="relative w-full">
            {/* Text Content */}
            <div className="map-text-content flex flex-col items-center gap-1 mt-20 mb-10 sm:gap-3">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-primary lg:text-desktopHeadlineSmall font-semibold sm:text-mobileBodyLarge text-nowrap'
                >
                    Love Stories Captured Across the Map
                </motion.h1>
                <motion.h2  
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='text-primary text-desktopBodySmall font-light text-center'
                >
                    Tap on the icon to see which couples choose us to capture their special day
                </motion.h2>
            </div>

            {/* Map Container */}
            <div className="relative h-[70vh] w-full lg:px-5 lg:py-6">
                {/* Overlay (only covers the map) */}
                <AnimatePresence>
                    {showInstructions && (
                        <motion.div
                            variants={overlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="absolute inset-0 z-[1001] bg-black/50 flex items-center justify-center backdrop-blur-sm rounded-2xl"
                            style={{ top: '0', left: '0', right: '0', bottom: '0' }}
                            onClick={() => setShowInstructions(false)}
                        >
                            <div className="text-center p-6 bg-white rounded-2xl shadow-xl">
                                <p className="text-xl font-semibold mb-2 text-primary animate-pulse">
                                    {isMobile ? 'Pinch to zoom' : 'Scroll to zoom'}
                                </p>
                                <p className="text-sm text-gray-600">Click anywhere to begin</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Map */}
                <motion.div
                    className="absolute inset-0 border-2 border-gray-200 rounded-2xl overflow-hidden shadow-xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}>
                    <MapContainer
                        ref={mapRef}
                        center={[20.5937, 78.9629]}
                        zoom={6}
                        minZoom={4}
                        maxZoom={8}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                        whenReady={() => mapRef.current?.leafletElement.on('zoomstart movestart', handleMapInteraction)}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {clients.map((c) => (
                            <Marker
                                key={c.clientId}
                                position={[c.coordinate.latitude, c.coordinate.longitute]}
                                icon={heartIcon}
                                eventHandlers={{
                                    click: () => setShowInstructions(false)
                                }}
                            >
                                <Popup className="custom-popup">
                                    <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        className="min-w-40 flex flex-col gap-2"
                                    >
                                        <Link to={`/films/${c.video._id.toString()}`}>
                                            <img
                                                alt="map-client-image"
                                                className="w-36 h-28 rounded-lg object-cover border border-gray-200 hover:shadow-md transition-shadow"
                                                src={c.url}
                                            />
                                        </Link>
                                        <div className="text-content">
                                            <p className="text-sm font-medium text-primary">
                                                {c.clientName.Bride} & {c.clientName.Groom}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {c.photo.photoLocation.city}
                                            </p>
                                        </div>
                                    </motion.div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </motion.div>

                {/* Sidebar Toggle Button */}
                <motion.button
                    className="z-[1000] absolute bottom-4 right-4 w-auto h-auto rounded-full shadow-lg transition-colors  bg-gray-600 "
                    onClick={() => setIsMapSidebarOpen(!isMapSidebarOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <motion.div
                        animate={{ rotate: isMapSidebarOpen ? 180 : 0 }}
                        className="text-white w-10 h-10  flex items-center justify-center rounded-full"
                    >
                        {isMapSidebarOpen ? (
                            <svg className='lg:w-6 lg:h-6 sm:w-4 sm:h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="white">
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                        ) : (
                            <svg
                                className="lg:w-6 lg:h-6 sm:w-4 sm:h-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 -960 960 960"
                                fill="white"
                            >
                                <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
                            </svg>
                        )}
                    </motion.div>
                </motion.button>

                {/* Side Panel */}
                <AnimatePresence>
                    {isMapSidebarOpen && (
                        <motion.div
                            variants={sidebarVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="absolute w-fit right-0 top-0 h-full bg-gradient-to-b from-primary to-primary_on shadow-2xl z-[999] overflow-hidden py-4 px-2"
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <div className="h-full flex flex-col">
                                <h2 className="text-2xl text-center font-bold mb-4 text-white">
                                    Our Clients
                                </h2>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {clients.map((c, idx) => (
                                        <motion.div
                                            key={c.clientId}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-4 last:mb-0"
                                        >
                                            <Link to={`/films/${c.video._id}`}>
                                                <div className={`client${idx} relative hover:bg-white/20 flex lg:flex-row lg:gap-3 sm:gap-1 justify-center p-2 hover:bg-gray-700 rounded-lg sm:flex-col`}>
                                                    <div className="img-wrapper lg:w-32 lg:h-24 sm:h-24 sm:w-44">
                                                        <img
                                                            src={c.url}
                                                            className="w-full h-full lg:rounded-lg sm:rounded-md object-cover bg-center"
                                                            alt="Client"
                                                        />
                                                    </div>
                                                    <div className="text flex flex-col justify-center text-desktopBodySmall text-[#ffffff]">
                                                        <div className="client-name flex flex-wrap gap-2 font-semibold text-wrap whitespace-normal max-w-32">
                                                            <p className='py-1'>
                                                                <span className="bride uppercase">{c.clientName.Bride}</span> &
                                                                <span className="groom uppercase"> {c.clientName.Groom}</span>
                                                            </p>
                                                        </div>
                                                        <div className="date flex flex-wrap gap-2 text-nowrap">
                                                            <span className="capitalize">{c.video.videoShootDate}</span>
                                                        </div>
                                                        <div className="sm:hidden lg:block location flex flex-wrap gap-2 text-nowrap">
                                                            <span className="capitalize">{c.video.videoLocation.city}</span>
                                                        </div>
                                                    </div>

                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
        </div>
    );
}