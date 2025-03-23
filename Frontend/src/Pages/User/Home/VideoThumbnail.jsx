import React, { useCallback } from 'react'
import { useState, useEffect } from 'react';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup';
import { Link } from 'react-router-dom';
const api_url = process.env.REACT_APP_API_URL;

export default function VideoThumbnail() {
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState([])
    const [homepageTags, setHomepageTags] = useState([])
    const [selectedTag, setSelectedTag] = useState("");

    const fetchVideos = async (t) => {
        try {
            setIsLoading(true)
            const res = await fetch(`${api_url}/api/videos?tag=${t}`)
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            setClients(data.client)
        } catch (error) {
            console.log(error)
            return fireMessage(error.message, 'error')
        } finally {
            setIsLoading(false)
        }
    }
    const fetchHomeTags = useCallback(
        async () => {
            try {
                setIsLoading(true)
                const res = await fetch(`${api_url}/api/homepage/tags`)
                const data = await res.json();
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error')
                }
                setHomepageTags(data.tags)
                if (data.tags.length > 0) {
                    await fetchVideos(data.tags[0]);
                    setSelectedTag(data.tags[0])
                }
            } catch (error) {
                return fireMessage(error.message, 'error')
            } finally {
                setIsLoading(false)
            }
        }, []);

    useEffect(() => {
        fetchHomeTags();    //it is tag that are selected 
    }, [fetchHomeTags])

    const handleChangeTag = (t) => {
        setSelectedTag(t);
        fetchVideos(t)
    }
    return (<>
        <Link to="/films">
            <h1 className="inline-block lg:mb-6 sm:mb-4 sm:w-full sm:text-center lg:text-left px-4 py-0 lg:text-desktopHeadlineSmall transition-all delay-700 duration-75 lg:hover:underline sm:py-4 sm:text-desktopBodyLarge tracking-wider">Our Films
                <hr className='lg:hidden mx-auto border-[1px] w-8 border-slate-300' />
            </h1>
        </Link>
        <div className="flex gap-3 lg:justify-center sm:justify-start w-full sm:overflow-x-auto scrollbar-none sm:pl-2 my-4">
            {
                isLoading ?
                    [...Array(3)].map((_, i) => (
                        <div key={i}><TagSkeletonLoader /></div>
                    )) :
                    homepageTags.length ?
                        homepageTags.map((t) => (
                            <button key={t}
                                className={`px-4 py-1 text-nowrap text-desktopBodySmall rounded-3xl border-2 border-[#f5ac38]  hover:bg-[#ffbb7c] ${selectedTag === t ? "bg-[#ffbb7c]" : " bg-secondary"} sm:text-mobileBodySmall`}
                                onClick={() => handleChangeTag(t)}
                            ><span>{t}</span></button>
                        )) : null
            }
        </div>

        <div className="w-full flex gap-2 overflow-x-auto scrollbar-none transition-all duration-150">
            {isLoading ? (
                [...Array(3)].map((_, i) => <VideoSkeletonLoader key={i} />)
            ) : clients && clients.length ? (
                clients.map((c) => (
                    <Link className='' to={`/films/${c.videos._id}`} key={c.videos._id}>
                        <div className="lg:h-[26rem] lg:w-[26rem] relative sm:h-80 sm:w-[18rem] sm:flex-none">
                            <div className="relative h-full overflow-hidden ">
                                {/* Video Thumbnail */}
                                <img
                                    className="w-full h-full rounded-3xl bg-no-repeat object-cover"
                                    src={c.thumbnailUrl}
                                    alt="video-thumbnail"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent rounded-b-3xl"></div>
                                {/* Text Content */}
                                <div className="absolute sm:bottom-5 sm:left-5 md:bottom-6 md:left-6 text-white flex flex-col gap-0 z-10">
                                    <div className="flex items-center gap-2 sm:text-desktopBodyMedium lg:text-desktopBodyLarge uppercase font-semibold tracking-wide">
                                        <span className='text-nowrap'>{c.videos.videoShootDate}</span>
                                        <svg
                                            className="lg:w-6 lg:h-6 sm:w-4 sm:h-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 -960 960 960"
                                            fill="white">
                                            <path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" />
                                        </svg>
                                        <span>{c.videos.videoLocation.city}</span>
                                    </div>
                                    <div className="flex gap-2 sm:text-mobileBodySmall lg:text-mobileHeadlineSmall text-white uppercase tracking-wide">
                                        <span>{c.clientName.Bride}</span>
                                        <span>&</span>
                                        <span>{c.clientName.Groom}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))
            ) : (
                <p>No videos found</p>
            )}
        </div>


    </>)
}

const VideoSkeletonLoader = () => (
    <div className="animate-pulse bg-slate-200 lg:h-80 lg:w-1/3 relative my-9 sm:h-80 sm:w-80 sm:flex-none rounded-3xl">
        <div className="relative h-full overflow-hidden">
            <div className="w-full h-full rounded-3xl bg-slate-300"></div>
            <div className="absolute bottom-6 left-6 text-white flex flex-col gap-0">
                <div className="flex items-center text-desktopBodySmall uppercase font-semibold tracking-wide">
                    <span className="inline-block animate-pulse w-28 h-4 rounded-lg bg-slate-400 mr-2 my-4"></span>
                    <span className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></span>
                </div>
                <div className="flex gap-2 text-desktopBodyMedium font-bold">
                    <span className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></span>
                    <span className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></span>
                </div>
            </div>
        </div>
    </div>
);
const TagSkeletonLoader = () => (
    <div className="flex gap-3 lg:justify-center sm:justify-start w-full sm:overflow-x-auto scrollbar-none sm:pl-2">
        <button className={`px-4 py-1 rounded-3xl`} >
            <span className="inline-block animate-pulse w-20 h-6 rounded-xl bg-slate-400"></span>
        </button>
    </div>
)