import React from 'react'
import { Link } from 'react-router-dom'
import dashboardSvg from '../Asset/dashboard-svg.svg'
import { useState } from 'react'
import { useStudioDetails } from '../Context/StudioDetailsContext'
export default function AdminSidebar() {
    const [collapsed, setCollapsed] = useState({
        dashboard: false,
        profile: false,
        settings: false,
    });
    const { studioLogo } = useStudioDetails();
    const toggleCollapse = (section) => {
        setCollapsed((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (<>
        <div className="fixed lg:block lg:left-0 lg:top-0 lg:w-36  lg:p-0 lg:rounded-none lg:h-full z-10 box-border  sm:bottom-4 sm:left-0 sm:w-screen sm:h-fit sm:px-4 sm:py-3 sm:flex sm:justify-center">
            <div className="lg:flex lg:justify-center lg:items-center w-full h-1/4 flex items-center justify-center py-4 lg:rounded-br-3xl bg-primary_on sm:hidden ">
                <div className="w-28 h-28 rounded-full overflow-hidden ">
                    <img className='w-full h-full object-cover bg-center' src={studioLogo ? studioLogo : "https://placehold.jp/250x50.png"} alt="" />
                </div>
            </div>

            <div className="lg:h-3/4 lg:block text-desktopBodySmall font-primary text-primary lg:rounded-none lg:rounded-tr-3xl  bg-primary_on lg:py-8 sm:w-fit  sm:flex max-w-full sm:gap-1 sm:justify-center sm:item:center sm:rounded-3xl sm:px-2 overflow-y-auto scrollbar-thin">
                <div className="Dashboard">
                    <Link to="/admin/dashboard" className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '>
                        <img className='w-7 h-7' src={dashboardSvg} alt="" />
                        <span className='sm:hidden lg:block '>Dashboard</span>
                    </Link>
                </div>
                <div className="Website-setting">
                    <button onClick={(e) => {
                        toggleCollapse('dashboard');
                    }} className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '>
                        <svg className='w-7 h-7' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M480-160q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740v506q51-33 107-49.5T700-300q36 0 78.5 7t81.5 29v-505q9.89 3.75 19.44 7.87Q889-757 898-752q10 6 16 15.68 6 9.67 6 20.32v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm60-167v-353l260-260v387L540-327Zm-120 63v-439q-34-19-79-28t-81-9q-47 0-87.5 10T100-704.47V-264q35-17 75.5-26.5t85-9.5q44.5 0 84.5 9.5t75 26.5Zm0 0v-439 439Z" /></svg>
                        <span className='sm:hidden lg:block '>Website setting</span>
                        <svg
                            className={`transform ${collapsed.dashboard ? "rotate-180" : ""
                                } transition-transform`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                    <div
                        className={`mt-2 pl-6 transition-all duration-300 ${collapsed.dashboard ? "h-auto" : "max-h-0 overflow-hidden"}`}>
                        <ul className="space-y-2">
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/home">Home</Link></li>
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/films">films</Link></li>
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/teams">teams</Link></li>
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/add-client">add Client</Link></li>
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/clients">All client</Link></li>
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/add-tags">New tags</Link></li>
                            <li><Link className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '
                                to="/admin/website-setting/bts-schema-manager">BtsSchemaManager</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="studio-setting">
                    <Link to="/admin/studio-setting" className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200'>
                        <svg className='w-10 h-10' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="m388-80-20-126q-19-7-40-19t-37-25l-118 54-93-164 108-79q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521L80-600l93-164 118 54q16-13 37-25t40-18l20-127h184l20 126q19 7 40.5 18.5T669-710l118-54 93 164-108 77q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l108 78-93 164-118-54q-16 13-36.5 25.5T592-206L572-80H388Zm48-60h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Zm44-210q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-130Z" /></svg>
                        <span className='sm:hidden lg:block '>Studio setting</span>
                    </Link>
                </div>
                <div className="total-Enquires">
                    <Link to="/admin/total-Enquires" className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '>
                        <svg className='w-8 h-8' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M795-120q-116 0-236.5-56T335-335Q232-438 176-558.5T120-795q0-19.29 12.86-32.14Q145.71-840 165-840h140q14 0 24 10t14 25l26.93 125.64Q372-665 369.5-653.5t-10.73 19.73L259-533q26 44 55 82t64 72q37 38 78 69.5t86 55.5l95-98q10-11 23.15-15 13.15-4 25.85-2l119 26q15 4 25 16.04 10 12.05 10 26.96v135q0 19.29-12.86 32.14Q814.29-120 795-120ZM229-588l81-82-23-110H180q2 42 13.5 88.5T229-588Zm369 363q41 19 89 31t93 14v-107l-103-21-79 83ZM229-588Zm369 363Z" /></svg>
                        <span className='sm:hidden lg:block '>Total Enquires</span>
                    </Link>
                </div>
                <div className="Profile">
                    <Link to="/admin/profile" className='flex items-center gap-2 px-5 py-3 hover:opacity-50 transition-all duration-200 '>
                        <svg className='w-7 h-7' xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#000000"><path d="M222-255q63-44 125-67.5T480-346q71 0 133.5 23.5T739-255q44-54 62.5-109T820-480q0-145-97.5-242.5T480-820q-145 0-242.5 97.5T140-480q0 61 19 116t63 109Zm257.81-195q-57.81 0-97.31-39.69-39.5-39.68-39.5-97.5 0-57.81 39.69-97.31 39.68-39.5 97.5-39.5 57.81 0 97.31 39.69 39.5 39.68 39.5 97.5 0 57.81-39.69 97.31-39.68 39.5-97.5 39.5Zm.66 370Q398-80 325-111.5t-127.5-86q-54.5-54.5-86-127.27Q80-397.53 80-480.27 80-563 111.5-635.5q31.5-72.5 86-127t127.27-86q72.76-31.5 155.5-31.5 82.73 0 155.23 31.5 72.5 31.5 127 86t86 127.03q31.5 72.53 31.5 155T848.5-325q-31.5 73-86 127.5t-127.03 86Q562.94-80 480.47-80Zm-.47-60q55 0 107.5-16T691-212q-51-36-104-55t-107-19q-54 0-107 19t-104 55q51 40 103.5 56T480-140Zm0-370q34 0 55.5-21.5T557-587q0-34-21.5-55.5T480-664q-34 0-55.5 21.5T403-587q0 34 21.5 55.5T480-510Zm0-77Zm0 374Z" /></svg>
                        <span className='sm:hidden lg:block '>Profile</span>
                    </Link>
                </div>
            </div>
        </div >
    </>)
}