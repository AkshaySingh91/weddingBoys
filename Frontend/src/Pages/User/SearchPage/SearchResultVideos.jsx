import React from 'react'
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import NoSearchResult from "../../../Asset/NoSearchResult.png"

function SearchResultVideos({ loading, videos, fetchMoreVideos, hasMoreVideos }) {
    return (
        <>
            <p className="py-2 px-4">
                <span className="text-xl font-bold px-2"> {Number(videos.length).toLocaleString()}</span>
                <span className="">(total videos)</span>
            </p>
            {
                loading ? [...Array(8)].map((_, i) => (<VideoSkeletonLoader key={i} />)) :
                    <div className='w-full flex-shrink-0 transition-transform duration-200'>
                        <InfiniteScroll
                            style={{ width: '100%' }} // Assuming you're using flex layout
                            dataLength={videos.length}
                            next={fetchMoreVideos}
                            hasMore={hasMoreVideos}
                            loader={[...Array(8)].map((_, i) => (<VideoSkeletonLoader key={i} />))}>
                            <div className="video-panel flex-shrink-0 grid sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 mt-6">

                                {
                                    videos.length ?
                                        videos.map((video, index) => (
                                            <Link key={index} to={`/films/${video._id}`}>
                                                <div className="shadow-md">
                                                    <div className="thumbnail lg:h-64">
                                                        <img
                                                            src={video.thumbnailMetaData.url}
                                                            alt="Video Thumbnail"
                                                            className="w-full h-full object-cover rounded-xl" />
                                                    </div>
                                                    <div className="text-container py-4 px-2 flex flex-col items-start space-y-2">
                                                        <div className="header flex gap-4 text-sm font-semibold">
                                                            <p className="date uppercase">
                                                                {video.videoShootDate}
                                                            </p>
                                                            <svg
                                                                className="lg:w-6 lg:h-6 sm:w-4 sm:h-4"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 -960 960 960"
                                                                fill="black">
                                                                <path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" />
                                                            </svg>
                                                            <p className="location uppercase">
                                                                {video.videoLocation ? video.videoLocation.city : ""}
                                                            </p>
                                                        </div>
                                                        <div className="name uppercase text-xl">
                                                            <p className="font-semibold">
                                                                {video.clientName.Bride} & {video.clientName.Groom}
                                                            </p>
                                                        </div>
                                                        <div className="tags w-full flex flex-wrap gap-2">
                                                            {(video.tags && video.tags.length) ?
                                                                video.tags.map((t, i) => (
                                                                    <div key={i} className="tag text-nowrap px-2 py-1 rounded-full bg-gray-100 border-[1px] border-slate-500">{t}</div>
                                                                ))
                                                                : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )) : null
                                }
                            </div>
                            {
                                !videos.length &&
                                <div className="w-full h-auto">
                                    <div className="flex items-start justify-center min-h-screen">
                                        <div className="text-center">
                                            <img src={NoSearchResult} alt="No Results" className="w-52 h-52 mx-auto mb-3 opacity-75 object-cover bg-center" />
                                            <h2 className="text-2xl font-semibold text-gray-700">No Videos Found</h2>
                                            <p className="text-gray-500 mt-2">We couldn't find anything matching your search.</p>
                                        </div>
                                    </div>
                                </div>
                            }
                        </InfiniteScroll>
                    </div>
            }
        </>
    )
}

const VideoSkeletonLoader = () => (
    <div className="animate-pulse bg-slate-200 lg:h-80 max-w-full w-80 mx-2 relative my-9 sm:h-80 sm:w-80 sm:flex-none rounded-3xl">
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
export default SearchResultVideos
