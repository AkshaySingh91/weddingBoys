import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fireMessage } from "../../Admin/Pages/AuthPage/Signup";
import SearchResultPhoto from "./SearchResultPhoto";
import SearchResultVideos from "./SearchResultVideos";

export default function SearchResult() {
    const [activeTab, setActiveTab] = useState("videos");
    const [videos, setVideos] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { search } = useLocation();
    // this will take search eg ?query=asdfasd&page=2 & give value of diffrent search params
    const query = new URLSearchParams(search).get("query");
    const [hasMoreVideos, setHasMoreVideos] = useState(true);
    const [hasMorePhotos, setHasMorePhotos] = useState(true);
    const [videoPage, setVideoPage] = useState(1);
    const [photoPage, setPhotoPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("")
    const limit = 10;
    const navigate = useNavigate();
    // const touchStartX = useRef(0);
    // const touchEndX = useRef(0);
    // const videoSlide = useRef();
    // const photoSlide = useRef();
    // fetch initially video & photos
    const fetchSearchResults = useCallback(
        async (mediaType = "video", page = 1) => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:5000/api/search?query=${query}&media=${mediaType}&page=${page}&limit=${limit}`);
                const data = await res.json()
                if (!res.ok || !data.photos || !data.videos) {
                    return fireMessage(data.message, 'error')
                }
                if (mediaType === 'video') {
                    setVideos(prev => [...prev, ...data.videos]);
                    setHasMoreVideos(data.videos.length === limit);
                } else {
                    setPhotos(prev => [...prev, ...data.photos]);
                    setHasMorePhotos(data.photos.length === limit);
                }
            } catch (error) {
                fireMessage(error.message, 'error')
                console.error("Error fetching search results", error);
            } finally {
                setLoading(false);
            }
        }, [query, limit]);

    useEffect(() => {
        if (query) {
            setVideos([]);
            setPhotos([]);
            fetchSearchResults('video', 1);
            fetchSearchResults('photo', 1);
        }
    }, [query, fetchSearchResults]);


    const fetchMoreVideos = () => {
        const nextPage = videoPage + 1;
        setVideoPage(nextPage);
        fetchSearchResults('video', nextPage);
    };

    const fetchMorePhotos = () => {
        const nextPage = photoPage + 1;
        setPhotoPage(nextPage);
        fetchSearchResults('photo', nextPage);
    };
    // const handleTouchStart = (e) => {
    //     touchStartX.current = e.touches[0].clientX;
    // }
    // const handleTouchMove = (e) => {
    //     touchEndX.current = e.touches[0].clientX;
    // }
    // const handleTouchEnd = () => {
    //     const changeInPosition = touchEndX.current - touchStartX.current;
    //     if (changeInPosition > 50 && videoSlide.current) {
    //         // Swipe Right (Show Video panel)
    //         videoSlide.current.style.transform = `translateX(0%)`;  // Show Video panel
    //         // photoSlide.current.style.transform = `translateX(100%)`; // Hide Photo panel
    //         setActiveTab("videos");  // Update active tab state
    //     } else if (changeInPosition < -50 && photoSlide.current) {
    //         // Swipe Left (Show Photo panel)
    //         // videoSlide.current.style.transform = `translateX(-100%)`; // Hide Video panel
    //         photoSlide.current.style.transform = `translateX(0%)`;  // Show Photo panel
    //         setActiveTab("photos");  // Update active tab state
    //     }
    // };
    const handleSearch = (e) => {
        if (e.key === "Enter" && searchQuery.trim() !== "") {
            navigate(`/search-result?query=${searchQuery}`);
        }
    };
    return (
        <div className="py-4 min-h-screen w-full">
            <div className="lg:hidden search-bar flex items-center px-4 py-1 mb-2 mx-auto  w-11/12 rounded-full gap-2 bg-[#f9e2c9] border-[1px] border-[#eab273] ">
                <svg className='flex-none lg:w-6 lg:h-6 sm:w-8 sm:h-8  fill-gray-500' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" ><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" /></svg>
                <input
                    className=' flex-auto text-black text-mobileBodyLarge font-primary tracking-wider outline-0 bg-transparent sm:placeholder:text-mobileBodyLarge placeholder:text-black placeholder:opacity-60 rounded-2xl ' autoFocus={true}
                    type="text" placeholder={'Search Our Films'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch} />
            </div>
            <div className="search-navigation-panel w-full px-2 gap-4 flex justify-evenly items-center">
                <div className="video-btn flex-grow">
                    <button
                        onClick={() => setActiveTab("videos")}
                        className={`w-full focus:border-none focus:outline-none text-center px-4 py-2 text-black ${activeTab === "videos" ? "" : ""}`}>
                        Videos
                    </button>
                    <hr className="border-2 border-slate-300 w-1/2 mx-auto" />
                </div>
                <div className="photo-btn flex-grow" >
                    <button
                        onClick={() => setActiveTab("photos")}
                        className={`w-full focus:border-none focus:outline-none text-center px-4 py-2  text-black ${activeTab === "photos" ? "" : ""}`}>
                        Photos
                    </button>
                    <hr className="border-2 border-slate-300 w-1/2 mx-auto" />
                </div>
            </div>
            <div className="panel relative w-full overflow-hidden">
                {
                    // video panel
                    activeTab === "videos" &&
                    <SearchResultVideos
                        loading={loading}
                        videos={videos}
                        fetchMoreVideos={fetchMoreVideos}
                        hasMoreVideos={hasMoreVideos}
                    />
                }
                {
                    //  photos panel
                    activeTab === "photos" &&
                    <SearchResultPhoto
                        loading={loading}
                        photos={photos}
                        fetchMorePhotos={fetchMorePhotos}
                        hasMorePhotos={hasMorePhotos}
                    />
                }
            </div>
        </div>
    );
}



