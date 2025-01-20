import React, { useState, useEffect, useCallback } from 'react'
import Swal from "sweetalert2"
const api_url = process.env.REACT_APP_API_URL;

function Index() {
    const [inquiries, setInquiries] = useState([]);
    const [toogleInquiryVisible, setToogleInquiryVisible] = useState([]);

    const fetchInquiries = useCallback(
        async () => {
            try {
                const res = await fetch(`${api_url}/admin/api/get-clients-enquiry`, {
                    credentials: "include"
                });
                const data = await res.json();
                if (res.status === 200) {
                    const isVisible = data.allInquiries.map((inq) => ({ id: inq._id, isVisible: false }))
                    setToogleInquiryVisible(isVisible)
                    setInquiries(data.allInquiries);
                } else {
                    Swal.fire('Error', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }, []);

    const markViewed = async (id) => {
        try {
            const data = await fetch(`${api_url}/admin/api/enquires/mark-viewed/${id}`, { method: 'PATCH', credentials: "include" });
            if (data.status >= 300) {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
    const toogleDetailsView = async (id) => {
        // mark viewed for first time 
        setInquiries(prev => {
            if (prev.find(enq => enq._id === id)) {
                return prev.map((enq) => {
                    if (enq._id === id) {
                        if (!enq.isViewed) {
                            markViewed(id)
                        }
                        return { ...enq, ...{ isViewed: true } }
                    } return enq
                })
            }
        })
        // toogle view
        setToogleInquiryVisible(prev => {
            if (prev.find(enq => enq.id === id)) {
                return prev.map((enq) => {
                    if (enq.id === id) {
                        let isV = enq.isVisible
                        return { ...enq, ...{ isVisible: !isV } }
                    } return enq
                })
            }
        })
    };
    const deleteInquiry = async (id) => {
        try {
            await fetch(`${api_url}/admin/api/enquires/${id}`, { method: 'DELETE', credentials: "include" });
            Swal.fire('Deleted!', 'Inquiry has been deleted.', 'success');
            fetchInquiries();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    return (
        <div className="min-h-screen w-full">
            <h1 className='text-center text-2xl font-semibold'>Client Inquiries</h1>
            <div className='w-full px-4 py-4 bg-slate-100 '>
                <div className='pb-4'>
                    <div className='w-full grid grid-cols-6 col-auto justify-evenly text-center border[1px] border-slate-400 bg-slate-400 py-2 px-4 rounded-lg divide-x'>
                        <p>Bride</p>
                        <p>Groom</p>
                        <p>Contact</p>
                        <p>Date</p>
                        <p>Viewed</p>
                        <p>Actions</p>
                    </div>
                </div>
                {
                    inquiries.length ?
                        <div className="space-y-2 p-2 bg-slate-200 rounded-lg ">
                            {inquiries.map((inq) => (
                                <div key={inq._id} className="">
                                    <div className='header cursor-pointer grid grid-cols-6 col-auto shadow-md px-2 py-3 border-[1px] border-slate-400 rounded-md text-center'
                                        onClick={() => toogleDetailsView(inq._id)}>
                                        <p className='text-ellipsis overflow-hidden text-center'>{inq.Bride}</p>
                                        <p className='text-ellipsis overflow-hidden text-center'>{inq.Groom}</p>
                                        <p className='text-ellipsis overflow-hidden text-center'>{inq.Contact}</p>
                                        <p className='text-ellipsis overflow-hidden text-center'>{inq.Date.start}</p>
                                        <p className='flex justify-center items-center '>
                                            {inq.isViewed ?
                                                <svg className="w-6 h-6 fill-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"  ><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" /></svg>
                                                : <svg className="w-6 h-6 fill-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M14.7649 6.07595C14.9991 6.22231 15.0703 6.53078 14.9239 6.76495C14.4849 7.46742 13.9632 8.10644 13.3702 8.66304L14.5712 9.86405C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30816C11.8049 9.90282 10.9089 10.3621 9.93374 10.651L10.383 12.3276C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76266 13.0115 9.4885 12.8532 9.41703 12.5864L8.95916 10.8775C8.48742 10.958 8.00035 10.9999 7.5 10.9999C6.99964 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97063 12.94C4.7039 12.8685 4.5456 12.5944 4.61706 12.3277L5.06624 10.651C4.09111 10.3621 3.19503 9.90281 2.3989 9.30814L1.1359 10.5711C0.940638 10.7664 0.624058 10.7664 0.428797 10.5711C0.233537 10.3759 0.233537 10.0593 0.428797 9.86404L1.62982 8.66302C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53078 0.000898545 6.22231 0.235064 6.07595C0.46923 5.9296 0.777703 6.00078 0.924057 6.23495C1.40354 7.00212 1.989 7.68056 2.66233 8.2427C2.67315 8.25096 2.6837 8.25971 2.69397 8.26897C4.00897 9.35527 5.65536 9.9999 7.5 9.9999C10.3078 9.9999 12.6563 8.50629 14.0759 6.23495C14.2223 6.00078 14.5308 5.9296 14.7649 6.07595Z" fill="currentColor" />
                                                </svg>}</p>
                                        <p className='text-ellipsis overflow-hidden '>
                                            <button onClick={() => deleteInquiry(inq._id)}>
                                                <svg className='w-7 h-7 fill-black' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"  ><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                                            </button>
                                        </p>
                                    </div>
                                    {
                                        toogleInquiryVisible.find(enq => enq.id === inq._id)?.isVisible && (
                                            <div className='w-full py-2 px-4 space-y-2'>
                                                <h2 className='text-center text-sm font-bold'>Inquiry Details</h2>
                                                <div className="name flex gap-4 ">
                                                    <p className='font-bold  '>Bride:
                                                        <span className="font-thin px-2">{inq.Bride}</span>
                                                    </p>
                                                    <p className='font-bold '>Groom:
                                                        <span className="font-thin px-2">{inq.Groom}</span>
                                                    </p>
                                                </div>
                                                <div className="contact">
                                                    <p className='font-bold '>Contact:
                                                        <span className="font-thin px-2">{inq.Contact}</span>
                                                    </p>
                                                </div>
                                                <div className="date flex gap-4">
                                                    <p className='font-bold '>Start:
                                                        <span className="font-thin px-2">{inq.Date.start}</span>
                                                    </p>
                                                    <p className='font-bold '>End:
                                                        <span className="font-thin px-2">{inq.Date.end}</span>
                                                    </p>
                                                </div>
                                                <div className="reach">
                                                    <p className='font-bold '>Reach:
                                                        <span className="font-thin px-2">{inq.Reach}</span>
                                                    </p>
                                                </div>
                                                <div className="SubmittedTime">
                                                    <p className='font-bold '>Submitted Time:
                                                        <span className="font-thin px-2">{inq.SubmittedTime}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                            ))
                            }
                        </div> :
                        <div className="text-center font-bold leading-snug tracking-widest my-6 text-xl">No inquires Yet !</div>
                }
            </div>

        </div >
    );
}

export default Index
