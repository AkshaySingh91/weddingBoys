import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom'
import Swal from "sweetalert2"
import InfiniteScroll from 'react-infinite-scroll-component';
import './allPhotoMasonry.css'


const AllPhotos = () => {
    const [photos, setPhotos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const maxVisibleTags = useState(3);
    const [loadedImages, setLoadedImages] = useState({});
    const limit = 10;

    const fetchPhotos = useCallback(
        async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/photos?page=${page}&limit=${limit}`)
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
        fetchPhotos();
    }, [fetchPhotos]);
    const getGridRowSpan = (index) => {
        return index % 5 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
    };
    const handleImageLoad = (id) => {
        setLoadedImages((prev) => ({ ...prev, [id]: true }));
    };

    const skeletonColors = ["cb997e", "76c893", "eddcd2", "fff1e6", "f0efeb", "f8ad9d", "ddbea9", "a5a58d", "b7b7a4", "ffe5d9", "caf0f8", "d4a373", "ffb5a7", "fcd5ce", "ced4da", "4361ee"]
    const getRandomColor = () => {
        return `#${skeletonColors[Math.floor(Math.random() * (skeletonColors.length - 0)) + 0]}`
    }
    return (<>
        <InfiniteScroll
            dataLength={photos.length}
            next={fetchPhotos}
            hasMore={hasMore}
            loader={
                <grid-container>
                    {Array.from({ length: 5 }).map((_, index) => {
                        return <PhotoSkeletonLoader key={index} bgColor={getRandomColor()} />
                    })}
                </grid-container>
            }
            endMessage={<h2 className="text-center font-bold text-xl tracking-widest my-4 mx-auto">YOU HAVE REACH THE END !</h2>}>
            <div className="masonry">
                <grid-container>
                    {photos.map((photo, i) => {
                        const visibleTags = photo.tags.slice(0, maxVisibleTags); // Tags to display
                        const hiddenTagCount = photo.tags.length - maxVisibleTags; // Number of hidden tags 
                        return (
                            <div
                                key={i}
                                style={{ gridRow: `span ${getGridRowSpan(i)}` }}
                                className="relative">
                                <Link to={`/photos/${photo._id}`}>
                                    <div className="wrapper flex flex-col h-full w-full gap-2 py-2 px-2  backdrop-blur-sm border-[1px] border-slate-300 rounded-md bg-[#e9e9e4]">
                                        <div className="w-full h-auto flex-grow">
                                            {!loadedImages[photo._id] && <PhotoSkeletonLoader bgColor={getRandomColor()} />}
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
                </grid-container>
            </div>
        </InfiniteScroll>

    </ >)
};

export const PhotoSkeletonLoader = ({ bgColor }) => (
    <div className="relative animate-pulse rounded-3xl w-full"
        style={{
            height: `${Math.floor(Math.random() * (450 - 300 + 1)) + 300}px`,
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

export default AllPhotos;
