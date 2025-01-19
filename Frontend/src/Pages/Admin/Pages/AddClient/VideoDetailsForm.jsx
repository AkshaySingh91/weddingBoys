import React, { useState, useEffect } from 'react';
import { fireMessage } from '../AuthPage/Signup'


function VideoDetailsForm({ videoFiles, setVideoFiles, tagsData, setTagsData, videoDetails, setVideosDetails, setVideoForm, videoName }) {
    const [locationInput, setLocationInput] = useState(videoDetails.find((videoDetail) => videoDetail.video.name === videoName).location);
    const [isHero, setIsHero] = useState(videoDetails.find((videoDetail) => videoDetail.video.name === videoName).isHeroVideo);
    const [heroVideoPriority, setHeroVideoPriority] = useState(videoDetails.find((videoDetail) => videoDetail.video.name === videoName).heroPriority);
    const [generalPriority, setGeneralPriority] = useState(videoDetails.find((videoDetail) => videoDetail.video.name === videoName).generalPriority);
    const [videoShootDate, setVideoShootDate] = useState(videoDetails.find((videoDetail) => videoDetail.video.name === videoName).shootDate);
    const [btsEntry, setBtsEntry] = useState([{
        key: videoDetails.find((videoDetail) => videoDetail.video.name === videoName).btsInfo[0].key,
        value: videoDetails.find((videoDetail) => videoDetail.video.name === videoName).btsInfo[0].value
    }]);
    const [thumbnail, setThumbnail] = useState(videoFiles.find((videoObj) => videoObj.video.name === videoName).thumbnail);
    const [previewThumbnail, setPreviewThumbnail] = useState("");

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
        setVideosDetails((prev) => {
            const filteredPrev = prev.filter((item) => item.video !== null);
            const videoDetails = filteredPrev.find((video) => video.video.name === videoName)
            // video = {video : {}, isHero, tags ...}
            let isPresent = false;
            const withoutTag = videoDetails.tags.filter((tag) => {
                if (tag === t) {
                    isPresent = true
                    return false;
                }
                else {
                    return true;
                }
            })
            if (isPresent) {
                return filteredPrev.map((videoDetail) => {
                    if (videoDetail.video.name === videoName) {
                        return {
                            ...videoDetail,
                            tags: withoutTag,
                        }
                    } return videoDetail
                })
            }
            return filteredPrev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        tags: [...withoutTag, t],
                    }
                } return videoDetail
            })
        })
    }
    const handleLocationChange = () => {
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        location: { ...locationInput },
                    }
                } return videoDetail
            }))
    }
    const handleSetHeroVideoPriority = () => {
        if (isNaN(Number.parseInt(heroVideoPriority))) {
            return fireMessage('Invalid priority', 'error');
        }
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        heroPriority: heroVideoPriority,
                    }
                } return videoDetail
            }))
    }
    const handleGeneralPriority = () => {
        if (isNaN(Number.parseInt(generalPriority))) {
            return fireMessage('Invalid priority', 'error');
        }
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        generalPriority: generalPriority,
                    }
                } return videoDetail
            }))
    }
    const handleVideoShootDate = (date) => {
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        shootDate: date
                    }
                } return videoDetail
            }))
    }
    const handleBtsEntry = () => {
        console.log({ videoDetails })
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        btsInfo: btsEntry,
                    };
                }
                return videoDetail;
            })
        );
    };

    const addBtsEntry = () => {
        setBtsEntry((prev) => [...prev, { key: '', value: '' }]);
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        btsInfo: [...videoDetail.btsInfo, { key: '', value: '' }],
                    };
                }
                return videoDetail;
            })
        );
    };
    const removeBtsEntry = (idx) => {
        setBtsEntry((prev) => prev.filter((_, i) => i !== idx));
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        btsInfo: videoDetail.btsInfo.filter((_, i) => i !== idx),
                    };
                }
                return videoDetail;
            })
        );
    };
    const handleIsHero = (isHero) => {
        setIsHero(isHero);
        setVideosDetails((prev) =>
            prev.map((videoDetail) => {
                if (videoDetail.video.name === videoName) {
                    return {
                        ...videoDetail,
                        isHeroVideo: isHero,
                    };
                }
                return videoDetail;
            }))
    }
    useEffect(() => {
        if (thumbnail && typeof thumbnail === 'object') {
            const url = URL.createObjectURL(thumbnail)
            setPreviewThumbnail(url)
        }
    }, [thumbnail])
    const handleFileUpload = (e) => {
        if (e.target.files[0]) {
            const f = e.target.files[0];
            let newName = `${f.name.split('.')[0]}_${Date.now()}.${f.type.split('/')[1]}`;
            let blob = f.slice(0, f.size);
            const file = new File([blob], newName, { type: f.type });

            const previewUrl = URL.createObjectURL(file);
            setPreviewThumbnail(previewUrl);
            setVideoFiles(prev => {
                // find video & add thumbnail in it 
                const videoObj = prev.find((v) => v.video.name === videoName)
                if (videoObj) {
                    videoObj.thumbnail = file;
                }
                return prev.map((Obj) => {
                    if (Obj.video.name === videoName) {
                        return videoObj
                    } return Obj
                })
            })
            setVideosDetails((prev) =>
                prev.map((videoDetail) => {
                    if (videoDetail.video.name === videoName) {
                        return {
                            ...videoDetail,
                            thumbnail: {
                                name: file.name,
                                type: file.type,
                                size: file.size
                            },
                        };
                    }
                    return videoDetail;
                })
            );
            return () => {
                URL.revokeObjectURL(previewUrl);
            };
        }
    };

    return (
        <>
            (<div className="underlay fixed z-30 top-0 left-0 max-h-screen overflow-y-auto scrollbar-thin w-screen bg-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[1px] border border-[rgba(255,255,255,0.18)] rounded-2xl flex items-center justify-center">
                <div className="z-40 px-4 py-3 my-2 max-h-screen overflow-y-auto scrollbar-thin lg:w-96 sm:rounded-2xl bg-[rgba(238,238,238,0.7)] shadow-[0px_0px_10px_0_rgba(31,38,135,0.37)] backdrop-blur-[4px] border border-[rgb(255,255,255)] ">
                    <h1 className='text-center font-bold text-desktopBodyLarge'>Fill this form for each video</h1>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <div className="flex-auto h-auto scrollbar-thin overflow-y-auto my-2 transition-all duration-200">
                        <div className="client-name p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <div className="tags mb-4 transition-all duration-200">
                                <h2 className="block text-center text-gray-700 font-medium mb-2">Tags</h2>
                                <div className=" cursor-pointer text-center text-sm h-10 w-full border-2 border-black bg-slate-300 rounded-md" onClick={() => { toogleCollapse('tags') }}>
                                    select the as many keyword for related to video
                                </div>
                                <div className={`bg-blue-300 all-tags ${collapsed.tags ? "max-h-40" : "max-h-0 overflow-y-scroll scrollbar-thin"}`}>
                                    {
                                        tagsData.map((tagType) => {
                                            return <div key={tagType.videoName} className="flex flex-wrap gap-2 w-full p-2">
                                                {
                                                    tagType.tags.map((t) => {
                                                        return <button key={t} type='button' className={`py-1 px-2 rounded-md bg-blue-100 ${videoDetails.find((vd) => vd.video.name === videoName).tags.find((tg) => tg === t ? true : false) ? "bg-blue-400" : ""}`}
                                                            onClick={() => handleTags(t)}
                                                        >{t}</button>
                                                    })
                                                }
                                            </div>
                                        })
                                    }

                                </div>

                            </div>
                            <div className="video-thumbnail my-4">
                                <h1 className='text-center font-semibold text-desktopBodyMedium py-2'>Add thumbnail</h1>
                                <div className="input-header flex items-center justify-between">
                                    <input
                                        id='thumbnail'
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="thumbnail">
                                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                                        Add</label>
                                    <div className="clear-all-video ">
                                        <button type='button' className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold'
                                            onClick={() => {
                                                setThumbnail(null)
                                                setPreviewThumbnail(null)
                                                setVideoFiles(prev =>
                                                    prev.map((videoObj) => {
                                                        if (videoObj.video.name === videoName) {
                                                            return {
                                                                ...videoObj,
                                                                thumbnail: null,
                                                            };
                                                        }
                                                        return prev
                                                    }))
                                                setVideosDetails(prev =>
                                                    prev.map((videoDetail) => {
                                                        if (videoDetail.video.name === videoName) {
                                                            return {
                                                                ...videoDetail,
                                                                thumbnail: null,
                                                            };
                                                        }
                                                        return prev
                                                    }))
                                            }}>
                                            <span>Clear</span>
                                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {
                                    previewThumbnail &&
                                    <img className=' py-2 rounded-lg w-full h-40 object-cover bg-center' src={previewThumbnail} alt="" />
                                }
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
                            <div className="isHero">
                                <h2 className='text-center'>Hero Video</h2>
                                <div className="flex items-center mb-4 justify-evenly ">
                                    <div className="flex items-center h-10 cursor-pointer">
                                        <input
                                            id="yes" type="radio" value="yes" name="isHeroVideo" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500  dark:bg-gray-700 dark:border-gray-600"
                                            onChange={() => handleIsHero(true)} />
                                        <label htmlFor="yes" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Yes</label>
                                    </div>
                                    <div className="flex items-center h-10 cursor-pointer">
                                        <input
                                            id="no" type="radio" value="no" name="isHeroVideo" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "
                                            defaultChecked={false} onChange={() => handleIsHero(false)} />
                                        <label htmlFor="no" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">No</label>
                                    </div>
                                </div>
                                {isHero &&
                                    <div className="hero-priority flex justify-evenly">
                                        <label htmlFor="hero-priority" className="block text-gray-700 font-medium mb-2">Hero video priority</label>
                                        <input value={heroVideoPriority} onBlur={handleSetHeroVideoPriority} onChange={(e) => setHeroVideoPriority(Number(e.target.value))} id='hero-priority' type="number" className="  border-gray-300 border rounded-lg p-1" required />
                                    </div>
                                }
                            </div>
                            <div className="general-priority">
                                <div className="hero-priority flex justify-evenly">
                                    <label htmlFor="hero-priority" className="block text-gray-700 font-medium mb-2">General video priority</label>
                                    <input value={generalPriority} onChange={(e) => setGeneralPriority(Number(e.target.value))} onBlur={handleGeneralPriority} id='state' type="number"
                                        className="  border-gray-300 border rounded-lg p-1"
                                        required />
                                </div>
                            </div>
                            <div className="video-shoot-date">
                                <label htmlFor="video-shoot-date" className="block text-gray-700 font-medium mb-2">Video Shoot Date</label>
                                <input value={videoShootDate} onChange={(e) => { setVideoShootDate(e.target.value); handleVideoShootDate(e.target.value) }} type="date" id="video-shoot-date" />
                            </div>
                            <div className="bts-details mb-4">
                                <h2 className="block text-gray-700 font-medium mb-2">BTS Info</h2>
                                <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded"
                                    onClick={addBtsEntry}>Add</button>
                                <div className="flex flex-col items-center gap-4">
                                    <p>Minimum one entry required</p>
                                    <div className="flex  items-center gap-4">
                                        <input onBlur={handleBtsEntry} type="text" placeholder="Colourist" value={btsEntry[0].key} className="w-full border-gray-300 border rounded-lg p-2"
                                            onChange={(e) => {
                                                setBtsEntry(prev => {
                                                    const newEntries = [...prev];
                                                    newEntries[0].key = e.target.value;
                                                    return newEntries;
                                                })
                                            }} />
                                        <input onBlur={handleBtsEntry} type="text" placeholder="XYZ" value={btsEntry[0].value} className="w-full border-gray-300 border rounded-lg p-2"
                                            onChange={(e) =>
                                                setBtsEntry((prev) => {
                                                    const newEntries = [...prev];
                                                    newEntries[0].value = e.target.value;
                                                    return newEntries;
                                                })} />
                                    </div>
                                    {videoDetails.find((videoDetail) => videoDetail.video.name === videoName).btsInfo &&
                                        videoDetails.find((videoDetail) => videoDetail.video.name === videoName).btsInfo.map((pair, idx) => {
                                            return !idx ? null : <div key={idx} className="flex items-center gap-4">
                                                <input onBlur={handleBtsEntry} type="text" placeholder="Key" value={pair.key} className="w-full border-gray-300 border rounded-lg p-2"
                                                    onChange={(e) => {
                                                        setBtsEntry(prev => {
                                                            const newEntries = [...prev];
                                                            newEntries[idx].key = e.target.value;
                                                            return newEntries;
                                                        })
                                                    }} />
                                                <input onBlur={handleBtsEntry} type="text" placeholder="Value" value={pair.value} className="w-full border-gray-300 border rounded-lg p-2"
                                                    onChange={(e) =>
                                                        setBtsEntry((prev) => {
                                                            const newEntries = [...prev];
                                                            newEntries[idx].value = e.target.value;
                                                            return newEntries;
                                                        })} />
                                                <button type='button' onClick={(e) => removeBtsEntry(idx)}>
                                                    <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                                </button>
                                            </div>
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <button type='button' className="w-full my-2 px-8 py-2 border-gray-800 border-[1px] bg-gray-200 rounded-lg" onClick={(e) => {
                        setVideoForm(prev => prev.map((f) => f.name === videoName ? { "isVideoFormVisible": false, "name": videoName } : f))
                    }}>Save</button>
                </div >
            </div >)
        </>
    )
}

export default VideoDetailsForm
