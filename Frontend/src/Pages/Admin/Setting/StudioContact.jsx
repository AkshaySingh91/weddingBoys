import React, { useState, useEffect } from 'react'
import Swal from "sweetalert2"
import facebookLogo from '../../../Asset/facebookLogo.svg'
import instagramLogo from '../../../Asset/instagramLogo.svg'
import twitterLogo from '../../../Asset/twitterLogo.svg'
import youtubeLogo from '../../../Asset/youtubeLogo.svg'

const api_url = process.env.REACT_APP_API_URL;
function StudioContact() {
    const [studioName, setStudioName] = useState("");
    const [studioLogo, setStudioLogo] = useState("");
    const [studioAddress, setStudioAddress] = useState("");
    const [studioContact, setStudioContact] = useState(["", ""]);
    const [studioEmail, setStudioEmail] = useState("");
    const [studioSocials, setStudioSocials] = useState({
        instagram: "",
        youtube: "",
        x: "",
        facebook: "",
    });
    const [isEditing, setIsEditing] = useState("");
    const [isNewStudioLogo, setIsNewStudioLogo] = useState("");
    const [studioLogoFile, setStudioLogoFile] = useState(null);
    const [studioLogoMetaData, setStudioLogoMetaData] = useState(null);
    const [newStudioLogoPreview, setNewStudioLogoPreview] = useState("");

    const getStudioDetails = async () => {
        try {
            const res = await fetch(`${api_url}/api/studio/details`, {
                method: 'GET',
            })
            const data = await res.json();
            if (res.status === 200 && data.studioDetails && data.studioDetails.name && data.studioDetails.logo && data.studioDetails.email && data.studioDetails.address && data.studioDetails.socials && data.studioDetails.contact) {
                const studioDetails = data.studioDetails
                setStudioName(studioDetails.name)
                setStudioLogo(studioDetails.logo)
                setStudioAddress(studioDetails.address)
                setStudioContact(studioDetails.contact)
                setStudioEmail(studioDetails.email)
                setStudioSocials(studioDetails.socials)
            } else {
                Swal.fire({
                    title: "Error on fetching studio detials",
                    icon: "error",
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                })
            }
        } catch (error) {
            Swal.fire({
                toast: true,
                position: 'top-right',
                icon: 'error',
                title: error.message,
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }
    }
    const handleLogoChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);
            setNewStudioLogoPreview(preview);
            setStudioLogoMetaData({
                name: file.name, size: file.size, type: file.type
            })
            setStudioLogoFile(file);
            setIsNewStudioLogo(true);
            return () => {
                URL.revokeObjectURL(preview);
            }
        }
    }
    async function handleSaveDetails() {
        const result = await Swal.fire({
            title: "Are you sure?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "green",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, update it!"
        })
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${api_url}/admin/api/studio-setting/contact/save`, {
                    credentials: "include",
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        studioDetail: {
                            studioName, studioContact, studioEmail, studioAddress, studioSocials
                        },
                        isLogoUpdated: false
                    })
                })
                const data = await res.json();
                if (res.status >= 300) {
                    throw new Error(data.message);
                } else {
                    Swal.fire({
                        title: "Detail updated!",
                        text: data.message,
                        icon: "success",
                        confirmButtonColor: "blue"
                    });
                    setIsEditing(false)
                }
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

    async function handleSaveNewLogo() {
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
                    throw new Error(`Failed to upload file ${response.status} ${response.statusText}`)
                }
            } catch (error) {
                return { isValid: false, message: error.message }
            }
        }
        try {
            const res = await fetch(`${api_url}/admin/api/studio-setting/contact/get-logo-put-url`, {
                credentials: "include",
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    studioLogoMetaData,
                    isLogoUpdated: true
                })
            })
            const data = await res.json();
            if (res.status >= 300 || !data.putUrl || !data.key) {
                throw new Error(data.message);
            } else {
                const { putUrl, key } = data;
                let response = await uploadFileInBucket(studioLogoFile, putUrl);
                if (response.isValid) {
                    const res = await fetch(`${api_url}/admin/api/studio-setting/contact/save`, {
                        credentials: "include",
                        method: "PUT",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                            key,
                            isLogoUpdated: true
                        })
                    })
                    const data = await res.json();
                    if (res.status >= 300) {
                        throw new Error(data.message);
                    }
                    Swal.fire({
                        title: "Logo Update!",
                        text: data.message,
                        icon: "success",
                        confirmButtonColor: "green"
                    });
                    setIsNewStudioLogo(false);
                } else {
                    throw new Error(response.message);
                }
            }
        } catch (error) {
            Swal.fire({
                title: "Error!",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#d33"
            });
        }
    }

    const handleCancelNewLogo = () => {
        setIsNewStudioLogo(false);
    }
    useEffect(() => {
        getStudioDetails()
    }, [])
    return (
        <>
            <div className="flex md:flex-row sm:flex-col justify-center gap-6 p-6 min-h-screen">
                <div className="max-w-96 min-w-fit lg:w-1/4 bg-[#f5f0e7] shadow-[0_8px_32px_0_rgba( 31, 38, 135, 0.37)] backdrop-blur-md border-[1px] border-[rgba( 255, 255, 255, 0.18 )] sm:mx-auto  rounded-2xl p-4 lg:h-96 sm:h-fit">
                    <div className="flex flex-col lg:gap-3 items-center text-center">
                        {
                            isNewStudioLogo ?
                                <img
                                    src={newStudioLogoPreview}
                                    alt="Profile"
                                    className="lg:w-32 lg:h-32 sm:w-28 sm:h-28 rounded-full object-cover bg-center" />
                                : (studioLogo ? <img
                                    src={studioLogo}
                                    alt="Profile"
                                    className="lg:w-32 lg:h-32 sm:w-28 sm:h-28 rounded-full object-cover bg-center" /> :
                                    <img
                                        src={"https://placehold.jp/250x50.png"}
                                        alt="Profile"
                                        className="lg:w-32 lg:h-32 sm:w-28 sm:h-28 rounded-full object-cover bg-center" />)
                        }
                        <div className="text-center">
                            <input id="studioLogoFile" type="file" accept="image/*" className="hidden"
                                onChange={handleLogoChange} />
                            {
                                !isNewStudioLogo ?
                                    <label htmlFor="studioLogoFile" type="button" className="flex gap-2 items-center tracking-wider px-4 py-2 sm:my-3 text-white bg-tertiary hover:bg-tertiary_on rounded-md shadow-sm">
                                        Edit
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                                    </label> :

                                    <div className="mt-6 text-center gap-4 flex justify-evenly">
                                        <button type="button" className={`px-6 py-2 border-[1px] border-black text-black bg-slate-100 hover:bg-slate-200 rounded-md shadow-sm`}
                                            onClick={handleCancelNewLogo}>Cancel</button>
                                        <button type="button" className="px-6 py-2 text-white bg-green-500 hover:bg-green-600 rounded-md shadow-sm"
                                            onClick={handleSaveNewLogo} >Save</button>
                                    </div>
                            }

                        </div>
                        <div className="details flex flex-col space-y-1">
                            <h2 className="text-xl font-semibold ">{studioName}</h2>
                            <p className="text-gray-500  tracking-widest text-lg">{studioContact[0]}</p>
                            <p className="text-gray-500  tracking-widest text-lg">{studioEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className="overflow-x-hidden relative w-full lg:w-2/3 rounded-2xl sm:bg-[#f5f0e7] shadow-md p-4" >
                    <form className="p-6 space-y-6 transition-transform duration-200" >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 " />
                        <div className='text-desktopBodyLarge flex flex-col gap-2'>
                            <label htmlFor="name" className=" block text-sm font-medium text-gray-700">Studio Name</label>
                            <input value={studioName} disabled={!isEditing} type="text" id="name" placeholder="Enter name"
                                className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                onChange={(e) => setStudioName(e.target.value)} />
                        </div>
                        <div className='text-desktopBodyLarge'>
                            <label htmlFor="emial" className=" block text-sm font-medium text-gray-700">Studio Email</label>
                            <input value={studioEmail} type="email" disabled={!isEditing} id="emial" placeholder="Enter email"
                                className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                onChange={(e) => setStudioEmail(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2  gap-4 mt-4">
                            <div className='text-desktopBodyLarge'>
                                <label htmlFor="phone1" className="block text-sm font-medium text-gray-700">Primary</label>
                                <input value={studioContact[0]} disabled={!isEditing} type="tel" id="phone1" placeholder="+910123456789"
                                    className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                    onChange={(e) => {
                                        setStudioContact(prev => {
                                            let phone = prev[1];
                                            return [e.target.value, phone]
                                        })
                                    }} />
                            </div>
                            <div className='text-desktopBodyLarge'>
                                <label htmlFor="phone2" className="block text-sm font-medium text-gray-700">Secondary</label>
                                <input disabled={!isEditing} value={studioContact[1]} type="tel" id="phone2" placeholder="+910123456789"
                                    className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                    onChange={(e) => {
                                        setStudioContact(prev => {
                                            let phone = prev[0];
                                            return [phone, e.target.value]
                                        })
                                    }} />
                            </div>
                        </div>
                        <div className='text-desktopBodyLarge'>
                            <label htmlFor="address" className=" block text-sm font-medium text-gray-700">Studio Address</label>
                            <textarea value={studioAddress} disabled={!isEditing} id="address" placeholder="Enter Full Address"
                                className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                onChange={(e) => setStudioAddress(e.target.value)} />
                        </div>
                        <div className='text-desktopBodyLarge'>
                            <div className=" block text-sm font-medium text-gray-700">Studio Socials</div>
                            <div className=" mt-4">
                                <div className="w-full flex gap-4 ">
                                    <label className="" htmlFor="instagram">
                                        <img className='w-12 h-12' src={instagramLogo} alt="" />
                                    </label>
                                    <input disabled={!isEditing} value={studioSocials.instagram} type="text" id='instagram' placeholder='Instagram Id Url'
                                        className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                        onChange={(e) => setStudioSocials(prev => ({ ...prev, ...{ instagram: e.target.value } }))} />
                                </div>
                            </div>
                            <div className=" mt-4">
                                <div className="w-full flex gap-4 ">
                                    <label className="" htmlFor="Youtube">
                                        <img className='w-12 h-12' src={youtubeLogo} alt="" />
                                    </label>
                                    <input disabled={!isEditing} value={studioSocials.youtube} type="text" id='Youtube' placeholder='Youtube Id Url'
                                        className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                        onChange={(e) => setStudioSocials(prev => ({ ...prev, ...{ youtube: e.target.value } }))} />
                                </div>
                            </div>
                            <div className=" mt-4">
                                <div className="w-full flex gap-4 ">
                                    <label className="" htmlFor="facebook">
                                        <img className='w-12 h-12' src={facebookLogo} alt="" />
                                    </label>
                                    <input disabled={!isEditing} value={studioSocials.facebook} type="text" id='facebook' placeholder='facebook Id Url'
                                        className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                        onChange={(e) => setStudioSocials(prev => ({ ...prev, ...{ facebook: e.target.value } }))} />
                                </div>
                            </div>
                            <div className=" mt-4">
                                <div className="w-full flex gap-4 ">
                                    <label className="" htmlFor="twitter">
                                        <img className='w-12 h-12' src={twitterLogo} alt="" />
                                    </label>
                                    <input disabled={!isEditing} value={studioSocials.x} type="text" id='twitter' placeholder='Twitter Id Url'
                                        className="p-2 mt-1 block w-full border-[1px] border-slate-300 bg-[#fffdfa]  rounded-md shadow-sm outline-none   focus:border-[1px] focus:border-gray-500  sm:text-sm"
                                        onChange={(e) => setStudioSocials(prev => ({ ...prev, ...{ x: e.target.value } }))} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center gap-4 flex justify-evenly">
                            <button type="button" className={`px-6 py-2 text-white bg-${isEditing ? "green" : "blue"}-500 hover:bg-${isEditing ? "green" : "blue"}-600 rounded-md shadow-sm`}
                                onClick={() => {
                                    if (!isEditing) {
                                        setIsEditing(prev => !prev)
                                    } else {
                                        handleSaveDetails();
                                    }
                                }}>
                                {isEditing ? "Save" : "Edit"}
                            </button>
                        </div>
                    </form>
                </div >
            </div>
        </>
    )
}

export default StudioContact
