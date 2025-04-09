import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css';
import Home from './Pages/User/Home/Index.jsx'
import FilmsRoute from './Pages/User/Films/FilmsRoute.jsx'
import Photos from './Pages/User/Photos/PhotoRoute.jsx'
import Team from './Pages/User/Team/Index.jsx'
import Contact from './Pages/User/Contact/Index.jsx'
import Header from './Component/Header.jsx'
import Sidebar from './Component/Sidebar.jsx'
import Footer from './Component/Footer.jsx'
import StudioDetailsContext from './Context/StudioDetailsContext.js';
import AdminRoutes from './Pages/Admin/Index.jsx'
import NotFound from './Component/NotFound.jsx';
import Search from "./Pages/User/SearchPage/SearchResult.jsx"
import AllFilms from './Pages/User/Films/AllFilms.jsx';
import AboutPage from './Pages/User/AboutUs/AboutPage.jsx';
import Navbar from './Component/Navbar.jsx';
import Background from "./Component/Background.jsx"

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin')


  return (<>
    <StudioDetailsContext>
      {
        !isAdminRoute &&
        <div className="relative min-h-screen">
          {/* Cinematic Background (placed behind the content) */}
          <Background />
          {/* Content wrapper with higher z-index */}
          <div className="relative z-10">
            <Navbar />
            <main className="pt-[6rem] lg:pr-2 sm:px-2 box-border overflow-hidden">
              <Routes>
                <Route exact path='/' element={<Home />} />
                <Route path='/films/*' element={<FilmsRoute />} />
                <Route path='/allfilms' element={<AllFilms />} />
                <Route path='/photos/*' element={<Photos />} />
                <Route path='/search-result' element={<Search />} />
                <Route exact path='/contact' element={<Contact />} />
                <Route exact path='/team' element={<Team />} />
                <Route exact path='/about-us' element={<AboutPage />} />
                <Route path='/*' element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      }
      {
        isAdminRoute &&
        <Routes >
          <Route path='/admin/*'
            element={<AdminRoutes />}>
          </Route>
        </Routes>
      }
    </StudioDetailsContext>
  </>);
}

export default App;

