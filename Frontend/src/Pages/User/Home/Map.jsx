import React, { useState, useEffect } from 'react'
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fireMessage } from '../../Admin/Pages/AuthPage/Signup';
import { Link } from 'react-router-dom';

export default function Map() {
    const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(true);
    const [clients, setClients] = useState([])

    useEffect(() => {
        const fetchMapClients = async () => {
            try {
                const res = await fetch(('http://localhost:5000/api/map-clients'))
                const data = await res.json()
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error');
                }
                setClients(data.clients);
                console.log(data.clients)
            } catch (error) {
                fireMessage(error.message, 'error');
            }
        }
        fetchMapClients();
    }, [])
    const handleBtnClick = () => {
        setIsMapSidebarOpen(!isMapSidebarOpen);
    }

    const heartIcon = new L.DivIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>`,
        className: "fill-red-600",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
    return (
        <>
            <div className="map-text-content flex flex-col items-center gap-1 mt-20 mb-10 sm:gap-3">
                <h1 className='text-primary text-desktopBodyLarge font-semibold sm:text-mobileBodyLarge text-nowrap'>Love Stories Capture across the map</h1>
                <h2 className='text-primary text-desktopBodySmall font-light text-center'>Tap on the icon to see which couples choose us to capture their special day</h2>
            </div>
            <div className="relative map flex justify-center w-full h-screen  box-border lg:px-5 lg:py-6">
                <div className={`  relative w-auto lg:h-auto overflow-hidden border-2 border-gray-400 rounded-2xl sm:h-3/4 flex-auto`}>
                    <div className={`w-full h-full rounded-2xl`}>
                        <MapContainer
                            center={[20.5937, 78.9629]}
                            zoom={6}
                            minZoom={4}
                            maxZoom={8}
                            scrollWheelZoom={true}
                            style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            {clients.map((c) => (
                                <Marker
                                    key={c.clientId}
                                    position={[c.coordinate.latitude, c.coordinate.longitute]}
                                    riseOnHover={true}
                                    icon={heartIcon}>
                                    <Popup
                                        closeOnClick={true}
                                        autoClose={false}
                                        className='m-0'
                                        closeButton={true}>
                                        <div className='text-center min-w-40 flex flex-col '>
                                            <Link to={`/films/${c.video._id.toString()}`}>
                                                <img
                                                    alt="map-client-image"
                                                    className=' lg:w-36 lg:h-28 sm:h-24 sm:w-40 rounded-lg object-cover bg-center border-[1px] border-gray-200'
                                                    src={c.url}/>
                                            </Link>
                                            <div className="text-content my-2 flex flex-col items-start justify-center font-serif opacity-70">
                                                <p style={{ margin: ' 5px 0', fontFamily: "sans-serif" }} className='px-2 my-1 uppercase text-wrap text-desktopBodySmall text-center'>
                                                    {c.clientName.Bride} & {c.clientName.Groom}
                                                </p>
                                                <p style={{ margin: '5px 0' }} className='px-2 my-1 uppercase text-mobileBodyMedium text-center w-full'>{c.photo.photoLocation.city}</p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        <button className={`sidebar-open-btn  ${isMapSidebarOpen ? 'hidden' : 'block'} z-[1000] absolute bottom-4 right-4 w-8 h-8 map-sidebar-btn rounded-full bg-gray-600 p-2 mb-4 ml-4`}
                            onClick={handleBtnClick} >
                            {isMapSidebarOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="white">
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                </svg>
                            ) : (
                                <svg
                                    className=""
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 -960 960 960"
                                    fill="white"
                                >
                                    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className={`${isMapSidebarOpen ? "flex z-[1000]" : "hidden"} lg:flex-row lg:items-end absolute h-full w-fit right-0 bottom-0 sm:flex-col sm:items-start sm:justify-end sm:w-full `}>
                        <button className="sidebar-open-btn z-[1000] w-8 h-8 map-sidebar-btn rounded-full bg-gray-600 p-2 mb-4 ml-4"
                            onClick={handleBtnClick} >
                            {isMapSidebarOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="white">
                                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                </svg>
                            ) : (
                                <svg
                                    className=""
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 -960 960 960"
                                    fill="white"
                                >
                                    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
                                </svg>
                            )}
                        </button>
                        <div
                            className={`map-sidebar ${isMapSidebarOpen ? "lg:w-auto sm:h-auto" : "lg:w-0 sm:h-0"
                                } lg:h-full px-3 py-2 transition-transform transform ${isMapSidebarOpen
                                    ? "lg:translate-x-0 lg:translate-y-0 sm:translate-y-0"
                                    : "lg:translate-x-full lg:translate-y-0 sm:translate-y-full"
                                } sm:w-full`}>
                            <div className={`flex lg:flex-col bg-gray-700 lg:h-full max-h-full w-auto px-4 lg:py-4 sm:py-2 rounded-xl `}>
                                <h2 className="sm:hidden lg:block pb-4 text-white sticky top-0 bg-gray-700">
                                    Clients
                                </h2>
                                <div className="clients flex lg:flex-col overflow-y-auto scrollbar-none sm:flex-row lg:w-auto lg:h-full sm:h-fit">
                                    {
                                        clients.map((c, idx) => (
                                            <Link key={c.clientId} to={`/films/${c.video._id}`}>
                                                <div className={`client${idx} relative flex lg:flex-row lg:gap-3 sm:gap-1 justify-center p-2 hover:bg-gray-700 rounded-lg sm:flex-col`}>
                                                    <div className="img-wrapper lg:w-36 lg:h-28 sm:h-24 sm:w-40">
                                                        <img
                                                            src={c.url}
                                                            className="w-full h-full lg:rounded-lg sm:rounded-md object-cover bg-center"
                                                            alt="Client"
                                                        />
                                                    </div>
                                                    <div className="text flex flex-col justify-center text-desktopBodySmall text-[#ffffff]">
                                                        <div className="client-name flex flex-wrap gap-2 font-semibold text-wrap whitespace-normal max-w-32">
                                                            <p className='py-1'>
                                                                <span className="bride uppercase">{c.clientName.Bride}</span> &
                                                                <span className="groom uppercase"> {c.clientName.Groom}</span>
                                                            </p>
                                                        </div>
                                                        <div className="date flex flex-wrap gap-2 text-nowrap">
                                                            <span className="capitalize">{c.video.videoShootDate}</span>
                                                        </div>
                                                        <div className="sm:hidden lg:block location flex flex-wrap gap-2 text-nowrap">
                                                            <span className="capitalize">{c.video.videoLocation.city}</span>
                                                        </div>
                                                    </div>

                                                </div>
                                            </Link>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}
