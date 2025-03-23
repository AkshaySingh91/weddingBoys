import React from 'react'
import { useState, useEffect } from 'react';
import { fireMessage } from '../AuthPage/Signup';
const api_url = process.env.REACT_APP_API_URL;

export default function VideoThumbnail() {
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState([])
    const [homepageTags, setHomepageTags] = useState([])
    const [tagsData, setTagsData] = useState([]);
    const [newAddedTags, setNewAddedTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [collapsed, setCollapsed] = useState({ tags: false, });


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
    useEffect(() => {
        const fetchHomeTags = async () => {
            try {
                setIsLoading(true)
                const res = await fetch(`${api_url}/api/homepage/tags`)
                const data = await res.json();
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error')
                }
                setHomepageTags(data.tags)
                setNewAddedTags(data.tags)
                if (data.tags.length > 0) {
                    await fetchVideos(data.tags[0]);
                    setSelectedTag(data.tags[0])
                }
            } catch (error) {
                return fireMessage(error.message, 'error')
            } finally {
                setIsLoading(false)
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
                setTagsData(data.allTags);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();  //it is all avalable tags
        fetchHomeTags();    //it is tag that are selected 
    }, [])
    const handleEdit = () => {
        setIsEditing(true);
    };
    const handleSave = async () => {
        try {
            setIsLoading(true)
            const res = await fetch(`${api_url}/api/admin/homepage/tags`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ newAddedTags }),
                headers: {
                    'Content-type': "application/json"
                }
            })
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            setHomepageTags(data.tags)
            setIsEditing(false)
        } catch (error) {
            fireMessage(error.message, 'error')
        } finally {
            setIsLoading(false)
        }
    }
    const handleCancel = () => {
        setIsEditing(false);
        setNewAddedTags(homepageTags)
    };
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
                        return false;
                    } else {
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
    const handleChangeTag = (t) => {
        setSelectedTag(t);
        fetchVideos(t)
    }
    return (<>
        <a href="w-fit ">
            <h1 className="inline-block mb-8 px-4 py-0 text-desktopHeadlineSmall transition-all delay-700 duration-75	 hover:underline decoration-red-400 underline-offset-4 sm:py-4 sm:text-desktopBodyLarge font-bold">Films</h1>
        </a>
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
                            tagsData.map((tagType) => {
                                return <div key={tagType.tagType} className="flex flex-wrap gap-2 w-full p-2">
                                    {
                                        tagType.tags.map((t) => {
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
        <div className="flex gap-3 lg:justify-center sm:justify-start w-full sm:overflow-x-auto scrollbar-none sm:pl-2">
            {
                isLoading ?
                    [...Array(3)].map((_, i) => (
                        <div key={i}><TagSkeletonLoader /></div>
                    )) :
                    homepageTags.length ?
                        homepageTags.map((t) => (
                            <button key={t}
                                className={`px-4 py-1 text-desktopBodySmall rounded-3xl border-2 border-[#f5ac38]  hover:bg-[#ffbb7c] ${selectedTag === t ? "bg-[#ffbb7c]" : " bg-secondary"} sm:text-mobileBodySmall`}
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
                    <div key={c.videos._id}
                        className="lg:h-[33rem] lg:w-2/5 relative my-9 sm:h-80 sm:w-80 sm:flex-none">
                        <div className="relative h-full overflow-hidden">
                            {/* Video Thumbnail */}
                            <img
                                className="w-full h-full rounded-3xl bg-no-repeat object-cover"
                                src={c.thumbnailUrl}
                                alt=""
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent rounded-b-3xl"></div>
                            {/* Text Content */}
                            <div className="absolute bottom-6 left-6 text-white flex flex-col gap-0 z-10">
                                <div className="flex items-center gap-2 text-desktopBodyLarge uppercase font-semibold tracking-wide">
                                    <span>{c.videos.videoShootDate}</span>
                                    <svg
                                        className="lg:w-6 lg:h-6"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 -960 960 960"
                                        fill="white">
                                        <path d="M411-481 213-679l42-42 240 240-240 240-42-42 198-198Zm253 0L466-679l42-42 240 240-240 240-42-42 198-198Z" />
                                    </svg>
                                    <span>{c.videos.videoLocation.city}</span>
                                </div>
                                <div className="flex gap-2 lg:text-desktopHeadlineSmall text-white uppercase tracking-wide">
                                    <span>{c.clientName.Bride}</span>
                                    <span>&</span>
                                    <span>{c.clientName.Groom}</span>
                                </div>
                            </div>
                        </div>
                    </div>

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
const TagSkeletonLoader = () => (
    <div className="flex gap-3 lg:justify-center sm:justify-start w-full sm:overflow-x-auto scrollbar-none sm:pl-2">
        <button className={`px-4 py-1 rounded-3xl`} >
            <div className="inline-block animate-pulse w-20 h-6 rounded-xl bg-slate-400"></div>
        </button>
    </div>
)