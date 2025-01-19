import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Films from './FilmPage'
import SpecificFilm from './SpecificFilm'

function FilmsRoute() {
    return (
        <>
            <Routes>
                <Route path='/'
                    element={<Films />}>
                </Route>
                <Route path='/:videoId'
                    element={<SpecificFilm />}>
                </Route>
            </Routes>
        </>
    )
}

export default FilmsRoute
