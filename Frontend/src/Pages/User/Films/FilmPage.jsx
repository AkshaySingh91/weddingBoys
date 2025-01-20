import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup';
import NoSearchResult from "../../../Asset/NoSearchResult.png"
const api_url = process.env.REACT_APP_API_URL;

function FilmPage() {
    const [allVideos, setAllVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const fetchVideos = async (t) => {
        try {
            const res = await fetch(`${api_url}/api/videos?tag=${t}&page=1&limit=10`)
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            return data.client
        } catch (error) {
            console.log(error)
            return fireMessage(error.message, 'error')
        }
    }
    useEffect(() => {
        const fetchFilmPageTags = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`${api_url}/api/filmpage/tags`)
                const data = await res.json();
                if (res.status >= 300 || !data.tags) {
                    return fireMessage(data.message, 'error')
                }
                if (data.tags.length > 0) {
                    // now we have multiple tags we have to fetch all videos 
                    const allVideos = [];
                    for (const tag of data.tags) {
                        const videos = await fetchVideos(tag);
                        allVideos.push({
                            tagName: tag, videos
                        })
                    }
                    setAllVideos(allVideos);
                }
            } catch (error) {
                return fireMessage(error.message, 'error')
            } finally {
                setIsLoading(false)
            }
        }
        fetchFilmPageTags();
    }, [])

    return (<>

        <div className="header py-6 mx-auto sm:mb-4 text-desktopHeadlineSmall opacity-70">
            <h1 className='whitespace-nowrap mb-2 text-center mx-auto'>Ankit studios Films</h1>
            <hr className='bg-gray-500 w-20 mx-auto' />
        </div>
        <div className="films-category-wrapper box-border  space-y-10">
            {isLoading ?
                [...Array(3)].map((_, i) => (
                    <div key={i} className="our-favourite px-2 lg:my-12">
                        <div className="category-name text-desktopBodyLarge font-[500] tracking-wide flex flex-col items-center space-y-4">
                            <div className=" w-full flex justify-between px-4">
                                <h2 className="w-20 h-5 bg-slate-400 rounded-full" aria-hidden="true" ></h2>
                                <button className='w-12 h-5 bg-slate-400 border-[1px] border-slate-600  rounded-3xl px-3 py-1 mx-2 '></button>
                            </div>
                            <div className="top-films w-full overflow-x-auto scrollbar-none lg:px-4  bg-[#f9efe4] " role='list'>
                                <div role='listitem' className="movies flex gap-4">
                                    {[...Array(3)].map((_, i) => (
                                        <VideoSkeletonLoader key={i} />
                                    ))}
                                </div>
                            </div>
                        </div >
                    </div>
                )) :

                (allVideos.length ? (
                    allVideos.map((filmsRow) => {
                        return <div key={filmsRow.tagName} className="our-favourite px-2 lg:my-12 space-y-4">
                            <div className="category-name text-desktopBodyLarge font-[500] tracking-wide flex justify-between items-center">
                                <h2 className="lg:px-4 tracking-wider lg:text-desktopHeadlineSmall sm:text-mobileHeadlineMedium">{filmsRow.tagName}</h2>
                                <Link to={`/allfilms`} className='text-desktopBodySmall border-[1px] border-slate-600 bg-tertiary rounded-3xl px-3 py-1 mx-2 text-white'>view all</Link>
                            </div>
                            <div className="top-films w-full overflow-x-auto scrollbar-none lg:px-4 py-4 bg-[#f9efe4] " role='list'>
                                <div role='listitem' className="movies flex gap-4">
                                    {
                                        filmsRow.videos && filmsRow.videos.length ?
                                            filmsRow.videos.map((video) => (
                                                <Link key={video.videos._id} to={`/films/${video.videos._id}`} className=' flex flex-col lg:gap-3 sm:gap-4'>
                                                    <div className="relative thumbnail lg:w-56 lg:h-40 sm:w-60 sm:h-[10rem]">
                                                        <img className='object-cover rounded-xl w-full h-full'
                                                            src={video.thumbnailUrl} alt="" />
                                                        <button className="play-btn absolute top-[45%] left-[45%] bg-gray-400 text-gray-800 rounded-full shadow-md hover:bg-gray-400 drop-shadow-lg ">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth="2"
                                                                stroke="currentColor"
                                                                className="lg:w-10 lg:h-10 sm:w-8 sm:h-8">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.197-2.42A1 1 0 009 9.5v5a1 1 0 001.555.832l4.197-2.42a1 1 0 000-1.664z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="text-primary flex flex-col lg:gap-2 sm:gap-1 px-2">
                                                        <div className="flex items-center lg:text-desktopBodySmall uppercase  tracking-wide sm:text-mobileBodyMedium whitespace-nowrap font-bold">
                                                            <span>{video.videos.videoShootDate}</span>
                                                            <svg className='lg:w-8 lg:h-8 sm:w-4 sm:h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                                                            <span>{video.videos.videoLocation.city}</span>
                                                        </div>
                                                        <div className="flex gap-2 lg:text-[1.3rem] font-semibold sm:text-mobileBodyLarge whitespace-nowrap">
                                                            <span>{video.clientName.Bride}</span>
                                                            <span>&</span>
                                                            <span>{video.clientName.Groom}</span>
                                                        </div>
                                                    </div>

                                                </Link>
                                            )) :
                                            <div className="">No Video In this Category</div>
                                    }
                                </div>
                            </div>
                        </div >
                    })
                ) : <div className="w-full h-auto">
                    <div className="flex items-start justify-center min-h-screen">
                        <div className="text-center">
                            <img src={NoSearchResult} alt="No Results" className="w-52 h-52 mx-auto mb-3 opacity-75 object-cover bg-center" />
                            <h2 className="text-2xl font-semibold text-gray-700">No Videos Found</h2>
                            <p className="text-gray-500 mt-2">We couldn't find anything matching your search.</p>
                        </div>
                    </div>
                </div>)
            }
        </div >
    </>)
}


const VideoSkeletonLoader = () => (
    <div className="animate-pulse bg-slate-200 lg:h-70 max-w-full w-70 mx-2 relative my-9 sm:h-52 sm:w-60 sm:flex-none rounded-3xl">
        <div className="relative h-full overflow-hidden">
            <div className="w-full h-full rounded-3xl bg-slate-300"></div>
            <div className="absolute bottom-6 left-6 text-white flex flex-col gap-0">
                <div className="flex items-center text-desktopBodySmall uppercase font-semibold tracking-wide">
                    <div className="inline-block animate-pulse w-28 h-4 rounded-lg bg-slate-400 mr-2 my-4"></div>
                    <div className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></div>
                </div>
                <div className="flex gap-2 text-desktopBodyMedium font-bold">
                    <div className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></div>
                    <div className="inline-block animate-pulse w-10 h-4 rounded-lg bg-slate-400"></div>
                </div>
            </div>
        </div>
    </div>
);
export default FilmPage
