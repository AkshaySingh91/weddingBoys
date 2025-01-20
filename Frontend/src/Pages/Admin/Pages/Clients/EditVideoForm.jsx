import React from 'react'
import { fireMessage } from '../AuthPage/Signup';
import { useEffect, useState } from 'react';
const api_url = process.env.REACT_APP_API_URL;

function EditVideoForm({ thumbailFiles, setThumbnailFiles, id, isEditing, setVideoForm, tagsData, setTagsData, clientDetails, setClientDetails }) {
    const [collapsed, setCollapsed] = useState({ tags: false, });
    const [previewThumbnail, setPreviewThumbnail] =
        useState(clientDetails.videos.find((video) => video._id === id) ? clientDetails.videos.find((video) => video._id === id).thumbnailUrl : null);

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
                let videoDetails = prev.videos.find((video) => video._id === id)
                // video = {video : {}, isHero, tags ...}
                let isPresent = false;
                const withoutTag = videoDetails.tags.filter((tag) => {
                    if (tag === t) {
                        isPresent = true
                        return false
                    }
                    else {
                        return true
                    }
                })
                if (isPresent) {
                    prev.videos = prev.videos.map(v => { 
                        if (v._id === id) {
                            return { ...v, tags: withoutTag };
                        } return v;
                    })
                    return { ...prev }
                }
                prev.videos = prev.videos.map(v => {
                    if (v._id === id) {
                        return { ...v, tags: [...withoutTag, t] };
                    } return v;
                })
                return { ...prev }
            })
        }
    }
    const handleFileUpload = (e) => {
        if (e.target.files[0] && isEditing) {
            const f = e.target.files[0];
            let newName = `${f.name.split('.')[0]}_${Date.now()}.${f.name.split('.')[1]}`;
            let blob = f.slice(0, f.size);
            const file = new File([blob], newName, { type: f.type });

            // here we actully store file
            setThumbnailFiles(prev => [...prev, { thumbnail: file, _id: id }])
            // here we update thumbnail metadata for validating type
            setClientDetails(prev => {
                const videoDetails = prev.videos.find((video) => video._id === id)
                const thumbnailMeta = {
                    name: file.name, type: file.type, size: file.size
                };
                videoDetails.newThumbnailDetail = thumbnailMeta
                prev.videos = prev.videos.map(v => {
                    if (v._id === id) {
                        return videoDetails;
                    } return v;
                })
                return { ...prev }
            })
        }
    };
    useEffect(() => {
        if (clientDetails) {
            const video = clientDetails.videos.find((video) => video._id === id);
            if (video) {
                console.log(video)
                // Check if thumbnailMetaData is a string (URL) initially when page load
                // Check if newThumbnailDetail is an object (e.g., {name: , type: , size: })
                if (video.newThumbnailDetail && typeof video.thumbnailMetaData === 'object') {
                    const file = thumbailFiles.find((t) => t._id === id)?.thumbnail;
                    if (file) {
                        const previewUrl = URL.createObjectURL(file);
                        setPreviewThumbnail(previewUrl); // Create a preview URL for the new file
                    }
                }
            }
        }
    }, [clientDetails, thumbailFiles, id]);
    useEffect(() => {
        return () => {
            if (previewThumbnail) {
                URL.revokeObjectURL(previewThumbnail);
            }
        };
    }, [previewThumbnail]);

    return (
        <>
            (<div className="underlay fixed z-30 top-0 left-0 max-h-screen h-screen overflow-y-auto scrollbar-thin w-screen bg-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[1px] border border-[rgba(255,255,255,0.18)] rounded-2xl flex items-center justify-center">
                <div className="z-40 px-4 py-3 my-2 max-h-screen overflow-y-auto scrollbar-thin lg:w-96 sm:rounded-2xl bg-[rgba(238,238,238,0.7)] shadow-[0px_0px_10px_0_rgba(31,38,135,0.37)] backdrop-blur-[4px] border border-[rgb(255,255,255)] ">
                    <h1 className='text-center font-bold text-desktopBodyLarge'> video Details</h1>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <div className="flex-auto h-auto scrollbar-thin overflow-y-auto my-2 transition-all duration-200">
                        <div className="p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <div className="tags mb-4 transition-all duration-200">
                                <h2 className="block text-center text-gray-700 font-medium mb-2">Tags</h2>
                                <div className=" cursor-pointer text-center text-sm h-10 w-full border-2 border-black bg-slate-300 rounded-md" onClick={() => { toogleCollapse('tags') }}>
                                    select the as many keyword for related to video
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
                                                            className={`py-1 px-2 bg-blue-100 rounded-md  ${clientDetails.videos.find((vd) => vd._id === id).tags.find((tg) => tg === t) ? "bg-blue-400" : ""}`}
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
                                {
                                    isEditing &&
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
                                                    setPreviewThumbnail(null)
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.thumbnailMetaData = null
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                    setThumbnailFiles((prev) => prev.filter((t) => t._id !== id))
                                                }}>
                                                <span>Clear</span>
                                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                }
                                {
                                    previewThumbnail &&
                                    <img className=' py-2 rounded-lg w-full h-40 object-cover bg-center' src={previewThumbnail} alt="" />
                                }
                            </div>

                            <div className="location mb-4">
                                <div className="flex flex-col gap-2 ">
                                    <h2 className='text-center'>Location</h2>
                                    <div className="flex justify-evenly">
                                        <label htmlFor='country' className="block text-gray-700 font-medium mb-2">country</label>
                                        <input
                                            id='country' type="text"
                                            className=" border-gray-300 border rounded-lg p-1"
                                            value={clientDetails.videos.find((v) => v._id === id)?.videoLocation?.country}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.videoLocation.country = e.target.value
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
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
                                            value={clientDetails.videos.find((v) => v._id === id)?.videoLocation?.state}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.videoLocation.state = e.target.value
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
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
                                            value={clientDetails.videos.find((v) => v._id === id)?.videoLocation?.city}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.videoLocation.city = e.target.value
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
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
                            <div className="isHero">
                                <h2 className='text-center'>Hero Video</h2>
                                <div className="flex items-center mb-4 justify-evenly ">
                                    <div className="flex items-center h-10 cursor-pointer">
                                        <input
                                            id="yes" type="radio" value="yes" name="isHeroVideo" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500  dark:bg-gray-700 dark:border-gray-600"
                                            defaultChecked={clientDetails.videos.find((video) => video._id === id)?.isHeroVideo}
                                            onChange={() => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.isHeroVideo = true
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }} />
                                        <label htmlFor="yes" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Yes</label>
                                    </div>
                                    <div className="flex items-center h-10 cursor-pointer">
                                        <input
                                            id="no" type="radio" value="no" name="isHeroVideo" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "
                                            defaultChecked={clientDetails.videos.find((video) => video._id === id)?.isHeroVideo ? false : true}
                                            onChange={() => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.isHeroVideo = false
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }} />
                                        <label htmlFor="no" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">No</label>
                                    </div>
                                </div>
                                {clientDetails.videos.find((video) => video._id === id)?.isHeroVideo &&
                                    <div className="hero-priority flex justify-evenly">
                                        <label htmlFor="hero-priority" className="block text-gray-700 font-medium mb-2">Hero video priority</label>
                                        <input
                                            className="  border-gray-300 border rounded-lg p-1" required
                                            id='hero-priority' type="number"
                                            value={clientDetails.videos.find((v) => v._id === id)?.heroPriority}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.heroPriority = e.target.value
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }} />
                                    </div>
                                }
                            </div>
                            <div className="general-priority">
                                <div className="hero-priority flex justify-evenly">
                                    <label htmlFor="hero-priority" className="block text-gray-700 font-medium mb-2">General video priority</label>
                                    <input
                                        id='state' type="number" required
                                        className="  border-gray-300 border rounded-lg p-1"
                                        value={clientDetails.videos.find((v) => v._id === id)?.generalPriority}
                                        onChange={(e) => {
                                            if (isEditing) {
                                                setClientDetails(prev => {
                                                    const videoDetails = prev.videos.find((video) => video._id === id)
                                                    videoDetails.generalPriority = e.target.value
                                                    prev.videos = prev.videos.map(v => {
                                                        if (v._id === id) {
                                                            return videoDetails;
                                                        } return v;
                                                    })
                                                    return { ...prev }
                                                })
                                            }
                                        }} />
                                </div>
                            </div>
                            <div className="video-shoot-date">
                                <label htmlFor="video-shoot-date" className="block text-gray-700 font-medium mb-2">Video Shoot Date</label>
                                <input
                                    type="date" id="video-shoot-date"
                                    value={clientDetails.videos.find((v) => v._id === id)?.videoShootDate
                                        ? new Date(clientDetails.videos.find((v) => v._id === id)?.videoShootDate).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onChange={(e) => {
                                        if (isEditing) {
                                            setClientDetails(prev => {
                                                const videoDetails = prev.videos.find((video) => video._id === id)
                                                videoDetails.videoShootDate = e.target.value
                                                prev.videos = prev.videos.map(v => {
                                                    if (v._id === id) {
                                                        return videoDetails;
                                                    } return v;
                                                })
                                                return { ...prev }
                                            })
                                        }
                                    }} />
                            </div>
                            <div className="bts-details mb-4">
                                <h2 className="block text-gray-700 font-medium mb-2">BTS Info</h2>
                                <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded"
                                    onClick={() => {
                                        if (isEditing) {
                                            setClientDetails(prev => {
                                                const videoDetails = prev.videos.find((video) => video._id === id)
                                                videoDetails.bts = [...videoDetails.bts, { key: '', value: '' }]
                                                prev.videos = prev.videos.map(v => {
                                                    if (v._id === id) {
                                                        return videoDetails;
                                                    } return v;
                                                })
                                                return { ...prev }
                                            })
                                        }
                                    }}>Add</button>
                                <div className="flex flex-col items-center gap-4">
                                    <p>Minimum one entry required</p>
                                    <div className="flex  items-center gap-4">
                                        <input type="text" placeholder="Colourist"
                                            className="w-full border-gray-300 border rounded-lg p-2"
                                            value={clientDetails.videos.find((video) => video._id === id)?.bts.length && clientDetails.videos.find((video) => video._id === id)?.bts[0].key}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.bts[0] = { key: e.target.value, value: videoDetails.bts[0].value }
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }} />
                                        <input type="text" placeholder="XYZ"
                                            className="w-full border-gray-300 border rounded-lg p-2"
                                            value={clientDetails.videos.find((video) => video._id === id)?.bts.length && clientDetails.videos.find((video) => video._id === id)?.bts[0].value}
                                            onChange={(e) => {
                                                if (isEditing) {
                                                    setClientDetails(prev => {
                                                        const videoDetails = prev.videos.find((video) => video._id === id)
                                                        videoDetails.bts[0] = { key: videoDetails.bts[0].key, value: e.target.value }
                                                        prev.videos = prev.videos.map(v => {
                                                            if (v._id === id) {
                                                                return videoDetails;
                                                            } return v;
                                                        })
                                                        return { ...prev }
                                                    })
                                                }
                                            }} />
                                    </div>
                                    {clientDetails.videos.find((video) => video._id === id)?.bts.length &&
                                        clientDetails.videos.find((video) => video._id === id).bts.map((pair, idx) => {
                                            return !idx ? null :
                                                <div key={idx} className="flex items-center gap-4">
                                                    <input type="text" placeholder="Key" value={pair.key} className="w-full border-gray-300 border rounded-lg p-2"
                                                        onChange={(e) => {
                                                            if (isEditing) {
                                                                setClientDetails(prev => {
                                                                    const videoDetails = prev.videos.find((video) => video._id === id)
                                                                    videoDetails.bts[idx].key = e.target.value
                                                                    prev.videos = prev.videos.map(v => {
                                                                        if (v._id === id) {
                                                                            return videoDetails;
                                                                        } return v;
                                                                    })
                                                                    return { ...prev }
                                                                })
                                                            }
                                                        }} />
                                                    <input type="text" placeholder="Value" value={pair.value} className="w-full border-gray-300 border rounded-lg p-2"
                                                        onChange={(e) => {
                                                            if (isEditing) {
                                                                setClientDetails(prev => {
                                                                    const videoDetails = prev.videos.find((video) => video._id === id)
                                                                    videoDetails.bts[idx].value = e.target.value
                                                                    prev.videos = prev.videos.map(v => {
                                                                        if (v._id === id) {
                                                                            return videoDetails;
                                                                        } return v;
                                                                    })
                                                                    return { ...prev }
                                                                })
                                                            }
                                                        }} />
                                                    <button type='button'
                                                        onClick={(e) => {
                                                            if (isEditing) {
                                                                setClientDetails(prev => {
                                                                    const videoDetails = prev.videos.find((video) => video._id === id)
                                                                    videoDetails.bts = videoDetails.bts.filter((pair, i) => {
                                                                        return i !== idx;
                                                                    })
                                                                    prev.videos = prev.videos.map(v => {
                                                                        if (v._id === id) {
                                                                            return videoDetails;
                                                                        } return v;
                                                                    })
                                                                    return { ...prev }
                                                                })
                                                            }
                                                        }}>
                                                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                                    </button>
                                                </div>
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr className='border-1 border-gray-600 text-center mx-auto' />
                    <button
                        type='button' className="w-full my-2 px-8 py-2 border-gray-800 border-[1px] bg-gray-200 rounded-lg"
                        onClick={() => {
                            setVideoForm(prev => prev.map((f) => f.id === id ? { "isVideoFormVisible": false, "id": id } : f))
                        }}
                    >{isEditing ? "Save" : "Cancle"}</button>
                </div >
            </div >)
        </>
    )
}

export default EditVideoForm
