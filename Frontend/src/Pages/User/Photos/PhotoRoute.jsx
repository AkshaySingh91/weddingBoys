import React from 'react'
import AllPhotos from './AllPhotos'
import SpecificPhoto from './SpecificPhoto'
import { Route, Routes } from 'react-router-dom'

function Index() {
  return (
    <>
      <Routes>
        <Route path='/'
          element={<AllPhotos />}>
        </Route>
        <Route path='/:photoId'
          element={<SpecificPhoto  />}>
        </Route>
      </Routes>
    </>
  )
}

export default Index
