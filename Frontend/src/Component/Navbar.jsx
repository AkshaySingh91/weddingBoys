import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch,
    FiX,
    FiMenu,
    FiFilm,
    FiCamera,
    FiUsers,
    FiInfo,
    FiHome,
    FiMail,
    FiDollarSign,
    FiSettings,
    FiList,
} from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useStudioDetails } from '../Context/StudioDetailsContext';

const primaryLinks = [
    { name: 'Home', path: '/', icon: <FiHome /> },
    { name: 'Pricing', path: '#pricing', icon: <FiDollarSign /> },
    { name: 'Process', path: '#process', icon: <FiSettings /> },
    { name: 'Services', path: '#services', icon: <FiList /> }
];

const secondaryLinks = [
    { name: 'Films', path: '/films', icon: <FiFilm className='lg:w-6 lg:h-6' /> },
    { name: 'Gallery', path: '/photos', icon: <FiCamera className='lg:w-6 lg:h-6' /> },
    { name: 'Team', path: '/team', icon: <FiUsers className='lg:w-6 lg:h-6' /> },
    { name: 'About', path: '/about-us', icon: <FiInfo className='lg:w-6 lg:h-6' /> }
];

export default function ProfessionalNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { studioLogo } = useStudioDetails();
    const [currentActiveComponent, setCurrentActiveComponent] = useState("/");
    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search-result?query=${searchQuery}`);
            setIsMenuOpen(false);
        }
    };

    return (
        <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 sm:py-4 md:py-0 lg:px-8">
                {/* Desktop Header */}
                <div className="hidden md:flex h-24 items-center justify-between">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-4 flex-shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                        >
                            <img
                                src={studioLogo || "/logo-placeholder.png"}
                                className="w-20 h-20  rounded-full border-4 border-rose-50 p-1 shadow-lg"
                                alt="Studio Logo"
                            />
                            <div className="absolute inset-0 border-2 border-rose-200 rounded-full animate-ping-slow opacity-20" />
                        </motion.div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent font-serif">
                                The Wedding Boys
                            </span>
                            <span className="text-xs text-rose-500/80 font-medium tracking-widest">
                                MUMBAI'S PREMIER WEDDING FILMMAKERS
                            </span>
                        </div>
                    </Link>

                    {/* Primary Navigation */}
                    <div className="flex items-center gap-6 mx-8">
                        {primaryLinks.map((link) => {
                            if (link.path.startsWith('#')) {
                                return (
                                    <a
                                        key={link.path}
                                        href={link.path}
                                        onClick={() => setCurrentActiveComponent(link.path)}
                                        className={`px-3 py-2 flex items-center gap-2 text-gray-700 hover:text-rose-600 transition-all 
                                            ${currentActiveComponent === link.path ? 'text-rose-600 font-medium border-b-2 border-rose-500' : ''}`}                                    >
                                        {link.name === "Pricing" ? <span className='text-xl'>&#x20B9;</span> : link.icon}
                                        <span className="text-sm">{link.name}</span>
                                    </a>
                                );
                            } else {
                                return (
                                    <NavLink
                                        onClick={() => setCurrentActiveComponent(link.path)}
                                        key={link.path}
                                        to={link.path}
                                        className={({ isActive }) =>
                                            `px-3 py-2 flex items-center gap-2 text-gray-700 hover:text-rose-600 transition-all 
                                        ${isActive ? 'text-rose-600 font-medium border-b-2 border-rose-500' : ''
                                            }`
                                        }
                                    >
                                        {link.icon}
                                        <span className="text-sm">{link.name}</span>
                                    </NavLink>
                                );
                            }
                        })}

                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        <motion.div whileHover={{ scale: 1.05 }}>
                            <Link
                                to="/contact"
                                className="text-desktopBodyMedium text-nowrap px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-full flex items-center gap-2 shadow-lg hover:shadow-rose-200 transition-shadow"
                            >
                                <span>Get Quote</span>
                                <FiMail className="text-lg" />
                            </Link>
                        </motion.div>

                        {/* Desktop Hamburger for Secondary Links */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-600 hover:text-rose-500 rounded-full"
                        >
                            <FiMenu className="text-xl" />
                        </motion.button>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 flex-shrink-0">
                        <img
                            src={studioLogo || "/logo-placeholder.png"}
                            className="w-16 h-16 rounded-full border-2 border-rose-100"
                            alt="Studio Logo"
                        />
                        <div className="flex flex-col gap-1">
                            <span className="sm:text-2xl md:text-3xl text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500  bg-clip-text text-transparent font-vibes">
                                The Wedding Boys
                            </span>
                            <span className="hidden md:block sm:text-xs md:text-sm lg:text-md text-xs text-rose-500/80 font-medium lg:tracking-widest font-cinzel uppercase">
                                Where Every Frame Tells a Love Story
                            </span>
                            <span className="md:hidden sm:text-xs md:text-sm lg:text-md text-xs text-rose-500/80 font-medium lg:tracking-widest font-cinzel uppercase">
                                Architects of Cinematic Romance
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-600 hover:text-rose-500"
                        >
                            {isMenuOpen ? (
                                <motion.div
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: 180 }}
                                >
                                    <FiX className="text-xl" />
                                </motion.div>
                            ) : (
                                <FiMenu className="text-xl" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Combined Menu for Desktop (Secondary) and Mobile (All) */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="md:hidden lg:block lg:fixed lg:h-screen lg:w-screen lg:top-0 lg:left-0 absolute md:right-4 md:top-20 md:w-64 inset-x-0 md:rounded-xl bg-white/95 backdrop-blur-lg shadow-xl border border-gray-100"
                        >
                            <div className=" p-4 h-full">
                                {/* Search Bar - Always on Top */}
                                <div className="relative py-2">
                                    <input
                                        type="text"
                                        placeholder="Beach, Aerial, Royal, pre-wedding, ..."
                                        className="w-full pl-12 pr-4 py-2 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                        onKeyDown={handleSearch}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                                </div>
                                <div className="sm:hidden md:block lg:flex justify-end">
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="close-btn w-fit bg-slate-300 rounded-md p-1 self-end outline-none">
                                        <FiX className='w-6 h-6 ' />
                                    </button>
                                </div>
                                {/* Desktop: Secondary Links */}
                                <div className="hidden md:block lg:my-auto">
                                    {secondaryLinks.map((link) => (
                                        <NavLink
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-700 hover:bg-rose-50'} justify-center`
                                            }
                                        >
                                            {link.icon}
                                            <span className="font-medium lg:text-desktopBodyMedium">{link.name}</span>
                                        </NavLink>
                                    ))}
                                </div>


                                {/* Mobile: All Links */}
                                <div className="md:hidden">
                                    {primaryLinks.map((link) => {
                                        if (link.path.startsWith('#')) {
                                            return (
                                                <a
                                                    key={link.path}
                                                    href={link.path}
                                                    onClick={() => setCurrentActiveComponent(link.path)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg
                                            ${currentActiveComponent === link.path ? 'bg-rose-50 text-rose-600' : 'text-gray-700 hover:bg-rose-50'}`}                                    >
                                                    {link.name === "Pricing" ? <span className='text-xl'>&#x20B9;</span> : link.icon}
                                                    <span className="text-sm">{link.name}</span>
                                                </a>
                                            );
                                        } else {
                                            return (
                                                <NavLink
                                                    onClick={() => setCurrentActiveComponent(link.path)}
                                                    key={link.path}
                                                    to={link.path}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-700 hover:bg-rose-50 '}`
                                                    }>
                                                    {link.icon}
                                                    <span className="text-sm">{link.name}</span>
                                                </NavLink>
                                            );
                                        }
                                    })}
                                    <hr className='text-slate-200' />
                                    {secondaryLinks.map((link) => (
                                        <NavLink
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => { setIsMenuOpen(false); setCurrentActiveComponent("/") }}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-700 hover:bg-rose-50'}`
                                            }>
                                            {link.icon}
                                            <span className="font-medium">{link.name}</span>
                                        </NavLink>
                                    ))}
                                </div>
                                {/* Mobile CTA */}
                                <div className="md:hidden">
                                    <Link
                                        to="/contact"
                                        className="block w-full py-3 text-center bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                                    >
                                        Get Free Quote
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav >
    );
}