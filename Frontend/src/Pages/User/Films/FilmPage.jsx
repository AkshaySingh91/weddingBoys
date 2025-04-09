import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup';
import NoSearchResult from "../../../Asset/NoSearchResult.png";
const api_url = process.env.REACT_APP_API_URL;

function FilmPage() {
    const [allVideos, setAllVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVideos = async (tag) => {
        try {
            const res = await fetch(`${api_url}/api/videos?tag=${tag}&page=1&limit=10`);
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error');
            }
            return data.client;
        } catch (error) {
            console.log(error);
            return fireMessage(error.message, 'error');
        }
    };

    useEffect(() => {
        const fetchFilmPageTags = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${api_url}/api/filmpage/tags`);
                const data = await res.json();
                if (res.status >= 300 || !data.tags) {
                    return fireMessage(data.message, 'error');
                }
                if (data.tags.length > 0) {
                    const videosData = [];
                    for (const tag of data.tags) {
                        const videos = await fetchVideos(tag);
                        videosData.push({ tagName: tag, videos });
                    }
                    setAllVideos(videosData);
                }
            } catch (error) {
                fireMessage(error.message, 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFilmPageTags();
    }, []);

    return (
        <>
            {/* Page Header */}
            <div className="py-6 text-center">
                <h1 className="text-lg sm:text-xl lg:text-3xl font-extrabold text-gray-800 tracking-wide mb-4">
                    Wedding Boys Films
                </h1>
                <hr className="w-16 sm:w-20 lg:w-24 mx-auto border-gray-400" />
            </div>

            <div className="films-category-wrapper space-y-8 sm:space-y-10 lg:space-y-12">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="px-4 lg:my-12">
                            <div className="flex justify-between items-center mb-4">
                                <div className="w-20 sm:w-28 h-5 bg-slate-300 rounded-full animate-pulse" aria-hidden="true"></div>
                                <button className="w-12 sm:w-16 h-5 bg-slate-300 border border-slate-500 rounded-full animate-pulse"></button>
                            </div>
                            <div className="overflow-x-auto scrollbar-none bg-[#f9efe4] p-2 sm:p-4 rounded-xl">
                                <div className="flex gap-2 sm:gap-4">
                                    {[...Array(3)].map((_, j) => (
                                        <VideoSkeletonLoader key={j} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : allVideos.length ? (
                    allVideos.map((filmsRow) => (
                        <div key={filmsRow.tagName} className="px-4 lg:my-12 space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide text-gray-700">
                                    {filmsRow.tagName}
                                </h2>
                                <Link
                                    to={`/allfilms`}
                                    className="text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-1 sm:py-2 bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-full shadow-md hover:shadow-lg transition-all"
                                >
                                    View All
                                </Link>
                            </div>
                            <div className="overflow-x-auto scrollbar-none bg-[#f9efe4] p-2 sm:p-4 rounded-xl">
                                <div className="flex gap-2 sm:gap-4">
                                    {filmsRow.videos && filmsRow.videos.length ? (
                                        filmsRow.videos.map((video) => (
                                            <Link
                                                key={video.videos._id}
                                                to={`/films/${video.videos._id}`}
                                                className="flex flex-col flex-shrink-0 gap-1 sm:gap-2 lg:gap-3 w-50 sm:w-52 lg:w-72 hover:scale-105 transition-transform duration-300"
                                            >
                                                <div className="relative rounded-xl overflow-hidden shadow-md">
                                                    <img
                                                        className="object-cover w-full  h-32 sm:h-40 lg:h-48 rounded-xl"
                                                        src={video.thumbnailUrl}
                                                        alt="Video Thumbnail"
                                                    />
                                                    <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                            className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-4.197-2.42A1 1 0 009 9.5v5a1 1 0 001.555.832l4.197-2.42a1 1 0 000-1.664z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="text-gray-800 flex flex-col gap-1">
                                                    <div className="flex items-center uppercase font-bold text-[0.65rem] sm:text-xs lg:text-sm">
                                                        <span className="text-nowrap">{video.videos.videoShootDate}</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" className="w-4 h-4 mx-1">
                                                            <path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" />
                                                        </svg>
                                                        <span className="text-nowrap">{video.videos.videoLocation.city}</span>
                                                    </div>
                                                    <div className="flex gap-1 sm:gap-2 font-semibold text-[0.75rem] sm:text-base lg:text-lg">
                                                        <span className="text-nowrap">{video.clientName.Bride}</span>
                                                        <span>&</span>
                                                        <span className="text-nowrap">{video.clientName.Groom}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-gray-600 text-center w-full">
                                            No Video In This Category
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="w-full flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <img
                                src={NoSearchResult}
                                alt="No Results"
                                className="w-32 sm:w-40 lg:w-52 h-32 sm:h-40 lg:h-52 mx-auto mb-3 opacity-75 object-cover"
                            />
                            <h2 className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-700">No Videos Found</h2>
                            <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2">
                                We couldn't find anything matching your search.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

const VideoSkeletonLoader = () => (
    <div className="animate-pulse bg-slate-200 h-40 sm:h-44 lg:h-52 w-40 sm:w-48 lg:w-56 mx-2 my-6 rounded-3xl">
        <div className="relative h-full overflow-hidden">
            <div className="w-full h-40 sm:h-44 lg:h-52 rounded-3xl bg-slate-300"></div>
            <div className="absolute bottom-6 left-6 flex flex-col gap-1">
                <div className="w-24 sm:w-28 h-4 rounded-lg bg-slate-400"></div>
                <div className="w-12 sm:w-16 h-4 rounded-lg bg-slate-400"></div>
            </div>
        </div>
    </div>
);

export default FilmPage;
