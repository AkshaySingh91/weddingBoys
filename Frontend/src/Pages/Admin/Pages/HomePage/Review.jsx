import React, { useCallback, useRef, useState } from 'react'
import { useEffect } from 'react';
import { fireMessage } from '../AuthPage/Signup'
import Swal from 'sweetalert2';
import ReviewEdit from './ReviewEdit';
const api_url = process.env.REACT_APP_API_URL;

export default function Review() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [totalReviews, setTotalReviews] = useState(3);
    const slide = useRef();
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const [isEditing, setIsEditing] = useState(false)
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({
        photo: null,
        reviewText: "",
        person: { name: "", gender: "Bride" },
    });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingReview, setEditingReview] = useState(null);

    const handlePrev = useCallback(() => {
        setCurrentSlide((prev) => (prev === 0 ? totalReviews - 1 : prev - 1));
    }, [totalReviews]);

    const handleNext = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % totalReviews);
    }, [totalReviews]);

    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);
    const handleTouchMove = useCallback((e) => {
        touchEndX.current = e.touches[0].clientX;
    }, []);
    const handleTouchEnd = useCallback(() => {
        const changeInPosition = touchEndX.current - touchStartX.current;
        if (changeInPosition > 50) {
            // Swipe Right
            handlePrev();
        } else if (changeInPosition < -50) {
            // Swipe Left
            handleNext();
        }
    }, [handlePrev, handleNext]);

    useEffect(() => {
        if (slide.current) {
            slide.current.style.transform = `translateX(${-currentSlide * 100}%)`;
        }
    }, [currentSlide]);
    useEffect(() => {
        // Fetch initial reviews
        async function fetchReviews() {
            try {
                const res = await fetch(`${api_url}/api/reviews`);
                const data = await res.json();
                if (res.status !== 200) throw new Error(data.message);
                if (data.reviews && data.reviews.length) {
                    setReviews(data.reviews);
                    setTotalReviews(data.reviews.length);
                }
            } catch (error) {
                fireMessage(error.message, 'error')
            }
        }
        fetchReviews();
    }, []);

    const handleCancelEdit = () => {
        setFilePreview(null)
        setFile(null)
        setNewReview({
            photo: null,
            reviewText: "",
            person: { name: "", gender: "Bride" },
        })
        setIsAdding(false)
    }
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
            setNewReview(prev => {
                return {
                    ...prev, photo: {
                        name, size: file.size, type: file.type
                    }
                }
            })
        }
    }
    const handleSave = (e) => {
        e.preventDefault();
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
                        return { isValid: true }
                    } else {
                        return { isValid: false, message: response.statusText }
                    }
                } catch (error) {
                    return { isValid: false, message: error.message }
                }
            }
            const saveReview = async (urls) => {
                const res = await fetch('http://localhost:5000/admin/api/review/save-details', {
                    method: 'POST',
                    headers: { 'Content-type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ newReview, key: urls.key })
                })
                const data = await res.json();
                if (res.status >= 300) {
                    return { isValid: false, message: data.message }
                }
                return { isValid: true, message: "All files have been uploaded successfully" }
            }
            const verifyDetails = async () => {
                try {
                    if (file && newReview && newReview.photo && newReview.reviewText && newReview.reviewText.trim() &&
                        newReview.person && newReview.person.name && newReview.person.gender && newReview.person.name.trim() &&
                        newReview.person.gender.trim()) {

                        const res = await fetch('http://localhost:5000/admin/api/review/get-put-url', {
                            method: 'POST',
                            body: JSON.stringify({ newReview }),
                            headers: { 'Content-type': 'application/json' },
                            credentials: 'include',
                        })
                        const data = await res.json();
                        if (res.status >= 300 || !data.urls) {
                            throw new Error(data.message)
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
                                        let response = await uploadFileInBucket(file, data.urls.url);
                                        if (response.isValid) {
                                            // save file detail in DBuploadFileInBucket
                                            response = await saveReview(data.urls);
                                            Swal.fire({
                                                title: "Success!",
                                                text: response.message || "All files have been uploaded successfully.",
                                                icon: "success",
                                                timer: 2000,
                                                showConfirmButton: false
                                            });
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
                    } else {
                        throw new Error('Incomplete field')
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
            Swal.fire({
                title: "Error!",
                text: error.message || "Something went wrong during upload.",
                icon: "error",
                confirmButtonColor: "#d33"
            });
        }
    }
    const handleEditReview = (key) => {
        // find all details of review of this key & pass to edit review
        const reviewDetials = reviews.find((review) => (review.photo.key === key))
        if (!reviewDetials) {
            return fireMessage('Review not found', 'error')
        }
        setEditingReview(reviewDetials)
    }
    const handleDeleteReview = async (key) => {
        // find all details of review of this key & pass to delete
        const reviewDetials = reviews.find((review) => (review.photo.key === key))
        if (!reviewDetials) {
            return fireMessage('Review not found', 'error')
        }
        try {
            const res = await fetch('http://localhost:5000/admin/api/reviews', {
                method: 'DELETE',
                body: JSON.stringify({ reviewDetials }),
                headers: { 'Content-type': 'application/json' },
                credentials: 'include',
            })
            const data = await res.json();
            if (res.status >= 300) {
                throw new Error(data.message)
            } else {
                setReviews(prev => (prev.filter((review) => review.photo.key === key)))
                return fireMessage(data.message, 'success');
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
    useEffect(() => {
        if (isEditing) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [isEditing])
    useEffect(() => {
        if (editingReview) {
            setIsEditing(true);
        }
    }, [editingReview])
    return (<>
        <div className="wrapper">
            <div className="edit flex justify-end gap-2 mb-4 mt-40">

                {!isAdding ? (
                    <button type='button'
                        onClick={() => setIsAdding(true)}
                        className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600"
                    >Add new Review</button>
                ) : (
                    <div className="flex gap-2">
                        <button type='button'
                            onClick={handleSave}
                            className="bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600"
                        >Save</button>
                        <button type='button'
                            onClick={handleCancelEdit}
                            className="bg-gray-500 text-white font-semibold py-2 px-4 rounded hover:bg-gray-600"
                        >Cancel</button>
                    </div>
                )}
            </div>
            {isAdding &&
                <div className="new-review-form p-4 bg-gray-100 border-2 border-gray-500 rounded-xl space-y-4">
                    <h2 className='text-center text-desktopHeadlineSmall font-semibold'>Add new Review </h2>
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
                                    setFilePreview(null); setFile(null); setNewReview(prev => ({ ...prev, photo: null }));
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
                    <div className="review-text flex flex-col gap-2 text-desktopBodyLarge ">
                        <label htmlFor="text" className='px-2'>Add review text</label>
                        <textarea rows={6} name="review-text" id="text"
                            className='p-2 border-2 border-gray-200 focus:outline-none rounded-lg '
                            value={newReview.reviewText}
                            onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="gender flex flex-col gap-2 text-desktopBodyLarge">
                        <select
                            className='p-2 border-2 border-gray-200 focus:outline-none rounded-lg '
                            value={newReview.person.gender}
                            onChange={(e) =>
                                setNewReview({ ...newReview, person: { ...newReview.person, gender: e.target.value } })
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
                            value={newReview.person.name}
                            onChange={(e) =>
                                setNewReview({ ...newReview, person: { ...newReview.person, name: e.target.value } })
                            }
                        />
                    </div>
                </div>
            }
            <div className="reviews flex justify-center  w-auto">
                <div className="flex-auto relative w-4/5 h-full bg-secondary py-6 px-20 rounded-2xl sm:px-4 ">
                    <h1 className='text-center text-wrap pb-20 text-primary lg:text-desktopHeadlineSmall font-medium md:text-tabletHeadlineSmall sm:text-mobileHeadlineSmall sm:pb-14'>Love Notes from Our Couples</h1>
                    <div className="reviews-wrapper overflow-hidden relative "
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}>
                        <div className="flex transition-transform duration-500" ref={slide}>
                            {/* item 1 */}
                            {
                                reviews.length ?
                                    reviews.map((review) => (
                                        <div key={review.photo.key} className="wrapper flex-shrink-0 w-full transition-transform duration-500">
                                            <div className="flex-shrink-0 w-full flex lg:flex-row lg:gap-2 sm:flex-col sm:text-center sm:gap-4 sm:pb-8">
                                                <div className="lg:w-1/2 flex flex-col gap-3 justify-center items-center leading-5 sm:w-auto">
                                                    <p className='text-primary text-desktopBodySmall font-semifont text-center'>
                                                        {review.reviewText}
                                                    </p>
                                                    <span className='text-primary text-desktopBodyLarge font-medium capitalize text-center'>{review.person.name}</span>
                                                    <span className='text-primary text-desktopBodyLarge font-medium capitalize text-center'>{review.person.gender}</span>
                                                </div>
                                                <div className="lg:order-none flex-auto lg:w-1/2 lg:h-60 md:h-[22rem]  overflow-hidden sm:order-first sm:w-auto">
                                                    <img className='lg:w-full h-full md:w-11/12 rounded-xl mx-auto object-cover bg-center' src={review.url} alt="client name" />
                                                </div>
                                            </div>
                                            <div className="btns flex justify-evenly">
                                                <button type='button'
                                                    onClick={() => handleEditReview(review.photo.key)}
                                                    className="edit-review bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600"
                                                >Edit</button>
                                                <button type='button'
                                                    onClick={() => handleDeleteReview(review.photo.key)}
                                                    className="delete-review bg-red-500  font-semibold py-2 px-4 rounded hover:bg-red-600"
                                                ><svg className='w-6 h-6' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"  ><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                    : <div className="">No Reviews</div>
                            }
                        </div>
                    </div>
                    <button className="left-side absolute left-4 lg:top-1/2 border-0 outline-none bg-[#ffe3c8] rounded-full p-1 w-fit h-fit sm:top-[90%]" onClick={handlePrev}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button className="right-side absolute right-4 lg:top-1/2 border-0 outline-none bg-[#ffe3c8] rounded-full p-1 w-fit h-fit sm:top-[90%]" onClick={handleNext}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        {
            isEditing && editingReview &&
            (<ReviewEdit
                setIsEditing={setIsEditing}
                setEditingReview={setEditingReview}
                editingReview={editingReview}
            />)
        }
    </>
    )
}
