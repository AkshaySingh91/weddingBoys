import React, { useState } from 'react'
import { fireMessage } from '../AuthPage/Signup';
import Swal from 'sweetalert2';

function ReviewEdit({ setIsEditing, setEditingReview, editingReview }) {
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null)
    const [fileUrl, setFileUrl] = useState(editingReview && editingReview.url ? editingReview.url : null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            let f = e.target.files[0];
            // add date in file to avoid name confilict  
            let name = `${f.name.split('.')[0]}_ ${Date.now()}.${f.type.split('/')[1]}`
            let blob = f.slice(0, f.size);
            const file = new File([blob], name, { type: f.type })
            const prev = URL.createObjectURL(file)
            setFilePreview(prev);
            setFile(file)
            setFileUrl(null)
            setEditingReview(prev => {
                return {
                    ...prev, photo: {
                        name, size: file.size, type: file.type
                    }
                }
            })
        }
    }
    const handleSaveDetails = async () => {
        try {
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
                        return { isValid: true }
                    } else {
                        console.error('Failed to upload file:', response.status, response.statusText);
                        return { "isValid": false, "msg": response.text }
                    }
                } catch (error) {
                    console.error('Error uploading file:', error);
                    return { isValid: false, msg: error.message }
                }
            }
            const saveReview = async (urls) => {
                // photo has uploded now we have to send key of it 
                try {
                    if (urls.key) {
                        const res = await fetch('http://localhost:5000/admin/api/review/save-details', {
                            method: "PUT",
                            body: JSON.stringify({
                                "editingReview": {
                                    ...editingReview,
                                    photo: { key: urls.key },
                                },
                                'isNewFile': true
                            }),
                            credentials: 'include', headers: { 'Content-type': 'application/json' }
                        })
                        const data = await res.json();
                        console.log({ data })
                        if (res.status >= 300) {
                            return { isValid: false, msg: data.message || 'Unable to save details' }
                        } else {
                            return { isValid: true, msg: "Review have been uploaded successfully." }
                        }
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
            const verifyDetails = async () => {
                try {
                    if (((file && editingReview.photo.type && editingReview.photo.size && editingReview.photo.name) || (!file && editingReview.photo.key)) && editingReview.reviewText && editingReview.person && editingReview.person.name && editingReview.person.name.trim() && editingReview.person.gender && editingReview.person.gender.trim()) {
                        if (!file) {
                            // save only text details
                            const res = await fetch('http://localhost:5000/admin/api/review/get-put-url', {
                                method: "PUT",
                                body: JSON.stringify({ editingReview }),
                                credentials: 'include', headers: { 'Content-type': 'application/json' }
                            })
                            const data = await res.json();
                            if (res.status >= 300) {
                                fireMessage(data.message, 'error');
                            } else {
                                fireMessage(data.message, 'success'); 
                            }
                        }
                        else {
                            // get put url & upload file
                            const res = await fetch('http://localhost:5000/admin/api/review/get-put-url', {
                                method: "PUT",
                                body: JSON.stringify({ editingReview }),
                                credentials: 'include', headers: { 'Content-type': 'application/json' }
                            })
                            const data = await res.json();
                            if (res.status >= 300 || !data.urls) {
                                throw new Error(data.message || "Failed to upload files.");
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
                                            const urls = data.urls
                                            if (urls.putUrl) {
                                                let response = await uploadFileInBucket(file, urls.putUrl)
                                                if (response.isValid) {
                                                    response = await saveReview(data.urls)
                                                    if (response.isValid) {
                                                        Swal.fire({
                                                            title: "Success!",
                                                            text: response.msg,
                                                            icon: "success",
                                                            timer: 2000,
                                                            showConfirmButton: false
                                                        });
                                                    } else {
                                                        throw new Error(response.msg || "Failed to upload files.");
                                                    }
                                                } else {
                                                    throw new Error(response.msg || "Failed to upload files.");
                                                }
                                            } else {
                                                throw new Error(data.message || "Failed to upload files.");
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
                        }
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
            verifyDetails();
        } catch (error) {
            console.log(error)
            fireMessage(error.message, 'error')
        }
    }

    return (<>
        <div className="underlay fixed z-50 top-0 left-0  h-screen scrollbar-thin w-screen bg-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[1px] border border-[rgba(255,255,255,0.18)] rounded-2xl flex items-center justify-center">
            <div className="edit-review-form  min-w-96 p-4 my-4 h-full overflow-y-auto scrollbar-thin  bg-gray-100 border-2 border-gray-500 rounded-xl space-y-4">
                <h2 className='text-center text-desktopHeadlineSmall font-semibold'>Edit Review </h2>
                <div className="input-header flex items-center  justify-between my-4">
                    <input
                        id='images'
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold cursor-pointer' htmlFor="images">
                        <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                        Add</label>
                    <div className="clear-all-video ">
                        <button type='button' className='rounded-3xl px-6 py-2 flex items-center bg-gray-300 border-2 border-gray-300 gap-2 text-sm font-semibold'
                            onClick={(e) => {
                                setFileUrl(null);
                                setFilePreview(null);
                                setFile(null);
                                setEditingReview(prev => ({ ...prev, photo: null }));
                            }}>
                            <span>Clear</span>
                            <svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
                        </button>
                    </div>
                </div>
                {
                    filePreview &&
                    <img src={filePreview} alt="preview" />
                }
                {
                    fileUrl &&
                    <img src={fileUrl} alt="preview" />
                }
                <div className="review-text flex flex-col gap-2 text-desktopBodyLarge ">
                    <label htmlFor="text" className='px-2'>Add review text</label>
                    <textarea rows={6} name="review-text" id="text"
                        className='p-2 border-2 border-gray-200 focus:outline-none rounded-lg '
                        value={editingReview.reviewText}
                        onChange={(e) => setEditingReview({ ...editingReview, reviewText: e.target.value })}
                    ></textarea>
                </div>
                <div className="gender flex flex-col gap-2 text-desktopBodyLarge">
                    <select
                        className='p-2 border-2 border-gray-200 focus:outline-none rounded-lg '
                        value={editingReview.person.gender}
                        onChange={(e) =>
                            setEditingReview({ ...editingReview, person: { ...editingReview.person, gender: e.target.value } })
                        }>
                        <option value="Bride">Bride</option>
                        <option value="Groom">Groom</option>
                    </select>
                </div>
                <div className="client-name flex flex-col gap-2 text-desktopBodyLarge " >
                    <label htmlFor="name" className='px-2'>Client Name</label>
                    <input
                        id="name"
                        className='p-2 border-2 border-gray-200 focus:outline-none rounded-lg '
                        type="text"
                        placeholder="Name"
                        value={editingReview.person.name}
                        onChange={(e) =>
                            setEditingReview({ ...editingReview, person: { ...editingReview.person, name: e.target.value } })
                        }
                    />
                </div>
                <div className="bnts flex justify-evenly">
                    <button className="left-side px-4 border-0 outline-none bg-green-500 rounded-lg p-1 w-fit h-fit sm:top-[90%]"
                        onClick={() => {
                            setIsEditing(false);
                            setEditingReview(null)
                        }}
                    >Cancle</button>
                    <button className="right-side px-4  border-0 outline-none bg-blue-500 rounded-lg p-1 w-fit h-fit sm:top-[90%]"
                        onClick={handleSaveDetails}
                    >Save</button>
                </div>
            </div>
        </div>
    </>)
}

export default ReviewEdit
