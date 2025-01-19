import React from 'react'
import { useAuth } from '../../../Context/AdminAuthContext'
import { Navigate, useLocation } from 'react-router-dom'

function Index() {
  const admin = useAuth();
  const location = useLocation(); 
  if (admin.loading) {
    return (<>
      <div className="mx-auto w-fit h-96 my-20">
        <div className="animate-spin  inline-block size-20 border-4 border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
        </div>
      </div>
    </>)
  }
  return (<>
    {!admin.isAdminValid ?
      <Navigate to='/admin/login' state={{ from: location }} /> :
      <div>Dashboard</div>
      

    }</>)
}

export default Index
