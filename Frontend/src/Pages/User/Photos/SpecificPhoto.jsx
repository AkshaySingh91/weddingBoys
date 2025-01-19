import React, { useCallback } from 'react'
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link} from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup'
import "../SearchPage/Masonry.css"
import gmailLogo from '../../../Asset/gmailShareLogo.svg'
import { PhotoSkeletonLoader } from './AllPhotos';

function SpecificPhoto() {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [clientName, setClientName] = useState({ bride: "", groom: "" });
    const [remainingPhotos, setRemaningPhotos] = useState([]);
    const [recommendation, setRecommendation] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [isShareComponentOpen, setIsShareComponentOpen] = useState(false);
    const [isImageFull, setIsImageFull] = useState(false);
    const slide = useRef();
    const navigate = useNavigate();
    const { photoId } = useParams();
    const limit = 5;

    const handlePrev = () => {
        const container = slide.current;
        // scroll first image to left 
        const scrollAmount = container.querySelector('div').offsetWidth + 8; // 8px gap between images
        container.scrollBy({
            left: -scrollAmount,  // Move left
            behavior: 'smooth'    // Smooth scroll
        });
    };

    // Scroll to the next image
    const handleNext = () => {
        const container = slide.current;
        const scrollAmount = container.querySelector('div').offsetWidth + 8; // 8px gap between images
        container.scrollBy({
            left: scrollAmount,   // Move right
            behavior: 'smooth'    // Smooth scroll
        });
    };
    const handleNaviagateBack = () => {
        navigate(-1);
    }
    const handleWebShare = async () => {
        setIsShareComponentOpen(true);
    };
    const handleDownloadImage = () => {
        const url = ""
        const link = document.createElement("a");
        link.href = url;
        link.download = "image.jpg"; // Set a default file name for the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    const fetchPhotos = useCallback(
        async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/photos/${photoId}`)
                const data = await res.json();
                if (!res.ok || !(data.clientName && data.selectedPhoto && data.remainingPhotos)) {
                    return fireMessage(data.message, 'error')
                }
                setSelectedPhoto(data.selectedPhoto)
                setRemaningPhotos(data.remainingPhotos)
                setClientName(data.clientName)
            } catch (error) {
                console.log(error)
                fireMessage(error.message, 'error')
            }
        }, [photoId])
    const fetchRecommendedPhotos = useCallback(
        async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`http://localhost:5000/api/photos/${photoId}/recommended?page=${page}&limit=${limit}`)
                const data = await res.json();
                if (!res.ok || !data.recommendedPhotos) {
                    return fireMessage(data.message, 'error')
                }
                if (!data.recommendedPhotos.length) {
                    setHasMore(false)
                } else {
                    setRecommendation(prev => [...prev, ...data.recommendedPhotos])
                    setPage(prev => prev + 1)
                }
            } catch (error) {
                console.log(error)
                fireMessage(error.message, 'error')
            } finally {
                setIsLoading(false);
            }
        }, [page, photoId, limit])

    const getGridRowSpan = (index) => {
        return index % 5 === 0 ? 4 : index % 3 === 0 ? 3 : 2;
    };
    const skeletonColors = ["cb997e", "76c893", "eddcd2", "fff1e6", "f0efeb", "f8ad9d", "ddbea9", "a5a58d", "b7b7a4", "ffe5d9", "caf0f8", "d4a373", "ffb5a7", "fcd5ce", "ced4da", "4361ee"]
    const getRandomColor = () => {
        return `#${skeletonColors[Math.floor(Math.random() * (skeletonColors.length - 0)) + 0]}`
    }
    // this wil fetch photo if user click other photo bec only params id change & component not re-render thus we need to explicitly fetch it.
    useEffect(() => {
        if (photoId && photoId.trim()) fetchPhotos()
    }, [photoId, fetchPhotos])
    // fetch recommended photo after geting actual photo
    useEffect(() => {
        if (selectedPhoto) {
            fetchRecommendedPhotos()
        }
    }, [selectedPhoto, fetchRecommendedPhotos])

    // if img is in full screen of it is shareable prevent scrolling
    useEffect(() => {
        if (isShareComponentOpen || isImageFull) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "scroll"
        }
    }, [isShareComponentOpen, isImageFull])

    return (
        <>
            <div className='relative w-full  h-auto lg:p-2 sm:px-0 sm:py-4 '>
                <div className="selected-image relative flex justify-center mx-auto lg:w-[35rem] lg:h-[23rem] sm:h-[22rem] sm: gap-4">
                    {
                        selectedPhoto ?
                            <img className='w-full h-full object-cover bg-center lg:rounded-3xl sm:rounded-2xl' src={selectedPhoto.url} alt="client-photo"
                                onClick={() => setIsImageFull(true)} /> :
                            <img className='w-full h-full object-cover bg-center lg:rounded-3xl sm:rounded-2xl' src="https://placehold.co/600x400" alt="placeholder-image" onClick={() => setIsImageFull(true)} />
                    }
                    <button onClick={handleNaviagateBack} className='navigate-back  focus:outline-none absolute lg:top-4 lg:left-4  sm:top-8 sm:left-4  p-2 bg-slate-50   rounded-full'>
                        <svg className='w-6 h-6 fill-black' strokeLinecap='round' strokeWidth={'10'} xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" /></svg>
                    </button>
                    <button onClick={handleDownloadImage} className='download-btn focus:outline-none   absolute lg:top-4 lg:right-2  sm:top-8 sm:right-4 p-2 bg-slate-50   rounded-full'>
                        <svg className='w-6 h-6 fill-black' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" /></svg>
                    </button>
                    <button onClick={handleWebShare}
                        className='share-image-btn focus:outline-none absolute lg:bottom-4 lg:right-2  sm:bottom-8 sm:right-4 p-2 bg-slate-50 rounded-full'>
                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"  ><path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z" /></svg>
                    </button>
                    {
                        isShareComponentOpen &&
                        <ShareComponent setIsShareComponentOpen={setIsShareComponentOpen} />
                    }
                </div>
            </div>
            {
                // to display full screen image
                isImageFull &&
                <FullScreenImage selectedPhoto={selectedPhoto} setIsImageFull={setIsImageFull} />
            }
            <div className="text-container flex md:flex-row sm:flex-col md:gap-4 sm:gap-2 justify-between lg:text-mobileHeadlineLarge lg:px-4 lg:py-10  sm:pb-5 sm:pt-2 sm:text-xl">
                <div className="left-part flex flex-col lg:gap-4 sm:gap-2 w-fit">
                    <div className="flex-col lg:gap-2 sm:gap-1 w-fit">
                        <div className="bride-and-groom flex items-center gap-2  sm:px-4 lg:px-0 ">
                            <span className='uppercase whitespace-nowrap sm:text-xl lg:text-2xl'>{clientName.Bride}</span>
                            <span className='sm:text-xl lg:text-2xl'>&</span>
                            <span className='uppercase sm:text-xl lg:text-2xl'>{clientName.Groom}</span>
                        </div>
                        <div className="data-and-location flex items-center gap-2  sm:px-4 lg:px-0">
                            <span className='uppercase whitespace-nowrap sm:text-lg lg:text-xl'>
                                {(selectedPhoto && selectedPhoto.photoShootDate) ? selectedPhoto.photoShootDate : ""}
                            </span>
                            <svg className='w-10 h-10 fill-black' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                            <span className='uppercase sm:text-lg lg:text-xl'>
                                {(selectedPhoto && selectedPhoto.photoLocation) ? selectedPhoto.photoLocation.city : ""}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="tags tracking-wider text-gray-600  flex flex-wrap gap-3 lg:text-desktopBodySmall sm:text-mobileBodySmall sm:px-2 lg:px-0 md:max-w-[30%] sm:w-full lg:w-2/5">
                    {
                        (selectedPhoto && selectedPhoto.tags) ?
                            selectedPhoto.tags.map((t, i) => (
                                <div key={i} className="tag-btn bg-[#ffeee4] h-fit  border-[1px] rounded-full text-center border-gray-500 px-3 py-1  tracking-wider">{t}</div>
                            )) : null
                    }
                </div>
            </div>

            {
                remainingPhotos.length ?
                    <div className="relative same-client-content">
                        <div ref={slide} className="w-full flex gap-2 overflow-x-scroll scrollbar-none">
                            {
                                remainingPhotos.map((photo, i) => (
                                    <Link key={i} to={`/photos/${photo._id}`}>
                                        <div className="lg:h-96 lg:w-[22rem] relative sm:h-80 sm:w-80 sm:flex-none">
                                            <img className='w-full h-full rounded-3xl bg-no-repeat object-cover'
                                                src={photo.url} alt="" />
                                        </div>
                                    </Link>
                                ))
                            }
                        </div>
                        <button
                            className="move-left-btn focus:outline-none focus:border-none left-video absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 rounded-full md:p-2 sm:p-1  shadow-md hover:bg-gray-200" onClick={handlePrev}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="move-right-btn focus:outline-none focus:border-none right-video absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-700 rounded-full md:p-2 sm:p-1 shadow-md hover:bg-gray-200" onClick={handleNext}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div> : null
            }
            <hr className='mt-9 w-full border-[0.5px] border-slate-300' />
            {
                recommendation.length ?
                    <h2 className='my-2 text-lg px-2 capitalize'>More like this</h2> : null
            }

            <InfiniteScroll
                dataLength={recommendation.length}
                next={fetchRecommendedPhotos}
                hasMore={hasMore}
                loader={
                    <grid-container>
                        {Array.from({ length: 5 }).map((_, index) => {
                            return <PhotoSkeletonLoader key={index} bgColor={getRandomColor()} />
                        })}
                    </grid-container>
                } >
                <div className="masonry my-4">
                    {isLoading && [...Array(3)].map((_, i) => (<PhotoSkeletonLoader key={i} bgColor={getRandomColor()} />))}
                    <grid-container>
                        {
                            recommendation.length ?
                                recommendation.map((photo, i) => {
                                    const maxVisibleTags = 3;
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
                                                        <img
                                                            src={photo.url}
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
                                })
                                : null
                        }
                    </grid-container>
                </div >
            </InfiniteScroll>
            {/* <div className="masonry my-4">
                {
                    <div className='recommendation-photos sm:gap-y-3 sm:gap-x-1 lg:gap-x-3 lg:gap-y-5 lg:mt-2 lg:px-2'>
                        {recommendation.length ?
                            recommendation.map((photo, i) => {
                                return (
                                    <div key={i}
                                        style={{ gridRow: `span ${getGridRowSpan(i)}` }}
                                        className="grid-item">
                                        <Link to={`/photos/${photo._id}`}>
                                            <div className="wrapper flex flex-col h-full w-full gap-2  border-[1px] border-slate-300 rounded-md bg-[#e9e9e4]">
                                                <img src={photo.url} alt="Client" className={`object-cover w-full h-full rounded-md`} />
                                            </div>
                                        </Link>
                                    </div>
                                );
                            }) : null
                        }
                    </div>
                }
            </div> */}
        </>
    )
}

export default SpecificPhoto;

const ShareComponent = ({ setIsShareComponentOpen }) => {
    const shareData = {
        title: "Look at this... 👀",
        text: `Look at this... 👀\nCheck out this link:${window.location.href}`,
        url: window.location.href
    };
    const handleWebShare = async () => {
        if (navigator.share && window.isSecureContext) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // if webshare api wont open 
                console.log(err)
            }
        } else {
            setIsShareComponentOpen(true);
        }
    };
    const handleCloseSharePhoto = () => {
        setIsShareComponentOpen(false);
    }
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
        `${shareData.text}`
    )}`;
    const emailShareUrl = `mailto:?subject=${encodeURIComponent(
        shareData.title
    )}&body=${encodeURIComponent(`${shareData.text}`)}`;
    const smsShareUrl = `sms:?body=${encodeURIComponent(
        `${shareData.text}`
    )}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`
    const faccebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}>`

    const handleCopyUrl = async () => {
        let textToCopy = `Look at this... 👀\nCheck out this link:${window.location.href}`;
        await navigator.clipboard.writeText(textToCopy);
    }
    return (
        <div className="share-photo-underlay absolute top-0 left-0 h-screen w-screen  bg-[rgba(0,0,0,0.4)]   lg:px-4 lg:py-4 overflow-hidden">
            <div className="share-via rounded-t-3xl bg-white h-64 w-screen border-2 border-slate-200 fixed bottom-0 left-0 z-[99999]
             py-4 px-4">
                <div className="header flex">
                    <button onClick={handleCloseSharePhoto}>
                        <svg className='fill-black w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"  ><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                    </button>
                    <h1 className='text-center text-lg font-bold mx-auto'> Share To</h1>
                </div>
                <div className="current-url flex w-full border-2 gap-2 border-slate-300 rounded-lg px-2 mt-2 mb-4">
                    <div className="text-lg w-full overflow-hidden text-ellipsis flex-grow py-2">{window.location.href}</div>
                    <button onClick={handleCopyUrl} className='copy-url'>
                        <svg className='fill-black w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" /></svg>
                    </button>
                </div>
                <div className="other-share-options flex items-center justify-start w-full p-2 gap-4  overflow-x-auto scrollbar-none">
                    <div className="whatsapp flex flex-col items-center font-thin text-sm">
                        <Link
                            to={whatsappShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center transition-transform hover:scale-110"
                            title="Chat with us on WhatsApp">
                            <svg display="block" fill="none" height="56" viewBox="0 0 56 56" width="56" xmlns="http://www.w3.org/2000/svg">
                                <rect fill="#25D366" height="56" rx="28" width="56"></rect>
                                <path clipRule="evenodd" d="M39.206 16.65A15.75 15.75 0 0 0 27.99 12c-8.74 0-15.854 7.113-15.857 15.855a15.821 15.821 0 0 0 2.117 7.927L12 44l8.406-2.205a15.837 15.837 0 0 0 7.577 1.93h.007c8.74 0 15.853-7.114 15.856-15.857a15.76 15.76 0 0 0-4.64-11.218ZM27.99 41.047h-.005c-2.365 0-4.684-.636-6.708-1.837l-.482-.286-4.988 1.309 1.331-4.864-.313-.499a13.146 13.146 0 0 1-2.015-7.014c.003-7.266 5.915-13.178 13.185-13.178a13.09 13.09 0 0 1 9.318 3.865 13.098 13.098 0 0 1 3.856 9.324c-.003 7.267-5.915 13.18-13.179 13.18Zm7.23-9.871c-.397-.199-2.345-1.157-2.708-1.289-.364-.132-.628-.198-.891.198-.264.397-1.024 1.29-1.255 1.554-.231.264-.462.297-.858.099-.396-.199-1.673-.617-3.187-1.966-1.178-1.051-1.973-2.348-2.204-2.745-.231-.397-.024-.611.173-.808.178-.178.397-.463.595-.695.198-.23.264-.396.396-.66.132-.265.066-.496-.033-.695-.098-.198-.89-2.148-1.221-2.941-.322-.773-.649-.668-.892-.68a16.01 16.01 0 0 0-.759-.014c-.264 0-.693.099-1.057.495-.363.397-1.387 1.356-1.387 3.305 0 1.95 1.42 3.835 1.618 4.1.199.264 2.794 4.265 6.769 5.982.945.409 1.683.653 2.259.835.948.302 1.812.26 2.495.157.76-.114 2.344-.958 2.674-1.884.33-.925.33-1.719.23-1.884-.098-.166-.362-.266-.758-.464Z" fill="#fff" fillRule="evenodd"></path></svg>
                        </Link>
                        <span>Whatsapp</span>
                    </div>
                    <div className="sms flex flex-col items-center font-thin text-sm">
                        <Link
                            to={smsShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center transition-transform hover:scale-110 "
                            title="Chat with us on msg">
                            <svg display="block" fill="none" height="56" viewBox="0 0 56 56" width="56" xmlns="http://www.w3.org/2000/svg"><rect fill="url(#paint0_linear_4144_9512)" height="56" rx="28" width="56"></rect><path d="M27.7512 13C23.3085 13 19.0478 14.47 15.9063 17.0867C12.7649 19.7033 11 23.2522 11 26.9526C11.004 29.3596 11.7556 31.7247 13.1816 33.8182C14.6076 35.9117 16.6595 37.6624 19.138 38.9C18.4779 40.3778 17.4878 41.7636 16.2089 43C18.6891 42.5646 21.0173 41.65 23.0123 40.3273C24.5505 40.708 26.1465 40.9027 27.7512 40.9053C32.1939 40.9052 36.4546 39.4352 39.5961 36.8186C42.7375 34.202 44.5024 30.6531 44.5024 26.9526C44.5024 23.2522 42.7375 19.7033 39.5961 17.0867C36.4546 14.47 32.1939 13 27.7512 13Z" fill="white"></path>
                                <defs>
                                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_4144_9512" x1="28.4444" x2="28.4444" y1="52.2827" y2="6.94986">
                                        <stop stopColor="#0CBD2A"></stop>
                                        <stop offset="1" stopColor="#5BF675"></stop>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </Link>
                        <span>Messenger</span>
                    </div>
                    <div className="facebook flex flex-col items-center font-thin text-sm">
                        <Link
                            to={faccebookShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center transition-transform hover:scale-110"
                            title="Chat with us on WhatsApp">
                            <svg display="block" fill="none" height="56" viewBox="0 0 56 56" width="56" xmlns="http://www.w3.org/2000/svg"><path d="M56 28C56 12.536 43.464 0 28 0S0 12.536 0 28c0 13.975 10.24 25.56 23.625 27.66V36.094h-7.11V28h7.11v-6.169c0-7.017 4.18-10.893 10.576-10.893 3.064 0 6.268.546 6.268.546v6.891h-3.53c-3.479 0-4.564 2.159-4.564 4.373V28h7.766l-1.242 8.094h-6.524V55.66C45.761 53.56 56 41.975 56 28Z" fill="#1877F2"></path><path d="M38.9 36.094 40.14 28h-7.765v-5.252c0-2.215 1.085-4.373 4.563-4.373h3.53v-6.89s-3.203-.547-6.267-.547c-6.396 0-10.576 3.876-10.576 10.893V28h-7.11v8.094h7.11V55.66a28.206 28.206 0 0 0 8.75 0V36.094h6.524Z" fill="#fff"></path></svg>
                        </Link>
                        <span>Facebook</span>
                    </div>
                    <div className="x flex flex-col items-center font-thin text-sm">
                        <Link
                            to={twitterShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center transition-transform hover:scale-110"
                            title="Chat with us on WhatsApp">
                            <svg display="block" fill="none" height="56" viewBox="0 0 56 56" width="56" xmlns="http://www.w3.org/2000/svg"><rect fill="#111111" height="56" rx="28" width="56"></rect><path d="M30.3055 25.8561L40.505 14H38.088L29.2318 24.2945L22.1584 14H14L24.6964 29.5671L14 42H16.4171L25.7695 31.1287L33.2396 42H41.3979L30.3049 25.8561H30.3055ZM26.995 29.7042L25.9112 28.1541L17.288 15.8196H21.0005L27.9595 25.7739L29.0433 27.324L38.0892 40.2632H34.3767L26.995 29.7048V29.7042Z" fill="white"></path></svg>
                        </Link>
                        <span>X</span>
                    </div>
                    <div className="gmail flex flex-col items-center font-thin text-sm">
                        <Link
                            to={emailShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-12 h-12 transition-transform hover:scale-110"
                            title="Chat with us on WhatsApp">
                            <img src={gmailLogo} alt="" />
                        </Link>
                        <span>Email</span>
                    </div>
                    <div className="share-via flex flex-col items-center font-thin text-nowrap text-sm">
                        <button
                            onClick={handleWebShare}
                            className="flex items-center justify-center w-14 h-14 transition-transform hover:scale-110 rounded-full bg-slate-200 "
                            title="Chat with us on WhatsApp">
                            <svg aria-hidden="true" aria-label="" className="Uvi gUZ U9O kVc" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M7.44 5.44a1.5 1.5 0 1 0 2.12 2.12l.94-.94v6.88a1.5 1.5 0 0 0 3 0V6.62l.94.94a1.5 1.5 0 0 0 2.12-2.12l-3.5-3.5a1.5 1.5 0 0 0-2.12 0zM5 13.5a1.5 1.5 0 0 0-3 0v5A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5v-5a1.5 1.5 0 0 0-3 0v5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5z"></path></svg>
                        </button>
                        <span>Share via</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FullScreenImage = ({ selectedPhoto, setIsImageFull }) => {
    return <>
        <div className="photo-underlay  fixed top-0 left-0 z-30  w-screen h-screen underlay bg-[rgba(0,0,0,0.84)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[2px] px-4 py-4 overflow-hidden">
            <div className="photo-wrapper h-full w-full relative">
                <button className='p-2 rounded-full absolute top-4 left-4 bg-slate-200'
                    onClick={() => setIsImageFull(false)}>
                    <svg className='lg:w-8 lg:h-8 sm:w-4 sm:h-4 stroke' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                </button>
                {
                    selectedPhoto ?
                        <img className='mx-auto lg:w-[30rem] md:w-[25rem] h-full object-cover bg-center lg:rounded-3xl sm:rounded-2xl' src={selectedPhoto.url} alt="client-photo" /> :
                        <img className='mx-auto lg:w-[30rem] md:w-[25rem] h-full object-cover bg-center lg:rounded-3xl sm:rounded-2xl' src="https://placehold.co/600x400" alt="placeholder-image" />
                }
            </div>
        </div>
    </>
}
