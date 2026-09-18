'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import InfiniteScroll from 'react-infinite-scroll-component';
import NoSearchResult from '@/Asset/NoSearchResult.png';

function SearchResultPhoto({ loading, photos, fetchMorePhotos, hasMorePhotos }) {

    const skeletonColors = ["cb997e", "76c893", "eddcd2", "fff1e6", "f0efeb", "f8ad9d", "ddbea9", "a5a58d", "b7b7a4", "ffe5d9", "caf0f8", "d4a373", "ffb5a7", "fcd5ce", "ced4da", "4361ee"]
    // Cycles deterministically by index rather than Math.random() during
    // render — avoids the SSR hydration mismatch the random version had,
    // while still giving skeleton tiles varied colors.
    const getSkeletonColor = (index) => `#${skeletonColors[index % skeletonColors.length]}`
    const getGridRowSpan = (index) => {
        return index % 5 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
    };

    return (
        <>
            <p className="py-2 px-4">
                <span className="text-xl font-bold px-2"> {Number(photos.length).toLocaleString()}</span>
                <span className="">(total photos)</span>
            </p>
            <div className="photo-panel">
                {
                    loading ? Array.from({ length: 8 }).map((_, i) => (<PhotoSkeletonLoader bgColor={getSkeletonColor(i)} key={i} />)) :
                        <InfiniteScroll
                            dataLength={photos.length}
                            next={fetchMorePhotos}
                            hasMore={hasMorePhotos}
                            loader={
                                <div className="grid-container">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        return <PhotoSkeletonLoader key={index} bgColor={getSkeletonColor(index)} />
                                    })}
                                </div>
                            }>
                            <div className="masonry">
                                <div className="grid-container">
                                    {photos.map((photo, i) => {
                                        const maxVisibleTags = 3;
                                        const visibleTags = photo.tags.slice(0, maxVisibleTags); // Tags to display
                                        const hiddenTagCount = photo.tags.length - maxVisibleTags; // Number of hidden tags
                                        return (
                                            <div
                                                key={i}
                                                style={{ gridRow: `span ${getGridRowSpan(i)}` }}
                                                className="relative">
                                                <Link href={`/photos/${photo._id}`}>
                                                    <div className="wrapper flex flex-col h-full w-full gap-2 py-2 px-2  backdrop-blur-sm border-[1px] border-slate-300 rounded-md bg-[#e9e9e4]">
                                                        <div className="w-full h-auto flex-grow">
                                                            <img
                                                                src={photo.photoMetaData.url}
                                                                alt="Client"
                                                                className="object-cover w-full h-full rounded-md"
                                                                loading="lazy" // Lazy load images
                                                            />
                                                        </div>
                                                        <div className="tags flex flex-wrap gap-2">
                                                            {visibleTags.map((tag, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="bg-[#fef4ee] border rounded-full text-center border-gray-300 px-3 py-1 text-sm tracking-wider">
                                                                    {tag}
                                                                </div>
                                                            ))}
                                                            {hiddenTagCount > 0 && (
                                                                <div className="bg-slate-300 border rounded-full text-center border-gray-400 px-3 py-1 text-sm tracking-wider">
                                                                    +{hiddenTagCount} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </InfiniteScroll>
                }
                {
                    !photos.length &&
                    <div className="w-full h-auto">
                        <div className="flex items-start justify-center min-h-screen">
                            <div className="text-center">
                                <Image src={NoSearchResult} alt="No Results" className="w-52 h-52 mx-auto mb-3 opacity-75 object-cover bg-center" />
                                <h2 className="text-2xl font-semibold text-gray-700">No Photos Found</h2>
                                <p className="text-gray-500 mt-2">We couldn&apos;t find anything matching your search.</p>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </>
    )
}

const PhotoSkeletonLoader = ({ bgColor }) => {
    // Height was originally randomized inline during render, which produces
    // a server/client hydration mismatch under Next.js SSR (Math.random()
    // during render). Default to a fixed height for the first render and
    // randomize post-mount only, matching the fix pattern used in
    // Component/Background.jsx and app/(site)/photos/page.jsx.
    const [height, setHeight] = useState(350);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHeight(Math.floor(Math.random() * (450 - 300 + 1)) + 300);
    }, []);

    return (
    <div className="relative animate-pulse rounded-3xl w-full"
        style={{
            height: `${height}px`,
            backgroundColor: bgColor,
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
            backgroundSize: '40px 40px'
        }}>
        <div className={`w-full h-full rounded-lg  bg-[${bgColor}]`}></div>
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
    )
}
export default SearchResultPhoto
