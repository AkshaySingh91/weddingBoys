import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header() {
    const [searchPlaceholder, setSearchPlaceholder] = useState('Search films here..');
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 500) {
                setSearchPlaceholder('Films');
            } else {
                setSearchPlaceholder('Search films here..');
            }
        };
        handleResize(); // Set initial placeholder
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSearch = (e) => {
        if (e.key === "Enter" && searchQuery.trim() !== "") {
            navigate(`/search-result?query=${searchQuery}`);
        }
    };
    return (
        <>
            <div className="sm:hidden lg:block relative header-wrapper flex lg:py-2  sm:px-4 sm:pt-4 bg-primary_on rounded-t-2xl item-center sm:gap-4 sm:py-2">
                <div className="flex md:pr-5  lg:gap-8  justify-between sm:h-12 sm:flex-auto sm:my-auto sm:gap-2 ">
                    <div className="flex sm:flex-auto lg:w-auto  items-center bg-[#e0c7a9] rounded-3xl gap-2 sm:basis-1/5 border-2 border-red-200 lg:h-9 my-auto px-2 sm:h-10 sm:w-24">
                        <svg className='flex-none lg:w-6 lg:h-6 sm:w-8 sm:h-8' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            className='flex-auto basis-3/4 text-sm font-primary tracking-wider  text-primary bg-transparent lg:placeholder:text-desktopBodySmall sm:placeholder:text-mobileBodyLarge placeholder:text-primary placeholder:opacity-60 rounded-2xl outline-none'
                            type="text" placeholder={searchPlaceholder}
                            onKeyDown={handleSearch}
                            spellCheck="false"
                            onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    <Link className="enquire-btn group flex justify-center  items-center gap-1 bg-secondary rounded-3xl px-4 py-1 text-mobileBodyMedium text-primary lg:w-30 lg:h-9 my-auto sm:h-10" to={"/contact"}>
                        <span className='whitespace-nowrap tracking-wide'>Get Quote</span>
                        <svg className='transition-all group-hover:translate-x-2 flex-none lg:w-6 lg:h-6 sm:w-5 sm:h-4 text-blue-300 fill-slate-700' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" /></svg>
                    </Link>
                </div>
            </div>
        </>
    )
}




