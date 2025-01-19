import React from 'react'
import facebookLogo from '../Asset/facebookLogo.svg'
import instagramLogo from '../Asset/instagramLogo.svg'
import twitterLogo from '../Asset/twitterLogo.svg'
import youtubeLogo from '../Asset/youtubeLogo.svg'
import { useStudioDetails } from '../Context/StudioDetailsContext'
import { Link } from "react-router-dom"

export default function Footer() {
    const { studioName, studioLogo, studioAddress, studioContact, studioEmail, studioSocials } = useStudioDetails();
    return (<>
        <footer className="w-full bg-tertiary text-[#fcebd1] mt-20 rounded-t-[5rem] lg:rounded-t-[5rem] sm:rounded-t-3xl">
            <div className="w-full mx-auto px-6 py-6 flex flex-col gap-6">
                {/* Logo & Contact Section */}
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden">
                        <img src={studioLogo || "https://placehold.jp/250x50.png"} alt="studio-logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="lg:grid lg:grid-cols-3  sm:flex sm:flex-col  gap-4 p-2 sm:bg-[#85848440] sm:rounded-3xl sm:shadow-md sm:backdrop-blur-sm min-h-50 items-center sm:py-4">
                        {['Phone', 'Address', 'Email'].map((label, index) => (
                            <div key={index} className="flex flex-col items-center gap-3">
                                <h3 className="font-bold text-mobileBodyMedium">{label}</h3>
                                <p>{[studioContact?.[0], studioAddress, studioEmail][index] || <span className="animate-pulse bg-slate-400 rounded-xl w-24 h-6" />}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Social Links Section */}
                <div className="flex flex-col items-center gap-4 ">
                    <h2 className="font-bold text-mobileBodyMedium">Social</h2>
                    <div className="flex gap-4">
                        {[studioSocials?.instagram, studioSocials?.facebook, studioSocials?.youtube, studioSocials?.x].map((link, index) => (
                            <Link key={index} to={link || "#"} target="_blank">
                                <img src={[instagramLogo, facebookLogo, youtubeLogo, twitterLogo][index]} alt="Social Icon" className="w-8 h-8 sm:w-10 sm:h-10" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enquire Button */}
            <div className="flex justify-center my-4 ">
                <Link to="/contact" className="group flex items-center bg-[#f7dcb2] text-black px-4 py-2 rounded-3xl transition-transform hover:translate-x-2">
                    <span>Enquire Now</span>
                    <svg className="w-6 h-6 ml-2 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black">
                        <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
                    </svg>
                </Link>
            </div>

            {/* Footer Note */}
            <div className="text-center px-8 text-sm lg:text-desktopBodySmall sm:pb-24 md:pb-10">
                © 2024 - {studioName || "Ankit Studios"} | All Rights Reserved.
            </div>
        </footer>


    </>)
}
