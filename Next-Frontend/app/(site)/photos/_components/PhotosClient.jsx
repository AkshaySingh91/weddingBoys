'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import Swal from "sweetalert2";
import InfiniteScroll from 'react-infinite-scroll-component';
import { PhotoSkeletonLoader } from './PhotoSkeletonLoader.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const AllPhotos = () => {
    const [photos, setPhotos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const maxVisibleTags = 3;
    const [loadedImages, setLoadedImages] = useState({});
    const limit = 10;

    const fetchPhotos = useCallback(
        async () => {
            try {
                const response = await fetch(`${api_url}/api/photos?page=${page}&limit=${limit}`)
                const data = await response.json()
                if (response.status >= 300 || !data.photos) {
                    Swal.fire({
                        toast: true,
                        position: 'top-right',
                        iconColor: 'white',
                        customClass: {
                            popup: 'colored-toast',
                        },
                        showConfirmButton: false,
                        timer: 1500,
                        timerProgressBar: true,
                        icon: 'error',
                        title: data.message
                    })
                }
                const newPhotos = data.photos;
                if (newPhotos.length === 0) {
                    setHasMore(false); // Stop fetching if no more photos
                } else {
                    setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
                    setPage((prevPage) => prevPage + 1);
                }
            } catch (error) {
                Swal.fire({
                    toast: true,
                    position: 'top-right',
                    iconColor: 'white',
                    customClass: {
                        popup: 'colored-toast',
                    },
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                    icon: 'error',
                    title: error.message
                })
            }
        }, [page, limit]);
    useEffect(() => {
        // Fetch images from the backend
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPhotos();
    }, [fetchPhotos]);
    const getGridRowSpan = (index) => {
        return index % 5 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
    };
    const handleImageLoad = (id) => {
        setLoadedImages((prev) => ({ ...prev, [id]: true }));
    };

    return (<>
        <InfiniteScroll
            dataLength={photos.length}
            next={fetchPhotos}
            hasMore={hasMore}
            loader={
                <div className="grid-container">
                    {Array.from({ length: 5 }).map((_, index) => {
                        return <PhotoSkeletonLoader key={index} />
                    })}
                </div>
            }
            endMessage={<h2 className="text-center font-bold text-xl tracking-widest my-4 mx-auto">YOU HAVE REACH THE END !</h2>}>
            <div className="masonry">
                <div className="grid-container">
                    {photos.map((photo, i) => {
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
                                            {!loadedImages[photo._id] && <PhotoSkeletonLoader />}
                                            <img
                                                src={photo.url}
                                                alt="Client"
                                                className="object-cover w-full h-full rounded-md"
                                                loading="lazy" // Lazy load images
                                                onLoad={() => handleImageLoad(photo._id)}
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

    </ >)
};

export default AllPhotos;
