import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Dashboard from './Dashboard/Index'
import AllAdmin from './User/Index'
import Profile from './Pages/AdminProfile/Index'
import WebsiteSetting from './Pages/Index'
import TotalEnquires from "./Pages/TotalEnquires/Index"
import Login from './Pages/AuthPage/Login'
import { Signup } from './Pages/AuthPage/Signup'
import ForgotPassword from './Pages/AuthPage/ForgotPassword'
import AdminSidebar from '../../Component/AdminSidebar'
import StudioSetting from "../Admin/Setting/Index"
import Header from '../../Component/Header'
import Footer from '../../Component/Footer'
import NotFound from '../../Component/NotFound'

function Index() {
    const location = useLocation()
    const isAuthPage = location.pathname === '/admin/login' || location.pathname === '/admin/signup' || location.pathname === '/admin/forgot-password';
    return (
        <>
            {
                isAuthPage &&
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Routes>
            }
            {
                !isAuthPage &&
                <>
                    <div className=' pt-4 lg:pl-40 pr-2 sm:pl-4  box-border w-screen min-h-screen overflow-hidden'>
                        <main className='flex flex-col box-border bg-primary rounded-2xl item-center  ' >
                            <Header />
                            <AdminSidebar />
                            <Routes>
                                <Route path='/dashboard'
                                    element={<Dashboard />}>
                                </Route>
                                <Route path='/studio-setting'
                                    element={<StudioSetting />}>
                                </Route>
                                <Route path='/user'
                                    element={<AllAdmin />}>
                                </Route>
                                <Route path='/website-setting/*'
                                    element={<WebsiteSetting />}>
                                </Route>
                                <Route path='/profile'
                                    element={<Profile />}>
                                </Route>
                                <Route path='/total-Enquires'
                                    element={<TotalEnquires />}>
                                </Route>
                                <Route path='/*'
                                    element={<NotFound />}>
                                </Route>
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </>
            }

        </>
    )
}

export default Index
