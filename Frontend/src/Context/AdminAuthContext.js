import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom'
const api_url = process.env.REACT_APP_API_URL;

// protecting our route eg if user go on /chat first checkUserAuth will fetch user auth & if not valid he will redirect to /login also this context helps to get name, email at any compo 
const adminAuthContext = createContext(null);
export default function AdminAuthProvider(props) {
    const [isAdminValid, setIsAdminValid] = useState(false);
    const [name, setAdminName] = useState(null);
    const [email, setAdminEmail] = useState(null);
    const [phone, setAdminPhone] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserAuth = async () => {
            try {
                const res = await fetch(`${api_url}/admin/auth-status`, {
                    method: 'GET',
                    credentials: 'include'
                })
                const userData = await res.json();
                if (res.status === 200) {
                    setIsAdminValid(true);
                    setAdminName(userData.name)
                    setAdminEmail(userData.email)
                    setAdminPhone(userData.phone)
                } else {
                    navigate("/admin/login")
                }
            } catch (error) {
                console.log(error)
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
            finally {
                setLoading(false);
            }
        }
        checkUserAuth();
    }, [navigate]);
    
    return (
        <adminAuthContext.Provider value={{ isAdminValid, name, email, loading, phone, setIsAdminValid, setAdminEmail, setAdminName, setAdminPhone }}>
            {props.children}
        </adminAuthContext.Provider>
    )
}
export const useAuth = () => useContext(adminAuthContext);