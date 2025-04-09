import React, { useEffect, useState } from 'react'
import { fireMessage } from '../AuthPage/Signup';
const api_url = process.env.REACT_APP_API_URL;

function Index() {
    const [newAddedTags, setNewAddedTags] = useState([]);
    const [filmPageTags, setFilmPageTags] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [allVideos, setAllVideos] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const fetchVideos = async (t) => {
        try {
            const res = await fetch(`${api_url}/api/videos?tag=${t}`)
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
            try {
                const res = await fetch(`${api_url}/api/filmpage/tags`)
                const data = await res.json();
                if (res.status >= 300 || !data.tags) {
                    return fireMessage(data.message, 'error')
                }
                setFilmPageTags(data.tags)
                setNewAddedTags(data.tags)
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
            }
        }
        // fetch all avalable tags from tagschems
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${api_url}/api/get-all-tags`, {
                    method: "GET",
                    credentials: "include"
                });
                const data = await response.json();
                if (response.status >= 300) {
                    return fireMessage(data.message, 'error')
                }
                setAllTags(data.allTags); 
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();  //it is all avalable tags
        fetchFilmPageTags();    //it is tag that are selected 
    }, [])
    const handleCancel = () => {
        setIsEditing(false);
        setNewAddedTags(filmPageTags)
    }
    const handleEdit = () => {
        setIsEditing(true)
    }
    const handleSave = async () => {
        try {
            const res = await fetch(`${api_url}/api/admin/filmpage/tags`, {
                method: "POST",
                body: JSON.stringify({ newAddedTags }),
                headers: {
                    'Content-type': "application/json"
                },
                credentials: "include"
            })
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            setFilmPageTags(data.tags)
            setIsEditing(false)
        } catch (error) {
            fireMessage(error.message, 'error')
        }
    }
    const toogleCollapse = (section) => {
        setCollapsed((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }
    const handleTags = (t) => {
        if (isEditing) {
            setNewAddedTags(prev => {
                let isPresent = false;
                const withoutTag = prev.filter((tag) => {
                    if (tag === t) {
                        isPresent = true
                        return false
                    }
                    else {
                        return true
                    }
                })
                if (isPresent) {
                    return withoutTag
                }
                return [...withoutTag, t]
            })
        }
    }
    return (
        <>
            <div className="header py-6 mx-auto text-desktopHeadlineSmall opacity-70">
                <h1 className='whitespace-nowrap mb-2'>Wedding Boys Films</h1>
                <hr className='bg-gray-400 w-20 mx-auto' />
            </div>

            <div className="edit flex justify-end mb-4">
                {!isEditing ? (
                    <button type='button'
                        onClick={handleEdit}
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
                    >Edit</button>
                ) : (
                    <div className="flex gap-2">
                        <button type='button'
                            onClick={handleSave}
                            className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600"
                        >Save</button>
                        <button type='button'
                            onClick={handleCancel}
                            className="bg-gray-500 text-white font-semibold py-2 px-4 rounded hover:bg-gray-600"
                        >Cancel</button>
                    </div>
                )}
            </div>
            <div className="tags mb-4 transition-all duration-200">
                {isEditing && (
                    <div className="tags mb-4 transition-all duration-200">
                        <h2 className="block text-center text-gray-700 font-bold mb-2">Add Tags</h2>
                        <div className=" cursor-pointer text-center text-sm h-10 w-full border-2 border-black bg-slate-300 rounded-md" onClick={() => { toogleCollapse('tags') }}>
                            select the keyword for related to video
                        </div>
                        <div className={`bg-blue-300 all-tags ${collapsed.tags ? "max-h-40" : "max-h-0 overflow-y-scroll scrollbar-thin"}`}>
                            {
                                allTags.map((tagCategory) => {
                                    return <div key={tagCategory._id} className="flex flex-wrap gap-2 w-full p-2">
                                        {
                                            tagCategory.tags.map((t) => {
                                                return <button key={t}
                                                    type='button'
                                                    onClick={() => handleTags(t)}
                                                    className={`py-1 px-2 bg-blue-100 rounded-md ${newAddedTags.find((tag) => tag === t) ?
                                                        "bg-blue-400" : ""}`}
                                                >{t}</button>
                                            })
                                        }
                                    </div>
                                })
                            }
                        </div>
                    </div>
                )}
            </div>
            <div className="films-category-wrapper box-border">
                {
                    allVideos.length ? (
                        allVideos.map((filmsRow) => {
                            return <div key={filmsRow.tagName} className="our-favourite px-2 my-12">
                                <div className="category-name text-desktopBodyLarge font-[500] tracking-wide flex justify-between my-3 items-center">
                                    <h2>{filmsRow.tagName}</h2>
                                    <button className='text-desktopBodySmall border-1 border-black bg-tertiary rounded-3xl px-3 py-1 mx-2 text-white'>view all</button>
                                </div>
                                <div className="top-films w-full overflow-x-auto scrollbar-none" role='list'>
                                    <div role='listitem' className="movies flex gap-4">
                                        {
                                            filmsRow.videos && filmsRow.videos.length ?
                                                filmsRow.videos.map((video) => (
                                                    <a key={video.videos._id} href={`/films/${video.videos._id}`} className=' flex flex-col lg:gap-2 sm:gap-3'>
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
                                                        <div className="text-primary flex flex-col gap-0 px-2">
                                                            <div className="flex items-center lg:text-desktopBodySmall uppercase  tracking-wide sm:text-mobileBodyMedium whitespace-nowrap font-bold">
                                                                <span>{video.videos.videoShootDate}</span>
                                                                <svg className='lg:w-8 lg:h-8 sm:w-4 sm:h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" /></svg>
                                                                <span>{video.videos.videoLocation.city}</span>
                                                            </div>
                                                            <div className="flex gap-2 lg:text-desktopBodyLarge font-bold sm:text-mobileBodyLarge whitespace-nowrap">
                                                                <span>{video.clientName.Bride}</span>
                                                                <span>&</span>
                                                                <span>{video.clientName.Groom}</span>
                                                            </div>
                                                        </div>

                                                    </a>
                                                )) :
                                                <div className="">No Video In this Category</div>
                                        }
                                    </div>
                                </div>
                            </div >
                        })
                    ) : <div className="">No videos</div>
                }
            </div >
        </>
    )
}

export default Index
