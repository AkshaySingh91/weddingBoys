import React from 'react'
import { fireMessage } from '../AuthPage/Signup';
import { useEffect, useState } from 'react';
const api_url = process.env.REACT_APP_API_URL;

function EditPhotoForm({ id, isEditing, setPhotoForm, tagsData, setTagsData, clientDetails, setClientDetails }) {
    const [collapsed, setCollapsed] = useState({ tags: false, });
    
    useEffect(() => {
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
        fetchCategories(); 
    }, [setTagsData]);

    const toogleCollapse = (section) => {
        setCollapsed((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }
    const handleTags = (t) => {
        if (isEditing) {
            setClientDetails((prev) => {
                let photoDetails = prev.photos.find((photo) => photo._id === id)
                // photo = {photo : {}, isHero, tags ...}
                let isPresent = false;
                const withoutTag = photoDetails.tags.filter((tag) => {
                    if (tag === t) {
                        isPresent = true
                        return false
                    }
                    else {
                        return true
                    }
                })
                if (isPresent) {
                    prev.photos = prev.photos.map(v => {
                        if (v._id === id) {
                            return { ...v, tags: withoutTag };
                        } return v;
                    })
                    return { ...prev }
                }
                prev.photos = prev.photos.map(v => {
                    if (v._id === id) {
                        return { ...v, tags: [...withoutTag, t] };
                    } return v;
                })
                return { ...prev }
            })
        }
    }
    return (
        <>
            (<div className="underlay fixed z-30 top-0 left-0 max-h-screen h-screen overflow-y-auto scrollbar-thin w-screen bg-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[1px] border border-[rgba(255,255,255,0.18)] rounded-2xl flex items-center justify-center">
                <div className="z-40 px-4 py-3 my-2 max-h-screen overflow-y-auto scrollbar-thin lg:w-96 sm:rounded-2xl bg-[rgba(238,238,238,0.7)] shadow-[0px_0px_10px_0_rgba(31,38,135,0.37)] backdrop-blur-[4px] border border-[rgb(255,255,255)] ">
                    <h1 className='text-center font-bold text-desktopBodyLarge'> photo Details</h1>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <div className="flex-auto h-auto scrollbar-thin overflow-y-auto my-2 transition-all duration-200">
                        <div className="p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <div className="tags mb-4 transition-all duration-200">
                                <h2 className="block text-center text-gray-700 font-medium mb-2">Tags</h2>
                                <div className=" cursor-pointer text-center text-sm h-10 w-full border-2 border-black bg-slate-300 rounded-md" onClick={() => { toogleCollapse('tags') }}>
                                    select the as many keyword for related to photo
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
                                                            className={`py-1 px-2 bg-blue-100 rounded-md  ${clientDetails.photos.find((vd) => vd._id === id).tags.find((tg) => tg === t) ? "bg-blue-400" : ""}`}
                                                        >{t}</button>
                                                    })
                                                }
                                            </div>
                                        })
                                    }

                                </div>
                            </div>
                            <div className="location mb-4">
                                <div className="flex flex-col gap-2 ">
                                    <h2 className='text-center'>Location</h2>
                                    <div className="flex justify-evenly">
                                        <label htmlFor='country' className="block text-gray-700 font-medium mb-2">country</label>
                                        <input
                                            id='country' type="text"
                                            className=" border-gray-300 border rounded-lg p-1"
                                            value={clientDetails.photos.find((v) => v._id === id)?.photoLocation?.country}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const photoDetails = prev.photos.find((photo) => photo._id === id)
                                                        photoDetails.photoLocation.country = e.target.value
                                                        prev.photos = prev.photos.map(v => {
                                                            if (v._id === id) {
                                                                return photoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }}
                                            placeholder="India" />
                                    </div>
                                    <div className="flex justify-evenly">
                                        <label htmlFor='state' className="block text-gray-700 font-medium mb-2">State</label>
                                        <input
                                            id='state' type="text"
                                            value={clientDetails.photos.find((v) => v._id === id)?.photoLocation?.state}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const photoDetails = prev.photos.find((photo) => photo._id === id)
                                                        photoDetails.photoLocation.state = e.target.value
                                                        prev.photos = prev.photos.map(v => {
                                                            if (v._id === id) {
                                                                return photoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }}
                                            className="  border-gray-300 border rounded-lg p-1"
                                            placeholder="Maharastra"
                                            required />
                                    </div>
                                    <div className="flex justify-evenly">
                                        <label htmlFor='city' className="block text-gray-700 font-medium mb-2">City</label>
                                        <input
                                            id='city' type="text"
                                            value={clientDetails.photos.find((v) => v._id === id)?.photoLocation?.city}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const photoDetails = prev.photos.find((photo) => photo._id === id)
                                                        photoDetails.photoLocation.city = e.target.value
                                                        prev.photos = prev.photos.map(v => {
                                                            if (v._id === id) {
                                                                return photoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }}
                                            className="border-gray-300 border rounded-lg p-1"
                                            placeholder="pune" />
                                    </div>
                                </div>
                            </div>
                            <div className="general-priority">
                                <div className="hero-priority flex justify-evenly">
                                    <label htmlFor="hero-priority" className="block text-gray-700 font-medium mb-2">General photo priority</label>
                                    <input
                                        id='state' type="number" required
                                        className="  border-gray-300 border rounded-lg p-1"
                                        value={clientDetails.photos.find((v) => v._id === id)?.generalPriority}
                                        onChange={(e) => {
                                            if (isEditing) {
                                                setClientDetails(prev => {
                                                    const photoDetails = prev.photos.find((photo) => photo._id === id)
                                                    photoDetails.generalPriority = e.target.value
                                                    prev.photos = prev.photos.map(v => {
                                                        if (v._id === id) {
                                                            return photoDetails;
                                                        } return v;
                                                    })
                                                    return { ...prev }
                                                })
                                            }
                                        }} />
                                </div>
                            </div>
                            <div className="photo-shoot-date">
                                <label htmlFor="photo-shoot-date" className="block text-gray-700 font-medium mb-2">photo Shoot Date</label>
                                <input
                                    type="date" id="photo-shoot-date"
                                    value={clientDetails.photos.find((v) => v._id === id)?.photoShootDate
                                        ? new Date(clientDetails.photos.find((v) => v._id === id)?.photoShootDate).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onChange={(e) => {
                                        if (isEditing) {
                                            setClientDetails(prev => {
                                                const photoDetails = prev.photos.find((photo) => photo._id === id)
                                                photoDetails.photoShootDate = e.target.value
                                                prev.photos = prev.photos.map(v => {
                                                    if (v._id === id) {
                                                        return photoDetails;
                                                    } return v;
                                                })
                                                return { ...prev }
                                            })
                                        }
                                    }} />
                            </div>
                        </div>
                    </div>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <button
                        type='button' className="w-full my-2 px-8 py-2 border-gray-800 border-[1px] bg-gray-200 rounded-lg"
                        onClick={() => {
                            setPhotoForm(prev => prev.map((f) => f.id === id ? { "isPhotoFormVisible": false, "id": id } : f))
                        }}
                    >{isEditing ? "Save" : "Cancle"}</button>
                </div >
            </div >)
        </>
    )
}

export default EditPhotoForm
