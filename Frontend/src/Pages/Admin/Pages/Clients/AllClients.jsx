import React, { useState } from 'react'
import { useEffect } from 'react'
import { fireMessage } from '../AuthPage/Signup'
import { Link } from 'react-router-dom'
import Loader from '../../../../Component/Loader'

function AllClients() {
    const [clientDetails, setClientDetails] = useState([])

    useEffect(() => {
        async function fetchAllClients() {
            try {
                const res = await fetch("http://localhost:5000/admin/api/clients", {
                    method: "GET",
                    credentials: "include"
                })
                const data = await res.json()
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error')
                }
                setClientDetails(data.clientDetails)
            } catch (error) {
                console.log(error)
                return fireMessage(error.message, 'error')
            }
        }
        fetchAllClients()
    }, [])

    return (
        <>
            {
                !clientDetails.length ?
                    <Loader /> :
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-gray-100 rounded-lg">
                        {
                            clientDetails.map((client) => {
                                const shootDate = client.media.videoShootDate || client.media.photoShootDate;
                                const mediaUrl = client.media.thumbnailUrl
                                return (
                                    <div key={client.clientId} className="client bg-white shadow-md rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
                                        <Link to={`/admin/website-setting/clients/${client.clientId}`} className="block aspect-video  sm:h-32 sm:w-full mb-4 relative group">
                                            {mediaUrl ? (
                                                <img
                                                    className="w-full h-full rounded-lg object-cover group-hover:opacity-80 transition-opacity duration-300"
                                                    src={mediaUrl}
                                                    alt={`${client.clientName.Bride} & ${client.clientName.Groom}'s shoot`}
                                                    controls />

                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600 text-sm rounded-lg">
                                                    No Media Available
                                                </div>
                                            )}
                                        </Link>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {client.clientName.Bride} & {client.clientName.Groom}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                <strong>Shoot Date:</strong> {shootDate ? new Date(shootDate).toDateString() : 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>Last Modified:</strong> {client.timestamp ? new Date(client.timestamp).toDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>

            }
        </>
    )
}

export default AllClients
