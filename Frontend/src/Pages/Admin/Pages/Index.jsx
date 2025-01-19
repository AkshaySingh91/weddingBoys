import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NewTags from './NewTags'
import AddClient from './AddClient/AddClient'
import AllClients from './Clients/AllClients'
import ClientDetails from './Clients/ClientDetails'
import HomePage from '../Pages/HomePage/Index'
import Films from './Films/Index'
import Team from './Teams/Team'

function Index() {
  return (
    <Routes>
      <Route path='/home'
        element={<HomePage />}>
      </Route>
      <Route path='/films'
        element={<Films />}>
      </Route>
      <Route path='/teams'
        element={<Team />}>
      </Route>
      <Route path='/add-tags'
        element={<NewTags />}>
      </Route>
      <Route path='/add-client'
        element={<AddClient />}>
      </Route>
      <Route path='/clients'
        element={<AllClients />}>
      </Route>
      <Route path='/clients/:id'
        element={<ClientDetails />}>
      </Route>
    </Routes>
  )
}

export default Index
