import React, { useEffect, useState } from 'react'
import { fireMessage } from '../AuthPage/Signup';
import Swal from 'sweetalert2';

const api_url = process.env.REACT_APP_API_URL;

export default function BtsTape() {
    const [btsImageFile, setBtsImageFile] = useState([])
    const [btsImagePreiview, setBtsImagePreview] = useState([])
    const [isEditing, setIsEditing] = useState(false)
    const [btsImageUrl, setBtsImageUrl] = useState([])
    const [btsMetaData, setBtsMetaData] = useState([])

    const fetchBtsImage = async () => {
        try {
            const res = await fetch(`${api_url}/api/homepage/bts-image`);
            const data = await res.json()
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            setBtsImageUrl(data.btsUrls)
        } catch (error) {
            console.log(error)
            return fireMessage(error.message, 'error')
        }
    }
    useEffect(() => {
        fetchBtsImage();
    }, [])
    const handleFileChange = (e, type) => {
        let files = Array.from(e.target.files);
        // add date in file to avoid name confilict  
        files = files.map((file) => {
            let newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`
            let blob = file.slice(0, file.size);
            return new File([blob], newName, { type: file.type })
        })
        const fileMeta = []
        for (const f of files) {
            fileMeta.push({
                name: f.name, size: f.size, type: f.type
            })
        }
        setBtsMetaData(prev => [...prev, ...fileMeta])
        setBtsImageFile(prev => [...files, ...prev])
        const prevUrl = files.map((img) => {
            return {
                name: img.name,
                url: URL.createObjectURL(img)
            }
        })
        setBtsImagePreview(prev => [...prev, ...prevUrl])
    };

    const handleCancel = () => {
        setBtsImagePreview([]);
        setBtsImageFile([]);
        setIsEditing(false)
    }
    const handleEdit = () => {
        setIsEditing(true)
    }
    const handleSave = async (e) => {
        e.preventDefault()
        const uploadFileInBucket = async (file, presignedUrl) => {
            try {
                const response = await fetch(presignedUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': file.type,
                    },
                    body: file,
                });
                if (response.ok) {
                    console.log('File uploaded successfully!');
                } else {
                    console.error('Failed to upload file:', response.status, response.statusText);
                }
            } catch (error) {
                fireMessage(error.message, 'error')
                console.error('Error uploading file:', error);
            }
        }

        const saveClientDetails = async (filesMetaWithKey) => {
            try {
                const res = await fetch(`${api_url}/admin/api/homepage/bts-image/save-details`, {
                    method: "PUT",
                    body: JSON.stringify({
                        filesMetaWithKey
                    }),
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await res.json();
                if (res.status >= 300) {
                    return { isUploaded: false, message: data.message }
                }
                return { isUploaded: true }
            }
            catch (error) {
                console.log(error);
                return { isUploaded: false, message: error.message }
            }
        }
        const uploadMedia = async (imgUrls) => {
            try {
                if (!imgUrls.length) {
                    return fireMessage('Field missing , cant upload', 'error')
                }
                /*imgUrls.push({
                    imageName: fileDetail.name,
                    putUrl: url,
                    imgKey
                })*/
                const filesMetaWithKey = []
                btsMetaData.forEach((file) => {
                    const img = imgUrls.find((u) => u.imageName === file.name)
                    if (img) {
                        filesMetaWithKey.push({ ...file, key: img.imgKey })
                    }
                })
                // now we got file with key that have to pass to save 
                let i = 0;
                for (const urlsObj of imgUrls) { 
                    await uploadFileInBucket(btsImageFile[i], urlsObj.putUrl)
                    i++;
                }
                return { isUploaded: true, message: "Client details had been added.", filesMetaWithKey }
            } catch (error) {
                console.log(error)
                fireMessage(error.message, 'error')
                return { isUploaded: false, message: error.message }
            }
        }
        const verifyDetails = async () => {
            try {
                const res = await fetch(`${api_url}/admin/api/homepage/bts-image/get-url`, {
                    method: "PUT",
                    body: JSON.stringify({ btsMetaData }),
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await res.json()
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error');
                } else {
                    const result = await Swal.fire({
                        title: "Are you sure?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "green",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Yes, upload it!"
                    })
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
                        let response = await uploadMedia(data.imgUrls);
                        if (response.isUploaded) {
                            // save file detail in DB
                            response = await saveClientDetails(response.filesMetaWithKey);
                            if (response.isUploaded) {
                                Swal.fire({
                                    title: "Success!",
                                    text: response.message || "All files have been uploaded successfully.",
                                    icon: "success",
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                            }
                            else {
                                throw new Error(response.message);
                            }
                        } else {
                            throw new Error(response.message);
                        }
                    }
                }
            } catch (error) {
                console.log(error)
                Swal.fire({
                    title: "Error!",
                    text: error.message,
                    icon: "error",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
        verifyDetails();
    }

    const deleteBtsImage = async (key) => {
        try {
            Swal.fire({
                title: "Are you sure?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "green",
                confirmButtonText: "Yes, Delete it!"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetch(`${api_url}/admin/api/homepage/bts-image`, {
                            method: "DELETE",
                            body: JSON.stringify({ key }),
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                        })
                        const data = await res.json()
                        if (res.status >= 300) {
                            return fireMessage(data.message, 'error');
                        } else {
                            Swal.fire({
                                title: "Success!",
                                text: data.message || "Image has deleted successfully.",
                                icon: "success",
                                timer: 2000,
                                showConfirmButton: false
                            });
                        };
                    } catch (error) {
                        console.log(error)
                        fireMessage(error.message, 'error')
                    }
                }
            });
        } catch (error) {
            console.log(error)
            fireMessage(error.message, 'error')
        }
    }
    return (
        <>
            <div className="bts-text-content flex flex-col items-center gap-1 lg:mt-20 mb-10 sm:mt-0 px-4">
                <h1 className='text-primary lg:text-desktopBodyLarge font-medium text-center md:text-mobileHeadlineSmall sm:text-mobileBodyLarge '>Behind Every Beautiful Shot is a Dedicated Team</h1>
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
            {
                isEditing &&
                <div className="input-header flex items-center  justify-between my-4">
                    <input
                        id='images'
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="images">
                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                        Add</label>
                    <div className="clear-all-video ">
                        <button type='button' className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold'
                            onClick={(e) => {
                                setBtsImagePreview([]);
                                setBtsImageFile([]);
                                setBtsMetaData([])
                            }}>
                            <span>Clear All</span>
                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                        </button>
                    </div>
                </div>
            }
            <div className="grid grid-cols-3 gap-2">
                {
                    isEditing &&
                    btsImagePreiview.map((img) => (
                        <div key={img.name} className="img-preview relative">
                            <div className="">
                                <img
                                    className="w-full h-40 object-cover rounded-md shadow"
                                    alt='new-image'
                                    src={img.url}
                                />
                            </div>
                            {/* delete specific image */}
                            <button type='button' className='absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                onClick={() => {
                                    setBtsImagePreview(prev => prev.filter(file => file.name !== img.name))
                                    setBtsImageFile((prev) => prev.filter((file) => file.name !== img.name))
                                    setBtsMetaData((prev) => prev.filter((file) => file.name !== img.name))
                                }}>
                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                            </button>
                        </div>
                    ))
                }
            </div>

            <div className="bts-image   bg-tertiary p-2 ">
                <div className="bts-wrapper flex justify-center gap-2 px-4 overflow-x-scroll ">
                    {
                        btsImageUrl.length ?
                            btsImageUrl.map((btsUrl) => (
                                <div key={btsUrl.key} className="relative flex-none lg:w-72 lg:h-56  sm:w-52 sm:h-36 overflow-hidden  ">
                                    <img className='w-full h-full rounded-xl' src={btsUrl.url} alt="bts-image" />
                                    <button type='button' className='absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                        onClick={() => deleteBtsImage(btsUrl.key)}>
                                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                    </button>
                                </div>
                            )) :
                            <div className="">No Bts Image</div>
                    }
                </div>

            </div>
        </>
    )
}
