import React, { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2';

export default function BtsTape() {
    const btsTapeRef = useRef();
    const scrollValue = useRef(0);
    const [btsImageUrl, setBtsImageUrl] = useState([])

    useEffect(() => {
        const handleScroll = (e) => {
            const scrollWrapper = btsTapeRef.current;
            if (scrollWrapper) {
                if (e.deltaY > 0) {
                    // page scroll down  
                    if (scrollWrapper.style) {
                        scrollWrapper.style.transform = `translateX(${scrollValue.current}px)`
                        scrollValue.current = scrollValue.current + 10;
                        // get width of wrapper if scroll right value >= width than set scroll value to 0
                        if (scrollWrapper.getBoundingClientRect().width) {
                            const { width } = scrollWrapper.getBoundingClientRect();
                            if (scrollWrapper.current >= width) {
                                scrollWrapper.current = 0;
                            }
                        }
                    }
                }
                else {
                    // page scroll up
                    if (scrollWrapper.style) {
                        scrollWrapper.style.transform = `translateX(-${scrollValue.current}px)`
                        scrollValue.current = scrollValue.current - 10;
                        // get width of wrapper if scroll right value >= width than set scroll value to 0
                        if (scrollWrapper.getBoundingClientRect().width) {
                            const { width } = scrollWrapper.getBoundingClientRect();
                            if (scrollWrapper.current >= width) {
                                scrollWrapper.current = 0;
                            }
                        }
                    }
                }
            }
        };
        // Attach scroll listener
        window.addEventListener("wheel", handleScroll);

        return () => {
            // Cleanup listener on component unmount
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const fetchBtsImage = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/homepage/bts-image");
            const data = await res.json()
            if (res.status >= 300) {
                return Swal.fire({
                    title: "Error!",
                    text: data.message,
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }
            setBtsImageUrl(data.btsUrls)
        } catch (error) {
            console.log(error)
            return Swal.fire({
                title: "Error!",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#d33"
            });
        }
    }
    useEffect(() => {
        fetchBtsImage();
    }, [])
    return (
        <>
            <div className="bts-text-content flex flex-col items-center gap-1 lg:mt-20 mb-10 sm:mt-0 px-4">
                <h1 className='text-primary lg:text-desktopBodyLarge font-medium text-center md:text-mobileHeadlineSmall sm:text-mobileBodyLarge '>Behind Every Beautiful Shot is a Dedicated Team</h1>
            </div>
            <div className="bts-image   bg-tertiary p-2 transform -rotate-2 ">
                <div className="bts-wrapper flex justify-center gap-2 px-4 overflow-hidden transition-transform duration-100">
                    <div ref={btsTapeRef} className="flex justify-center gap-2 px-4">
                        {
                            btsImageUrl.length ?
                                btsImageUrl.map((btsUrl) => (
                                    <div key={btsUrl.key} className="flex-none lg:w-72 lg:h-56  sm:w-52 sm:h-36 overflow-hidden  ">
                                        <img className='w-full h-full rounded-xl' src={btsUrl.url} alt="bts-image" />
                                    </div>
                                ))
                                :
                                <div className="">No Bts Image</div>
                        }
                    </div>

                </div>

            </div>
        </>
    )
}
