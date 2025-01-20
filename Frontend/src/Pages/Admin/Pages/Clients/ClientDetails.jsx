import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fireMessage } from '../AuthPage/Signup';
import Loader from '../../../../Component/Loader'
import EditVideoForm from './EditVideoForm';
import EditPhotoForm from './EditPhotoForm';
import VideoDetailsForm from '../AddClient/VideoDetailsForm';
import PhotoDetailsForm from '../AddClient/PhotoDetailsForm';
import Swal from 'sweetalert2'
const api_url = process.env.REACT_APP_API_URL;

function ClientDetails() {
    const { id } = useParams();
    const [clientDetails, setClientDetails] = useState(null)
    const [originalClientDetails, setOriginalClientDetails] = useState(null)
    const [isEditing, setIsEditing] = useState(false);
    const [tagsData, setTagsData] = useState([]);
    const [videoForm, setVideoForm] = useState([]);
    const [photoForm, setPhotoForm] = useState([]);
    // to display new added file
    const [previewVideos, setPreviewVideos] = useState([]);
    const [previewPhotos, setPreviewPhotos] = useState([]);
    const [newVideoForm, setNewVideoForm] = useState([]);
    const [newPhotoForm, setNewPhotoForm] = useState([]);
    const [videoDetails, setVideosDetails] = useState([])
    const [photoDetails, setPhotosDetails] = useState([]);
    const [photoFiles, setPhotosFiles] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);
    const [thumbnailFiles, setThumbnailFiles] = useState([]);

    useEffect(() => {
        try {
            async function fetchClientDetails() {
                try {
                    const res = await fetch(`${api_url}/admin/api/client/${id}`, {
                        method: "GET",
                        credentials: "include"
                    })
                    const data = await res.json()
                    if (res.status >= 300) {
                        return fireMessage(data.message, 'error')
                    }
                    setClientDetails(structuredClone(data.clientDetails)); // Deep copy
                    setOriginalClientDetails(structuredClone(data.clientDetails)); // Deep copy
                    const videoForm = data.clientDetails.videos.map(v => (
                        { "isVideoFormVisible": false, "id": v._id }));
                    const photoForm = data.clientDetails.photos.map(p => (
                        { "isPhotoFormVisible": false, "id": p._id }));
                    setVideoForm(videoForm);
                    setPhotoForm(photoForm);
                } catch (error) {
                    console.log(error)
                    return fireMessage(error.message, 'error')
                }
            }
            fetchClientDetails()
        } catch (error) {
            return fireMessage(error.message, 'error')
        }
    }, [id]);

    useEffect(() => {
        let isVideoFormVisible = false, isPhotoFormVisible = false;
        videoForm.forEach((form) => {
            if (form.isVideoFormVisible) {
                isVideoFormVisible = true; return;
            }
        })
        photoForm.forEach((form) => {
            if (form.isPhotoFormVisible) {
                isPhotoFormVisible = true; return;
            }
        })
        if (isVideoFormVisible || isPhotoFormVisible) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [videoForm, photoForm]);
    
    const handleFileChange = (e, type) => {
        let files = Array.from(e.target.files);
        // add date in file to avoid name conflict 
        files = files.map((file) => {
            let newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`
            let blob = file.slice(0, file.size);
            return new File([blob], newName, { type: file.type })
        })
        if (type === 'video') {
            const videoUrl = files.map((video) => {
                return {
                    name: video.name,
                    url: URL.createObjectURL(video)
                }
            })
            setVideoFiles(prev => ([...prev, ...files.map(f => { return { video: f, thumbnail: null } })]))
            setPreviewVideos(prev => [...prev, ...videoUrl]);
            setVideosDetails((prev) => {
                return [
                    ...prev, ...files.map((video) => {
                        return {
                            video: {
                                type: video.type,
                                name: video.name,
                                size: video.size
                            },
                            tags: [],
                            location: {
                                country: '',
                                state: '',
                                city: '',
                            },
                            isHeroVideo: false,
                            heroPriority: null,
                            generalPriority: null,
                            btsInfo: [{ key: '', value: '' }],
                            shootDate: null,
                        }
                    })
                ]
            });
            const form = files.map((video) => {
                return { "isVideoFormVisible": false, "name": video.name }
            })
            setNewVideoForm(prev => [...prev, ...form]);
        } else {
            setPhotosFiles(prev => [...prev, ...files])
            setPhotosDetails((prev) => {
                return [
                    ...prev, ...files.map((photo) => {
                        return {
                            photo: {
                                type: photo.type,
                                name: photo.name,
                                size: photo.size
                            },
                            tags: [],
                            location: {
                                country: '',
                                state: '',
                                city: '',
                            },
                            generalPriority: null,
                            shootDate: null,
                        }
                    })
                ]
            })
            const photoUrl = files.map((photo) => {
                return {
                    name: photo.name,
                    url: URL.createObjectURL(photo)
                }
            })
            setPreviewPhotos(prev => [...prev, ...photoUrl]);
            const form = files.map((video) => {
                return { "isPhotoFormVisible": false, "name": video.name }
            })
            setNewPhotoForm(prev => [...prev, ...form])
        }
    };
    const handleEdit = () => {
        setIsEditing(true);
    };
    const uploadFileInBucket = async (file, presignedUrl) => {
        try {
            const response = await fetch(presignedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                },
                body: file,
            });

            if (response.ok && response.status === 200) {
                console.log('File uploaded successfully!');
            } else {
                console.error('Failed to upload file:', response.status, response.statusText);
            }
        } catch (error) {
            fireMessage(error.message, 'error')
            console.error('Error uploading file:', error);
        }
    }
    const handleSave = async (e) => {
        e.preventDefault();
        const saveClientDetails = async (urls) => {
            try {
                const { oldVideoThumbnailUrl, newVideosUrl, newPhotosUrl } = urls;
                // update key for each thumbnail to respective video 
                let oldVideos = clientDetails.videos;
                for (const thumbnailObj of oldVideoThumbnailUrl) {
                    oldVideos = oldVideos.map((oldVideo) => {
                        if (oldVideo._id === thumbnailObj.videoId) {
                            oldVideo.thumbnailMetaData = {
                                key: thumbnailObj.thumbnailKey
                            }
                            return oldVideo
                        }
                        return oldVideo
                    })
                }
                // add file key to each file 
                // all these are new videos & photos & we have to change key name & match it with old video & photo keys
                const newVideosMetaData = videoDetails.map((v) => {
                    const urlOfThisVideo = newVideosUrl.find((videoUrl) => videoUrl.videoName === v.video.name)
                    let videoKey = null, thumbnailKey = null;
                    if (urlOfThisVideo) {
                        videoKey = urlOfThisVideo.videoKey;
                        thumbnailKey = urlOfThisVideo.thumbnailKey
                    }
                    return {
                        ...v,
                        videoMetaData: {
                            key: videoKey
                        },
                        thumbnailMetaData: {
                            key: thumbnailKey
                        },
                        bts: v.btsInfo,
                        videoLocation: v.location,
                        videoShootDate: v.shootDate,
                    }
                })
                const newPhotoMetaData = photoDetails.map((p) => {
                    const urlOfThisPhoto = newPhotosUrl.find((photoUrl) => photoUrl.photoName === p.photo.name)
                    let photoKey = null;
                    if (urlOfThisPhoto) {
                        photoKey = urlOfThisPhoto.photoKey;
                    }
                    return {
                        ...p,
                        photoLocation: p.location,
                        photoShootDate: p.shootDate,
                        photoMetaData: {
                            key: photoKey
                        }
                    }
                })
                const newVideoAndOldVideoWithNewThumb = [...newVideosMetaData, ...oldVideos]
                const newPhotoAndOldPhoto = [...newPhotoMetaData, ...clientDetails.photos]
                const res = await fetch(`${api_url}/admin/api/client/${id}/save-details`, {
                    method: "PUT",
                    body: JSON.stringify({
                        'bride': clientDetails.clientName.Bride,
                        'groom': clientDetails.clientName.Groom,
                        'videoDetails': newVideoAndOldVideoWithNewThumb,
                        'photosDetails': newPhotoAndOldPhoto
                    }),
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await res.json();
                if (res.status >= 300) {
                    throw new Error(data.message)
                }
                return { isValid: true, message: "Client details had been added" }
            }
            catch (error) {
                console.log(error);
                return { isValid: false, message: error.message }
            }
        }

        const uploadMedia = async (urls) => {
            try {
                const { oldVideoThumbnailUrl, newVideosUrl, newPhotosUrl } = urls;
                /* oldVideoThumbnailUrl = thumbnailKey,thumbnailPutUrl, videoId
                    newVideosUrl = thumbnailKey, thumbnailPutUrl, videoKey, videoPutUrl
                    newPhotosUrl = photoPutUrl, photoKey
                    find video which id = videoId for new thumbnail
                */
                let i = 0;
                for (const thumbnailObj of oldVideoThumbnailUrl) {
                    await uploadFileInBucket(thumbnailFiles[i].thumbnail, thumbnailObj.thumbnailPutUrl)
                    i++;
                }
                // upload newly added videos & photos in s3
                let j = 0;
                for (const videoObj of newVideosUrl) {
                    await uploadFileInBucket(videoFiles[j].video, videoObj.videoPutUrl)
                    await uploadFileInBucket(videoFiles[j].thumbnail, videoObj.thumbnailPutUrl)
                    j++;
                }
                let k = 0;
                for (const photoObj of newPhotosUrl) {
                    await uploadFileInBucket(photoFiles[k], photoObj.photoPutUrl)
                    k++;
                }
                return { isValid: true }
            } catch (error) {
                console.log(error)
                return { isValid: false, message: error.message }
            }
        }
        const verifyDetails = async () => {
            try {
                // change key format of old details before validation 
                const oldVideos = clientDetails.videos.map((v) => {
                    return {
                        ...v,
                        shootDate: v.videoShootDate,
                        location: v.videoLocation,
                        btsInfo: v.bts,
                    }
                })
                const oldPhotos = clientDetails.photos.map((v) => {
                    return {
                        ...v,
                        shootDate: v.photoShootDate,
                        location: v.photoLocation,
                    }
                })
                const res = await fetch(`${api_url}/admin/api/client/${id}/validate-details`, {
                    method: "PUT",
                    body: JSON.stringify({
                        'bride': clientDetails.clientName.Bride,
                        'groom': clientDetails.clientName.Groom,
                        'oldVideosDetails': oldVideos,
                        'oldPhotosDetails': oldPhotos,
                        'newVideosDetails': videoDetails,
                        'newPhotosDetails': photoDetails,
                    }),
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await res.json();
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error');
                } else {
                    Swal.fire({
                        title: "Are you sure?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "green",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Yes, upload it!"
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                let response = await uploadMedia(data.urls);
                                if (response.isValid) {
                                    // save file detail in DB
                                    response = await saveClientDetails(data.urls);
                                    if (response.isValid) {
                                        Swal.fire({
                                            title: "Success!",
                                            text: response.message || "All files have been uploaded successfully.",
                                            icon: "success",
                                            timer: 2000,
                                            showConfirmButton: false
                                        });
                                    } else {
                                        throw new Error(response.message || "Failed to save details.");
                                    }
                                } else {
                                    throw new Error(response.message || "Failed to upload files.");
                                }
                            } catch (error) {
                                Swal.fire({
                                    title: "Error!",
                                    text: error.message || "Something went wrong during upload.",
                                    icon: "error",
                                    confirmButtonColor: "#d33"
                                });
                            }
                        }
                    });

                };

            } catch (error) {
                return fireMessage(error.message, 'error');
            }
        }
        verifyDetails();
    };
    const handleCancel = () => {
        setIsEditing(false);
        setClientDetails(structuredClone(originalClientDetails))
        setNewVideoForm([])
        setPreviewVideos([])
        setVideosDetails([])
        setThumbnailFiles([])
        setVideoFiles([])
        setNewPhotoForm([])
        setPhotosDetails([])
        setPreviewPhotos([])
        setPhotosFiles([])
    };
    return (<>
        {
            !clientDetails ?
                <Loader /> :
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold mb-4">Client Details</h1>
                    <div className="flex justify-end mb-4">
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
                    <form className='flex flex-col gap-2' encType='multipart/form-data'>
                        <div className="client-name p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <h1 className='text-center text-desktopBodyLarge font-bold'>Client Name</h1>
                            <div className="bride-name mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Bride's Name</label>
                                <input
                                    type="text"
                                    name='Bride'
                                    value={clientDetails.clientName.Bride}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                        setClientDetails(prev => {
                                            return { ...prev, clientName: { ...prev.clientName, ...{ Bride: e.target.value } } }
                                        })
                                    }}
                                    className="w-full border-gray-300 border rounded-lg p-2"
                                    placeholder="Enter Bride's Name"
                                />
                            </div>
                            <div className="groom-name mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Groom's Name</label>
                                <input
                                    type="text"
                                    name="groom"
                                    value={clientDetails.clientName.Groom}
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                        setClientDetails(prev => {
                                            return { ...prev, clientName: { ...prev.clientName, ...{ Groom: e.target.value } } }
                                        })
                                    }}
                                    className="w-full border-gray-300 border rounded-lg p-2"
                                    placeholder="Enter Groom's Name"
                                />
                            </div>
                        </div>

                        <div className="mb-4 p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <h1 className='text-center text-desktopBodyLarge font-bold'>Client Videos</h1>
                            {
                                isEditing &&
                                <div className="input-header flex items-center  justify-between">
                                    <input
                                        id='videos'
                                        type="file"
                                        accept="video/mp4"
                                        multiple
                                        onChange={(e) => { handleFileChange(e, 'video') }}
                                        className="hidden"
                                    />
                                    <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="videos">
                                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                                        Add</label>
                                </div>
                            }
                            <div className="all-videos mt-4 grid grid-cols-2 gap-4">
                                {/* show newly added videos */}
                                {previewVideos.map((video) => (
                                    <div key={video.name} className="video relative flex flex-col justify-center gap-2">
                                        <div className="video-preview">
                                            <video
                                                controls
                                                className="w-full h-40 object-cover rounded-md shadow"
                                                src={video.url}
                                            />
                                        </div>
                                        {/* delete specific video */}
                                        <button type='button' className='absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                            onClick={() => {
                                                setPreviewVideos(() => {
                                                    return previewVideos.filter((v) => {
                                                        return v.name !== video.name
                                                    })
                                                })
                                                setVideoFiles(prev => prev.filter((v) => v.name !== video.name))
                                                setVideosDetails((prev) => prev.filter((vd) => vd.video.name !== video.name))
                                                setNewVideoForm((prev) => prev.filter((vd) => vd.name !== video.name))
                                            }}>
                                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                        </button>
                                        <button type='button'
                                            className='text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold'
                                            onClick={() => {
                                                setNewVideoForm(newVideoForm.map((form) => {
                                                    if (form.name === video.name) {
                                                        return { isVideoFormVisible: true, name: form.name };
                                                    } return form;
                                                }))
                                            }}
                                        >Add Details</button>
                                        {
                                            newVideoForm.find((f) => f.name === video.name)?.isVideoFormVisible &&
                                            <VideoDetailsForm
                                                videoFiles={videoFiles}
                                                setVideoFiles={setVideoFiles}
                                                tagsData={tagsData}
                                                setTagsData={setTagsData}
                                                videoDetails={videoDetails}
                                                setVideosDetails={setVideosDetails}
                                                setVideoForm={setNewVideoForm}
                                                videoName={video.name}
                                            />
                                        }
                                    </div>
                                ))}
                                {/* show already added video */}
                                {clientDetails.videos && clientDetails.videos.map((video) => (
                                    <div key={video._id} data-sdfs={video._id} className="video relative flex flex-col justify-center gap-2">
                                        <video
                                            controls
                                            className="w-full h-40 object-cover rounded-md shadow"
                                            src={video.videoUrl}
                                        />
                                        {isEditing && (
                                            <button
                                                type='button'
                                                className='absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                                onClick={() => {
                                                    setClientDetails(prev => {
                                                        return {
                                                            ...prev, videos: prev.videos.filter((v) => {
                                                                return v._id !== video._id
                                                            })
                                                        }
                                                    })
                                                }}>
                                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black">
                                                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            type='button'
                                            className='text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold'
                                            onClick={() => {
                                                setVideoForm(prev => prev.map((v) => {
                                                    if (v.id === video._id) {
                                                        return { isVideoFormVisible: true, id: v.id };
                                                    } return v;
                                                }));
                                            }}>Add/Edit Details</button>
                                        {
                                            videoForm.find((form) => form.id === video._id && form.isVideoFormVisible) && (
                                                <EditVideoForm
                                                    thumbailFiles={thumbnailFiles}
                                                    setThumbnailFiles={setThumbnailFiles}
                                                    id={video._id}
                                                    isEditing={isEditing}
                                                    setVideoForm={setVideoForm}
                                                    tagsData={tagsData}
                                                    setTagsData={setTagsData}
                                                    clientDetails={clientDetails}
                                                    setClientDetails={setClientDetails}
                                                />
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                            <h1 className='text-center text-desktopBodyLarge font-bold'>Client Photos</h1>
                            {
                                isEditing &&
                                <div className="input-header flex items-center  justify-between">
                                    <input
                                        id='photos'
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => { handleFileChange(e, 'photos') }}
                                        className="hidden"
                                    />
                                    <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="photos">
                                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                                        Add</label>
                                </div>
                            }
                            <div className="all-photos mt-4 grid grid-cols-2 gap-4">
                                {/* show newly added photo */}
                                {previewPhotos.map((photo) => (
                                    <div key={photo.name} className="photo relative flex flex-col justify-center gap-2">
                                        <div className="photo-preview">
                                            <img
                                                alt='preview-image'
                                                className="w-full h-40 object-cover rounded-md shadow"
                                                src={photo.url}
                                            />
                                        </div>
                                        {/* delete specific photo */}
                                        <button type='button' className='absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                            onClick={() => {
                                                setPreviewPhotos(() => {
                                                    return previewPhotos.filter((v) => {
                                                        return v.name !== photo.name
                                                    })
                                                })
                                                setPhotosFiles(prev => prev.filter((p) => p.photo.name !== photo.name))
                                                setPhotosDetails((prev) => prev.filter((vd) => vd.photo.name !== photo.name))
                                                setNewPhotoForm((prev) => prev.filter((vd) => vd.name !== photo.name))
                                            }}>
                                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                        </button>
                                        <button type='button' className='text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold'
                                            onClick={() => {
                                                setNewPhotoForm(newPhotoForm.map((form) => {
                                                    if (form.name === photo.name) {
                                                        return { isPhotoFormVisible: true, name: form.name };
                                                    } return form;
                                                }))
                                            }}
                                        >Add Details</button>
                                        {
                                            newPhotoForm.find((f) => {
                                                return f.name === photo.name
                                            }).isPhotoFormVisible &&
                                            <PhotoDetailsForm
                                                tagsData={tagsData}
                                                setTagsData={setTagsData}
                                                photosDetails={photoDetails}
                                                setPhotoDetails={setPhotosDetails}
                                                setPhotoForm={setNewPhotoForm}
                                                photoName={photo.name}
                                            />
                                        }
                                    </div>
                                ))}

                                {clientDetails.photos && clientDetails.photos.map((photo) => (
                                    <div key={photo._id} className="photo relative flex flex-col justify-center gap-2">
                                        <img
                                            className="w-full h-40 object-cover rounded-md shadow"
                                            src={photo.photoUrl}
                                            alt={`client-photo`}
                                        />
                                        {isEditing && (
                                            <button
                                                type='button'
                                                className='deleted-photo absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                                onClick={() => {
                                                    setClientDetails(prev => {
                                                        return {
                                                            ...prev, photos: prev.photos.filter((p) => {
                                                                return p._id !== photo._id
                                                            })
                                                        }
                                                    })
                                                }}>
                                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black">
                                                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            type='button'
                                            className='text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold'
                                            onClick={() => {
                                                setPhotoForm(prev => prev.map((p) => {
                                                    if (p.id === photo._id) {
                                                        return { isPhotoFormVisible: true, id: p.id };
                                                    } return p;
                                                }));
                                            }}
                                        >Add/Edit Details</button>
                                        {
                                            photoForm.find((form) => form.id === photo._id && form.isPhotoFormVisible) && (
                                                <EditPhotoForm
                                                    id={photo._id}
                                                    isEditing={isEditing}
                                                    setPhotoForm={setPhotoForm}
                                                    tagsData={tagsData}
                                                    setTagsData={setTagsData}
                                                    clientDetails={clientDetails}
                                                    setClientDetails={setClientDetails}
                                                />
                                            )
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form >
                </div >
        }

    </>)
}

export default ClientDetails
