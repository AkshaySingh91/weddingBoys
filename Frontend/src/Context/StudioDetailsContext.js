import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import Swal from "sweetalert2";

const api_url = process.env.REACT_APP_API_URL;
const studioDetailsContext = createContext();
function StudioDetailsContext({ children }) {
    const [studioName, setStudioName] = useState(null);
    const [studioLogo, setStudioLogo] = useState(null);
    const [studioAddress, setStudioAddress] = useState(null);
    const [studioContact, setStudioContact] = useState(null);
    const [studioEmail, setStudioEmail] = useState(null);
    const [studioSocials, setStudioSocials] = useState(null);

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
    useEffect(() => {
        getStudioDetails()
    }, [])
    return (
        <studioDetailsContext.Provider value={{ studioName, studioSocials, studioAddress, studioContact, studioEmail, studioLogo }}>
            {children}
        </studioDetailsContext.Provider>
    )
}

export const useStudioDetails = () => useContext(studioDetailsContext);

export default StudioDetailsContext
