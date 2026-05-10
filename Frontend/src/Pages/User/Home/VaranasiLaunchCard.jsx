import React, { useState } from 'react';
import varanasiCity from "../../../Asset/Home/varanasi-city.png"
import { useStudioDetails } from '../../../Context/StudioDetailsContext.jsx';

const VaranasiLaunchCard = () => {
    const [email, setEmail] = useState('');
    const { studioLogo } = useStudioDetails();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Varanasi Launch Notification Request for:", email);
        setEmail('');
    };

    return (
        <div className="bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] relative overflow-hidden w-full lg:rounded-3xl sm:rounded-lg">

            <div className="relative w-full rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(235,75,85,0.15)] overflow-hidden flex flex-col md:flex-row">

                <div className="absolute bottom-1/3 md:bottom-0 left-0 w-full  md:w-1/2  pointer-events-none opacity-50 md:opacity-60 z-0">
                    <img src={varanasiCity} alt="" />
                </div>

                <div className="relative z-10 flex-1 p-8 md:p-14 flex flex-col justify-center border-b md:border-b-0 md:border-r ">

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 w-fit mb-8 shadow-inner">
                        <svg className="w-4 h-4 text-[#eb4b55]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-[#eb4b55] text-sm font-bold tracking-wide uppercase">New Branch Announcement</span>
                    </div>

                    {/* Heading (Large and Bold) */}
                    <h1 className="text-2xl md:text-4xl font-extrabold text-gray-950 leading-[1.05] tracking-tight mb-6 text-center md:text-left">
                        The Wedding Boys<br /> Is Arriving in <span className="text-[#eb4b55]">Varanasi</span>.
                    </h1>

                    <p className="text-gray-600 text-xl text-center md:text-left leading-relaxed max-w-xl mb-12">
                        Bringing Mumbai’s Premier Cinematic Storytelling to the Sacred City of Light. Join the waitlist to be among the first to have your timeless moments captured with our unparalleled artistry.
                    </p>

                    <div className="flex-grow"></div>
                </div>

                <div className="relative z-10 flex-1 p-8 md:p-14 flex flex-col justify-center items-center">

                    <div className="hidden md:flex items-center gap-6 mb-16 relative w-full justify-center">
                        <div className="w-20 h-20 rounded-full border border-gray-200 bg-white flex items-center justify-center p-3 shadow-lg z-10">
                            <img src={studioLogo} alt="TWB Logo" className="w-14 h-14" />
                        </div>  
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Be the First to Know.</h3>
                    <p className="text-gray-600 text-center mb-8 max-w-sm">Sign up to receive an exclusive early booking invitation for our new Varanasi branch opening soon.</p>

                    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#eb4b55] focus:border-transparent outline-none transition-all shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#eb4b55] hover:bg-[#d43c46] text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-red-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                        >
                            Notify Me
                        </button>
                    </form> 
                </div>
            </div>
        </div>
    );
};

export default VaranasiLaunchCard;