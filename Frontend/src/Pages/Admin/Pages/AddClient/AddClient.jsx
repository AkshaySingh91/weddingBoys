import React, { useState, useEffect } from 'react';
import VideoDetailsForm from './VideoDetailsForm';
import PhotoDetailsForm from './PhotoDetailsForm';
import { fireMessage } from '../AuthPage/Signup';
import Swal from 'sweetalert2'
const api_url = process.env.REACT_APP_API_URL;

const AddClient = () => {
    const [brideName, setBrideName] = useState('Bride');
    const [groomName, setGroomName] = useState('Groom');
    const [tagsData, setTagsData] = useState([]);
    const [videoDetails, setVideosDetails] = useState([{
        video: null,    //this is video metadata that will go on verification
        tags: [],
        location: {
            country: 'India',
            state: 'Maharastra',
            city: 'Pune',
        },
        isHeroVideo: false,
        heroPriority: null,
        generalPriority: null,
        btsInfo: [{ key: '', value: '' }],
        shootDate: null,
    }])
    // this is actual files that will upload on s3 
    const [videoFiles, setVideoFiles] = useState([])
    const [photoFiles, setPhotoFiles] = useState([])
    const [photosDetails, setPhotosDetails] = useState([{
        photo: null,
        tags: [],
        location: {
            country: '',
            state: '',
            city: '',
        },
        generalPriority: null,
        shootDate: null,
    }]);
    const [previewVideos, setPreviewVideos] = useState([]);
    const [previewPhotos, setPreviewPhotos] = useState([]);
    const [videoForm, setVideoForm] = useState([]);
    const [photoForm, setPhotoForm] = useState([]);
    const [isInMap, setIsInMap] = useState(false);
    const [coordinate, setCoordinate] = useState({ latitude: 32.455, longitute: -23.45 });

    const handleFileChange = (e, type) => {
        let files = Array.from(e.target.files);
        // add date in file to avoid name confilict  
        files = files.map((file) => {
            let newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`
            let blob = file.slice(0, file.size);
            return new File([blob], newName, { type: file.type })
        })
        // from here we got file with new name just to avoid frontend name conflict 
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
                const filteredPrev = prev.filter((item) => item.video !== null);
                return [
                    ...filteredPrev, ...files.map((video) => {
                        return {
                            video: {
                                name: video.name,
                                type: video.type,
                                size: video.size,
                            },
                            thumbnail: null,
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
            setVideoForm(prev => [...prev, ...form]);
        } else {
            const photoUrl = files.map((photo) => {
                return {
                    name: photo.name,
                    url: URL.createObjectURL(photo)
                }
            })
            setPhotoFiles(prev => [...prev, ...files])
            setPhotosDetails((prev) => {
                const filteredPrev = prev.filter((item) => item.photo !== null);
                return [
                    ...filteredPrev, ...files.map((photo) => {
                        return {
                            photo: {
                                name: photo.name,
                                type: photo.type,
                                size: photo.size,
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
            setPreviewPhotos(prev => [...prev, ...photoUrl]);
            const form = files.map((video) => {
                return { "isPhotoFormVisible": false, "name": video.name }
            })
            setPhotoForm(prev => [...prev, ...form])
        }
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
                throw new Error(`Failed to upload file ${response.status} ${response.statusText}`)
            }
        } catch (error) {
            fireMessage(error.message, 'error')
            console.error('Error uploading file:', error);
        }
    }
    const handleSubmit = async (e) => {
        const saveClientDetails = async (urls) => {
            try {
                // add file key to each file 
                let i = -1;
                console.log(videoDetails, photosDetails)
                const videosMetaData = videoDetails.map((v) => {
                    i++;
                    return {
                        ...v,
                        video: {
                            key: urls.videosUrl[i].videoKey
                        },
                        thumbnail: {
                            key: urls.videosUrl[i].thumbnailKey
                        }
                    }
                })
                i = -1
                const photoMetaData = photosDetails.map((p) => {
                    i++;
                    return { ...p, photo: { key: urls.photosUrl[i].photoKey } }
                })
                const res = await fetch(`${api_url}/admin/api/add-client/save-details`, {
                    method: "POST",
                    body: JSON.stringify({
                        clientDetails: {
                            'bride': brideName,
                            'groom': groomName,
                            'isInMap': isInMap.toString(),
                            'coordinate': coordinate,
                            'videoDetails': videosMetaData,
                            'photosDetails': photoMetaData
                        }
                    }),
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await res.json();
                if (res.status >= 300) {
                    console.log(data, res.status);
                    return fireMessage(data.message, 'error');
                }
            }
            catch (error) {
                console.log(error);
                return fireMessage(error.message, 'error');
            }
        }
        e.preventDefault();
        const uploadMedia = async (urls) => {
            try {
                const { videosUrl, photosUrl } = urls;
                console.log(urls)
                let i = 0;
                for (const videoObj of videosUrl) {
                    await uploadFileInBucket(videoFiles[i].video, videoObj.videoPutUrl)
                    await uploadFileInBucket(videoFiles[i].thumbnail, videoObj.thumbnailPutUrl)
                    i++;
                }
                let j = 0;
                for (const photoObj of photosUrl) {
                    await uploadFileInBucket(photoFiles[j], photoObj.photoPutUrl)
                    j++;
                }
                return { isUploaded: true, message: "Client details had been added." }
            } catch (error) {
                console.log(error)
                fireMessage(error.message, 'error')
            }
        }
        const verifyDetails = async () => {
            try {
                const res = await fetch(`${api_url}/admin/api/add-client/validate-details`, {
                    method: "POST",
                    body: JSON.stringify({
                        'bride': brideName,
                        'groom': groomName,
                        'isInMap': isInMap.toString(),
                        'coordinate': coordinate,
                        'videoDetails': videoDetails,
                        'photosDetails': photosDetails
                    }),
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await res.json()
                if (res.status >= 300) {
                    console.log(data, res.status)
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
                            Swal.fire({
                                title: "Uploading...",
                                text: "Please wait while your files are being uploaded.",
                                allowEscapeKey: false,
                                allowOutsideClick: false,
                                showConfirmButton: false,
                                willOpen: () => {
                                    Swal.showLoading();
                                }
                            });

                            try {
                                const { isUploaded, message } = await uploadMedia(data.urls);
                                if (isUploaded) {
                                    // save file detail in DB
                                    await saveClientDetails(data.urls);
                                    Swal.fire({
                                        title: "Success!",
                                        text: message || "All files have been uploaded successfully.",
                                        icon: "success",
                                        timer: 2000,
                                        showConfirmButton: false
                                    });
                                } else {
                                    throw new Error(message || "Failed to upload files.");
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
                console.log(error)
                fireMessage(error.message, 'error')
            }
        }
        verifyDetails();
    };

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
    return (
        <div className="max-w-4xl min-w-96 mx-auto bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">Add Wedding Client Details</h1>
            <form className='flex flex-col gap-2' onSubmit={handleSubmit} encType='multipart/form-data'>
                {/* Bride and Groom Names */}
                <div className="client-name p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                    <h1 className='text-center text-desktopBodyLarge font-bold'>Client Name </h1>
                    <div className="bride-name mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Bride's Name</label>
                        <input type="text"
                            name='Bride'
                            value={brideName}
                            onChange={(e) => setBrideName(e.target.value)}
                            className="w-full border-gray-300 border rounded-lg p-2"
                            placeholder="Enter Bride's Name"
                            required />
                    </div>
                    <div className="groom-name mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Groom's Name</label>
                        <input type="text"
                            name="groom"
                            value={groomName}
                            onChange={(e) => setGroomName(e.target.value)}
                            className="w-full border-gray-300 border rounded-lg p-2"
                            placeholder="Enter Groom's Name"
                            required />
                    </div>
                </div>
                <div className="will-display-in-map flex flex-col items-center justify-evenly  p-2 border-2 border-gray-300 rounded-md bg-gray-5">
                    <p className='text-slate-600'>will you want to display this client in map</p>
                    <div className="p-2 w-full flex justify-evenly ">
                        <div className="flex items-center gap-2 cursor-pointer">
                            <input onChange={(e) => {
                                if (e.target.value === 'true') {
                                    setIsInMap(true)
                                }
                            }} value={true} className='w-5 h-5 bg-slate-300 px-2' name="isInMap" type="radio" id="yes" />
                            <label className='text-desktopBodyMedium' htmlFor="yes">Yes</label>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer">
                            <input onChange={(e) => {
                                if (e.target.value === 'false') {
                                    setIsInMap(false)
                                }
                            }} value={false} className='w-5 h-5 bg-slate-300 px-2' name="isInMap" type="radio" id="no" />
                            <label className='text-desktopBodyMedium' htmlFor="no">No</label>
                        </div>
                    </div>
                    {
                        isInMap && (<div className="">
                            <p>provide latitude & longitude on shoot location <b>eg: Nashik 20.009709,73.791438</b>, so that client icon will display in map.
                                <a rel="noopener noreferrer" className='underline ' href='https://www.latlong.net/' target='_blank' >Lat-Lon-Finder</a>
                            </p>
                            <div className="p-2 w-full flex justify-evenly ">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <label className='text-desktopBodyMedium' htmlFor="lon">Lat</label>
                                    <input
                                        value={coordinate.latitude}
                                        placeholder={34.564}
                                        className='w-32 h-5 bg-slate-300 p-4 border-none outline-none appearance-none' name="latitude"
                                        onChange={(e) => {
                                            if (!isNaN(e.target.value)) {
                                                setCoordinate(prev => ({ ...prev, latitude: e.target.value }))
                                            }
                                        }}
                                        type="number" id="lon" />
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <label className='text-desktopBodyMedium' htmlFor="lat">Lon</label>
                                    <input
                                        value={coordinate.longitute}
                                        placeholder={-24.56}
                                        className='w-32 h-5 bg-slate-300 p-4 border-none outline-none appearance-none' name="longitude"
                                        onChange={(e) => {
                                            if (!isNaN(e.target.value)) {
                                                setCoordinate(prev => ({ ...prev, longitute: e.target.value }))
                                            }
                                        }}
                                        type="number" id="lat" />
                                </div>
                            </div>
                        </div>)
                    }
                </div>
                {/* Videos Upload */}
                <div className="mb-4  p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                    <h1 className='text-center text-desktopBodyLarge font-bold'>Client Videos </h1>
                    <div className="input-header flex items-center  justify-between">
                        <input
                            id='videos'
                            type="file"
                            accept="video/mp4"
                            multiple
                            onChange={(e) => handleFileChange(e, 'video')}
                            className="hidden"
                        />
                        <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="videos">
                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                            Add</label>
                        <div className="clear-all-video ">
                            <button type='button' className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold'
                                onClick={(e) => {
                                    setPreviewVideos([]);
                                    setVideosDetails([]);
                                    setVideoFiles([])
                                }}>
                                <span>Clear All</span>
                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                            </button>
                        </div>
                    </div>
                    {/* Video Previews */}
                    <div className="all-videos mt-4 grid grid-cols-2 gap-4">
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
                                        setVideosDetails((prev) => prev.filter((vd) => vd.video.name !== video.name))

                                    }}>
                                    <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                </button>
                                <button type='button' className='text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold'
                                    onClick={() => {
                                        setVideoForm(videoForm.map((form) => {
                                            if (form.name === video.name) {
                                                return { isVideoFormVisible: true, name: form.name };
                                            } return form;
                                        }))
                                    }}
                                >Add Details</button>
                                {
                                    videoForm.find((form) => form.name === video.name)?.isVideoFormVisible &&
                                    <VideoDetailsForm
                                        videoFiles={videoFiles}
                                        setVideoFiles={setVideoFiles}
                                        tagsData={tagsData}
                                        setTagsData={setTagsData}
                                        videoDetails={videoDetails}
                                        setVideosDetails={setVideosDetails}
                                        setVideoForm={setVideoForm}
                                        videoName={video.name}
                                    />
                                }
                            </div>
                        ))}
                    </div>
                </div>

                {/* Photos Upload */}
                <div className="mb-4  p-2 border-2 border-gray-300 rounded-md bg-gray-50">
                    <h1 className='text-center text-desktopBodyLarge font-bold'>Client Photos </h1>
                    <div className="input-header flex items-center  justify-between">
                        <input
                            id='photos'
                            type="file"
                            accept='image/*'
                            multiple
                            onChange={(e) => handleFileChange(e, 'photo')}
                            className="hidden"
                        />
                        <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="photos">
                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                            Add</label>
                        <div className="clear-all-photos">
                            <button type='button' className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold'
                                onClick={(e) => {
                                    setPreviewPhotos([]);
                                    setPhotosDetails([]);
                                    setPhotoFiles([])
                                }}>
                                <span>Clear All</span>
                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                            </button>
                        </div>
                    </div>
                    {/* Photo Previews */}
                    <div className="all-photos mt-4 grid grid-cols-2 gap-4">
                        {previewPhotos.map((photo) => (
                            <div key={photo.name} className="video relative flex flex-col justify-center gap-2">
                                <div className="photo-preview">
                                    <img
                                        className="w-full h-40 object-cover rounded-md shadow"
                                        alt="client-photo"
                                        src={photo.url}
                                    />
                                </div>
                                {/* delete specific photo */}
                                <button type='button' className='absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                    onClick={() => {
                                        setPreviewPhotos(() => {
                                            return previewPhotos.filter((p) => {
                                                return p.name !== photo.name
                                            })
                                        })
                                        setPhotosDetails((prev) => prev.filter((ph) => ph.photo.name !== photo.name))
                                    }}>
                                    <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                </button>
                                <button type='button' className='text-center rounded-3xl px-6 py-2 bg-primary border-2 border-gray-700 gap-2 text-sm font-semibold'
                                    onClick={() => {
                                        setPhotoForm(photoForm.map((form) => {
                                            if (form.name === photo.name) {
                                                return { isPhotoFormVisible: true, name: form.name };
                                            } return form;
                                        }))
                                    }}
                                >Add Details</button>
                                {
                                    photoForm.find((form) => form.name === photo.name)?.isPhotoFormVisible &&
                                    <PhotoDetailsForm
                                        tagsData={tagsData}
                                        setTagsData={setTagsData}
                                        photosDetails={photosDetails}
                                        setPhotoDetails={setPhotosDetails}
                                        setPhotoForm={setPhotoForm}
                                        photoName={photo.name}
                                    />
                                }
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600">Submit</button>
            </form >
        </div >
    );
};

export default AddClient;
