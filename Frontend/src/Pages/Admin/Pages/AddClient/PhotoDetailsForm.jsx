import React, { useState, useEffect } from 'react';
import { fireMessage } from '../AuthPage/Signup'

function PhotoDetailsForm({ tagsData, setTagsData, photosDetails, setPhotoDetails, setPhotoForm, photoName }) {
    const [locationInput, setLocationInput] = useState(photosDetails.find((photosDetails) => photosDetails.photo.name === photoName).location);
    const [generalPriority, setGeneralPriority] = useState(photosDetails.find((photosDetails) => photosDetails.photo.name === photoName).generalPriority);
    const [photoShootDate, setphotoShootDate] = useState(photosDetails.find((photosDetails) => photosDetails.photo.name === photoName).shootDate);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/get-all-tags", {
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
    
    const [collapsed, setCollapsed] = useState({
        tags: false,
    });
    const toogleCollapse = (section) => {
        setCollapsed((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }
    const handleTags = (t) => {
        setPhotoDetails((prev) => {
            const filteredPrev = prev.filter((item) => item.photo !== null);
            const photosDetails = filteredPrev.find((photo) => photo.photo.name === photoName)
            // photo = {photo : {}, isHero, tags ...}
            let isPresent = false;
            const withoutTag = photosDetails.tags.filter((tag) => {
                if (tag === t) {
                    isPresent = true
                    return false;
                }
                else {
                    return true;
                }
            })
            if (isPresent) {
                return filteredPrev.map((photosDetails) => {
                    if (photosDetails.photo.name === photoName) {
                        return {
                            ...photosDetails,
                            tags: withoutTag,
                        }
                    } return photosDetails
                })
            }
            return filteredPrev.map((photosDetails) => {
                if (photosDetails.photo.name === photoName) {
                    return {
                        ...photosDetails,
                        tags: [...withoutTag, t],
                    }
                } return photosDetails
            })
        })
    }
    const handleLocationChange = () => {
        setPhotoDetails((prev) =>
            prev.map((photosDetails) => {
                if (photosDetails.photo.name === photoName) {
                    return {
                        ...photosDetails,
                        location: locationInput,
                    }
                } return photosDetails
            }))
    }
    const handleGeneralPriority = () => {
        if (isNaN(Number.parseInt(generalPriority))) {
            return fireMessage('Invalid priority', 'error');
        }
        setPhotoDetails((prev) =>
            prev.map((photosDetails) => {
                if (photosDetails.photo.name === photoName) {
                    return {
                        ...photosDetails, generalPriority: generalPriority,
                    }
                } return photosDetails
            }))
    }
    const handlePhotoShootDate = (date) => {
        setPhotoDetails((prev) =>
            prev.map((photosDetails) => {
                if (photosDetails.photo.name === photoName) {
                    return {
                        ...photosDetails,
                        shootDate: date
                    }
                } return photosDetails
            }))
    }
    return (
        <>
            (<div className="underlay fixed z-30 top-0 left-0 w-screen bg-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[1px] border border-[rgba(255,255,255,0.18)] rounded-2xl flex items-center justify-center">
                <div className="z-40 px-4 py-3 my-2 max-h-screen overflow-y-auto scrollbar-thin lg:w-96 sm:rounded-2xl bg-[rgba(238,238,238,0.7)] shadow-[0px_0px_10px_0_rgba(31,38,135,0.37)] backdrop-blur-[4px] border border-[rgb(255,255,255)] ">
                    <h1 className='text-center font-bold text-desktopBodyLarge'>Fill this form for each photo</h1>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <div className="flex-auto h-auto scrollbar-thin overflow-y-auto my-2 transition-all duration-200">
                        <div className="client-name p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <div className="tags mb-4 transition-all duration-200">
                                <h2 className="block text-center text-gray-700 font-medium mb-2">Tags</h2>
                                <div className=" cursor-pointer text-center text-sm h-10 w-full border-2 border-black bg-slate-300 rounded-md" onClick={() => { toogleCollapse('tags') }}>
                                    select the as many keyword for related to photo
                                </div>
                                <div className={`bg-blue-300 all-tags ${collapsed.tags ? "max-h-40" : "max-h-0 overflow-y-scroll scrollbar-thin"}`}>
                                    {
                                        tagsData.map((tagType) => {
                                            // tagType.tagType = category, religion, region, etc
                                            // tagType.tagType.tags = beach, aerial, etc
                                            return <div key={tagType.tagType} className="flex flex-wrap gap-2 w-full p-2">
                                                {
                                                    tagType.tags.map((t) => {
                                                        return <button key={t} type='button' className={`py-1 px-2 rounded-md bg-blue-100 ${photosDetails.find((ph) => ph.photo.name === photoName).tags.find((tg) => tg === t ? true : false) ? "bg-blue-400" : ""}`}
                                                            onClick={() => handleTags(t)}
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
                                        <label htmlFor='contry' className="block text-gray-700 font-medium mb-2">Contry</label>
                                        <input value={locationInput.country} onChange={(e) => {
                                            setLocationInput(prev => { return { ...prev, country: e.target.value } })
                                        }} onBlur={handleLocationChange} id='contry' type="text"
                                            className=" border-gray-300 border rounded-lg p-1"
                                            placeholder="India" />
                                    </div>
                                    <div className="flex justify-evenly">
                                        <label htmlFor='state' className="block text-gray-700 font-medium mb-2">State</label>
                                        <input value={locationInput.state} onBlur={handleLocationChange} onChange={(e) => {
                                            setLocationInput(prev => { return { ...prev, state: e.target.value } })
                                        }} id='state' type="text"
                                            className="  border-gray-300 border rounded-lg p-1"
                                            placeholder="Maharastra"
                                            required />
                                    </div>
                                    <div className="flex justify-evenly">
                                        <label htmlFor='city' className="block text-gray-700 font-medium mb-2">City</label>
                                        <input value={locationInput.city} onBlur={handleLocationChange} onChange={(e) => {
                                            setLocationInput(prev => { return { ...prev, city: e.target.value } })
                                        }} id='city' type="text"
                                            className="border-gray-300 border rounded-lg p-1"
                                            placeholder="pune" />
                                    </div>
                                </div>
                            </div>
                            <div className="general-priority">
                                <div className="hero-priority flex justify-evenly">
                                    <label htmlFor="hero-priority" className="block text-gray-700 font-medium mb-2">General photo priority</label>
                                    <input value={generalPriority} onChange={(e) => setGeneralPriority(Number(e.target.value))} onBlur={handleGeneralPriority} id='state' type="number"
                                        className="  border-gray-300 border rounded-lg p-1"
                                        required />
                                </div>
                            </div>
                            <div className="photo-shoot-date">
                                <label htmlFor="photo-shoot-date" className="block text-gray-700 font-medium mb-2">photo Shoot Date</label>
                                <input value={photoShootDate}
                                    onChange={(e) => { setphotoShootDate(e.target.value); handlePhotoShootDate(e.target.value) }} type="date" id="photo-shoot-date" />
                            </div>
                        </div>
                    </div>
                    <button type='button' className="w-full my-2 px-8 py-2 border-gray-800 border-[1px] bg-gray-50  rounded-lg" onClick={(e) => {
                        setPhotoForm(prev => prev.map((f) => f.name === photoName ? { "isPhotoFormVisible": false, "name": photoName } : f))
                    }}>Save</button>
                </div >
            </div >)
        </>
    )
}

export default PhotoDetailsForm
