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
import AdminAuthProvider from '../../Context/AdminAuthContext'
import Blogs from "./Blogs/BlogEditor/Index"
import BlogList from './Blogs/BlogsList/Index'

function Index() {
    const location = useLocation()
    const isAuthPage = location.pathname === '/admin/login' || location.pathname === '/admin/signup' || location.pathname === '/admin/forgot-password';
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            {
                isAuthPage &&
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-md">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                        </Routes>
                    </div>
                </div>
            }
            {
                !isAuthPage &&
                <AdminAuthProvider>
                    <div className="flex flex-col lg:flex-row min-h-screen">
                        <AdminSidebar />

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col transition-all duration-300">
                            <Header />

                            <main className="flex-grow p-4 sm:p-6">
                                <div className="max-w-7xl mx-auto w-full">
                                    <Routes>
                                        <Route path='/dashboard' element={<Dashboard />} />
                                        <Route path='/blogs' element={<BlogList />} />
                                        <Route path='/studio-setting' element={<StudioSetting />} />
                                        <Route path='/user' element={<AllAdmin />} />
                                        <Route path='/website-setting/*' element={<WebsiteSetting />} />
                                        <Route path='/profile' element={<Profile />} />
                                        <Route path='/total-Enquires' element={<TotalEnquires />} />
                                        <Route path='/*' element={<NotFound />} />
                                    </Routes>
                                </div>
                            </main>

                            <Footer />
                        </div>
                    </div>
                </AdminAuthProvider>
            }

        </div>
    )
}

export default Index
