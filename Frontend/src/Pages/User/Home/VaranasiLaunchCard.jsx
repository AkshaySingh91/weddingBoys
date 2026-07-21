import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router
import varanasiCity from "../../../Asset/Home/v1.png";
import { useStudioDetails } from '../../../Context/StudioDetailsContext.jsx';

const VaranasiLaunchCard = () => {
    // Optional: If using react-router. If using Next.js, use router.push instead.
    // const navigate = useNavigate(); 

    const { studioLogo } = useStudioDetails();

    // Timer State
    const [timeLeft, setTimeLeft] = useState({
        days: 10,
        hours: 14,
        minutes: 59,
        seconds: 59
    });

    // Simple countdown logic for the visual effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { days, hours, minutes, seconds } = prev;
                if (seconds > 0) seconds--;
                else {
                    seconds = 59;
                    if (minutes > 0) minutes--;
                    else {
                        minutes = 59;
                        if (hours > 0) hours--;
                        else {
                            hours = 23;
                            if (days > 0) days--;
                        }
                    }
                }
                return { days, hours, minutes, seconds };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleExploreClick = () => {
        // navigate('/varanasi'); 
        // For now, using standard window location if router isn't hooked up here:
        window.location.href = '/varanasi';
    };

    return (
        // Full width container matching your website's soft warm theme
        <div className="w-full my-12 bg-[#FFF4F0] rounded-[2rem] relative overflow-hidden shadow-[0_10px_40px_-15px_rgba(235,75,85,0.1)]">

            {/* Background Image Container - strictly on the right side to prevent text overlap */}
            <div className="absolute top-0 right-0 w-full h-full z-0">
                {/* <div className="absolute inset-0 bg-gradient-to-r from-[#FFF4F0] via-[#FFF4F0]/80 to-transparent z-10 md:block hidden"></div> */}
                {/* Mobile gradient overlay for readability */}
                <div className="absolute inset-0 bg-[#FFF4F0]/85 z-10 md:hidden block"></div>
                <img
                    src={varanasiCity}
                    alt="Varanasi City"
                    className="w-full h-full object-cover object-center opacity-90"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-20 flex flex-col md:flex-row items-center w-full min-h-[450px]">

                {/* Left Side: Text and CTA */}
                <div className="w-full md:w-[60%] p-8 md:p-14 flex flex-col justify-center">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#eb4b55]/20 w-fit mb-6 shadow-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#eb4b55] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#eb4b55]"></span>
                        </span>
                        <span className="text-[#eb4b55] text-xs font-bold tracking-widest uppercase">New Branch Alert</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-[1.2] tracking-tight mb-4">
                        Mumbai's Premier Storytellers <br className="hidden md:block" />
                        are now in <span className="text-[#eb4b55]">Varanasi</span>
                    </h2>

                    <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
                        Experience our signature cinematic wedding filmmaking in the Sacred City. We are taking limited bookings for the upcoming wedding season.
                    </p>

                    {/* Urgency Timer Box */}
                    <div className="bg-white rounded-2xl p-5 shadow-lg shadow-red-500/5 border border-red-50 inline-block w-fit mb-8">
                        <p className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#eb4b55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Launch Offer: 20% Off Ends In
                        </p>

                        <div className="flex items-center gap-3 md:gap-4 text-center">
                            {Object.entries(timeLeft).map(([unit, value]) => (
                                <div key={unit} className="flex flex-col">
                                    <div className="bg-[#FFF4F0] text-[#eb4b55] font-bold text-2xl md:text-3xl w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-inner">
                                        {value.toString().padStart(2, '0')}
                                    </div>
                                    <span className="text-[10px] md:text-xs text-gray-500 mt-2 uppercase font-medium tracking-wider">{unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Direct CTA Button */}
                    <div>
                        <button
                            onClick={handleExploreClick}
                            className="group relative inline-flex items-center gap-3 bg-[#eb4b55] hover:bg-[#d43c46] text-white font-semibold py-4 px-10 rounded-full shadow-lg shadow-[#eb4b55]/30 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <span className="text-lg">Explore Varanasi Packages</span>
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VaranasiLaunchCard;