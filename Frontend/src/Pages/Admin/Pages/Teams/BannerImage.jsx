import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2';
const api_url = process.env.REACT_APP_API_URL;

function BannerImage({ bannerImage, uploadFileInBucket, fetchTeamImage }) {
    const [isEditing, setIsEditing] = useState(false)
    const [imagePreview, setImagePreview] = useState([]);
    const [imageMeta, setImageMeta] = useState([]);
    const [files, setFiles] = useState([]);

    const uploadMedia = async (imageMetaData) => {
        try {
            const uploadedImage = [];
            for (const img of imageMetaData) {
                const file = files.find((f) => f.name === img.name);
                if (file && img.putUrl) {
                    await uploadFileInBucket(file, img.putUrl)
                    uploadedImage.push({ ...img })
                }
            }
            return { isUploaded: true, uploadedImage }
        } catch (error) {
            console.log(error)
            return { isUploaded: false, message: error.message }
        }
    }
    const saveClientDetails = async (uploadedImage) => {
        try {
            const res = await fetch(`${api_url}/api/admin/team/banner-image`, {
                method: "POST",
                body: JSON.stringify({
                    uploadedImage
                }),
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message)
            }
            return { isSave: true }
        }
        catch (error) {
            return { isSave: false, message: error.message }
        }
    }
    const handleSave = async () => {
        try {
            const res = await fetch(`${api_url}/api/admin/team/banner-image/get-put-url`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                    imageMeta
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json()
            if (!res.ok || !(data.imageMetaData && data.imageMetaData.length)) {
                throw new Error(data.message)
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
                    let response = await uploadMedia(data.imageMetaData);
                    if (response.isUploaded) {
                        // save file detail in DB
                        response = await saveClientDetails(response.uploadedImage);
                        if (response.isSave) {
                            Swal.fire({
                                title: "Success!",
                                text: response.message,
                                icon: "success",
                                timer: 2000,
                                showConfirmButton: false
                            });
                            fetchTeamImage()
                            handleCancel()
                        } else {
                            throw new Error(response.message);
                        }
                    } else {
                        throw new Error(response.message);
                    }
                }
            };
        } catch (error) {
            Swal.fire({
                title: "Error!",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#d33"
            });
        }
    }
    const handleFileChange = (e) => {
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
        const prevUrl = files.map((img) => {
            return {
                name: img.name,
                url: URL.createObjectURL(img)
            }
        })
        setImageMeta(prev => [...prev, ...fileMeta])
        setFiles(prev => [...files, ...prev])
        setImagePreview(prev => [...prev, ...prevUrl])
    };
    useEffect(() => {
        return () => {
            imagePreview.forEach(img => URL.revokeObjectURL(img.url));
        };
    }, [imagePreview]);
    const handleCancel = () => {
        setImageMeta([])
        setFiles([])
        setImagePreview([])
        setIsEditing(false)
    }
    const deleteBannerImage = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "green",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        })
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${api_url}/api/admin/team/banner-image`, {
                    method: "DELETE",
                    credentials: "include",
                    body: JSON.stringify({ id }),
                    headers: { "Content-type": "application/json" }
                })
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message)
                }
                Swal.fire({
                    title: "success!",
                    text: "Image Deleted!",
                    icon: "success",
                    confirmButtonColor: "#d33"
                });
                fetchTeamImage()
            } catch (error) {
                Swal.fire({
                    title: "Error!",
                    text: error.message,
                    icon: "error",
                    confirmButtonColor: "#d33"
                });
            }
        }

    }
    return (
        <>
            <div className="hero-banner w-auto  relative rounded-2xl lg:my-4 sm:my-6">
                <div className="edit flex justify-end mb-4">
                    {!isEditing ? (
                        <button type='button'
                            onClick={() => setIsEditing(true)}
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
                            id='bannerImage'
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="bannerImage">
                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                            Add</label>
                        <div className="clear-all-video ">
                            <button type='button' className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold'
                                onClick={handleCancel}>
                                <span>Clear All</span>
                                <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                            </button>
                        </div>
                    </div>
                }
                <div className="grid grid-cols-3 gap-2 ">
                    {
                        isEditing &&
                        imagePreview.map((img) => (
                            <div key={img.name} className="img-preview relative">
                                <div className="">
                                    <img
                                        className="w-full h-40 object-cover rounded-md shadow"
                                        alt='new-image'
                                        src={img.url}
                                    />
                                </div>
                                {/* delete specific image */}
                                <button type='button' className='delete-image absolute right-4 top-4 p-1 bg-white rounded-full shadow-lg'
                                    onClick={() => {
                                        setImagePreview(prev => prev.filter(file => file.name !== img.name))
                                        setFiles((prev) => prev.filter((file) => file.name !== img.name))
                                        setImageMeta((prev) => prev.filter((file) => file.name !== img.name))
                                    }}>
                                    <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="black"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                </button>
                            </div>
                        ))
                    }
                </div>
                <div className=" herobanner-wrapper grid grid-cols-3 max-h-screen p-4 w-auto overflow-y-auto  space-y-2 space-x-3 " > {
                    bannerImage.length ?
                        bannerImage.filter(i => i.isHero).map((image, i) => {
                            return (
                                <div key={i} className="relative" alt="team-banner-image">
                                    <img className='bg-center object-cover w-full h-full rounded-2xl px-2' src={image.url} alt='team-banner-image' />
                                    {isEditing &&
                                        <button type="button" className='delete-image absolute top-4 right-4 p-1 rounded-full bg-slate-100'
                                            onClick={() => deleteBannerImage(image._id)}>
                                            <svg className='w-7 h-7 fill-black' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                        </button>}
                                </div>
                            )
                        })
                        :
                        <div className="text-center font-bold text-xl tracking-widest">No available bannerImage</div>
                }
                </div>
            </div>
        </>
    )
}

export default BannerImage
