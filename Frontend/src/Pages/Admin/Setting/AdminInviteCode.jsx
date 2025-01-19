import React, { useEffect, useState } from 'react'
import Swal from "sweetalert2"

function AdminInviteCode() {
    const [inviteCode, setInviteCode] = useState(null)
    const [toogle, setToogle] = useState(true);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    async function fetchInviteCode(req, res, next) {
        try {
            const res = await fetch("http://localhost:5000/admin/api/studio-setting/invite-code", {
                credentials: "include"
            })
            const data = await res.json();
            if (res.status >= 300 || !data.inviteCode) {
                return Swal.fire({
                    title: "error!",
                    text: data.message,
                    icon: "error",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            setInviteCode(data.inviteCode)
        } catch (error) {
            Swal.fire({
                title: "error!",
                text: error.message,
                icon: "error",
                timer: 2000,
                showConfirmButton: false
            });
        }
    }
    useEffect(() => {
        fetchInviteCode();
    }, [])
    const regenerateCode = async () => {
        try {
            const res = await fetch("http://localhost:5000/admin/api/studio-setting/invite-code/regenerate", {
                credentials: "include",
                method: "GET"
            })
            const data = await res.json();
            if (res.status >= 300) {
                return Swal.fire({
                    title: "error!",
                    text: data.message,
                    icon: "error",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            fetchInviteCode();
        } catch (error) {
            Swal.fire({
                title: "error!",
                text: error.message,
                icon: "error",
                timer: 2000,
                showConfirmButton: false
            });
        }
    }
    return (
        <>


            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 mx-5">
                <div className="flex flex-col items-center my-5">

                    <h5 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">Invite Code</h5>
                    <div className="header w-full flex items-center justify-evenly ">
                        {
                            isCodeVisible ?
                                <div className="flex gap-10 justify-center items-center px-2 py-1  bg-slate-200 rounded-md">
                                    <span className="text-xl text-wrap text-gray-500 dark:text-gray-400">{inviteCode ? inviteCode.code : ""}</span>
                                    <button type="button" onClick={() => setIsCodeVisible(prev => !prev)}>
                                        <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
                                    </button>
                                </div> :
                                <div className="flex gap-10  justify-center items-center px-2 py-1 bg-slate-200 rounded-md">
                                    <span className="text-3xl text-gray-500 dark:text-gray-400">{inviteCode ? "******" : ""}</span>
                                    <button type="button" onClick={() => setIsCodeVisible(prev => !prev)}>
                                        <svg className='w-5 h-5' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" ><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" /></svg>
                                    </button>
                                </div>
                        }
                    </div>
                    <div className="coder-expiry w-full flex justify-evenly items-center my-4 ">
                        <div className="expires-date">
                            <h2 className='text-xl font-semibold text-gray-900'>Expires At</h2>
                            {
                                inviteCode ?
                                    <div className="text-sm">
                                        {inviteCode.date}
                                    </div> :
                                    <div className=""></div>
                            }
                        </div>
                        <div className="">
                            <h2 className='text-xl font-semibold text-gray-900'>Status</h2>
                            <div className={`px-2  text-[15px] font-medium text-center text-white ${inviteCode ? (inviteCode.isValid ? "bg-green-600  hover:bg-green-700" : "bg-red-600  hover:bg-red-700") : "bg-red-600  hover:bg-red-700"}  rounded-lg`}>{inviteCode ? (inviteCode.isValid ? "Valid" : "invalid") : "invalid"}</div>
                        </div>
                    </div>
                    <hr className='w-full border-[0.5px] border-slate-200 ' />
                    <div className="generator w-full flex flex-col justify-evenly items-center my-2">
                        <div className="regenerate ">
                            <button className='shadow-md px-5 py-2 border-[1px] border-slate-400 text-sm font-medium text-center hover:bg-slate-300 text-black bg-slate-200 rounded-xl' onClick={regenerateCode}>
                                Regenrate
                            </button>
                        </div>
                    </div>
                    <hr className='w-full border-[0.5px] border-slate-200 ' />
                    <div className="generator w-full flex flex-col justify-evenly items-center mt-2">
                        <h2 className='w-full mb-3 text-xl text-center font-bold text-gray-900 dark:text-white'>Created By</h2>
                        <div className="tracking-wider text-xl">
                            {inviteCode ? inviteCode.createdBy : ""}
                        </div>
                    </div>
                </div>

                <div id="accordion-collapse" className='mt-5' data-accordion="collapse">
                    <h2 id="accordion-collapse-heading-1">
                        <button onClick={() => setToogle(!toogle)} type="button" className="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3" data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
                            <span>What is Admin Invite code?</span>
                            <svg data-accordion-icon className={`w-3 h-3 ${toogle ? "rotate-180" : "rotate-0"} shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                            </svg>
                        </button>
                    </h2>
                    <div id="accordion-collapse-body-1" className={`${toogle ? "hidden" : "block"}`} aria-labelledby="accordion-collapse-heading-1">
                        <div className="p-5 ">
                            <p className="mb-2 text-gray-500 dark:text-gray-400">
                                This invite code will be use to invite new admin without it he cannot access admin panel , you can change this code & share only those person who will manage website.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

        </>
    )
}

export default AdminInviteCode
