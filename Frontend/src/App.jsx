// src/App.jsx
import { Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import './index.css'
import Home from './Pages/User/Home/Index.jsx';
import FilmsRoute from './Pages/User/Films/FilmsRoute.jsx';
import Photos from './Pages/User/Photos/PhotoRoute.jsx';
import AllFilms from './Pages/User/Films/AllFilms.jsx';
import Search from './Pages/User/SearchPage/SearchResult.jsx';
import Contact from './Pages/User/Contact/Index.jsx';
import Team from './Pages/User/Team/Index.jsx';
import AboutPage from './Pages/User/AboutUs/AboutPage.jsx';

import AdminRoutes from './Pages/Admin/Index.jsx';
import NotFound from './Component/NotFound.jsx';
import Navbar from './Component/Navbar.jsx';
import Footer from './Component/Footer.jsx';
import Background from './Component/Background.jsx';
import StudioDetailsContext from './Context/StudioDetailsContext.jsx';

import DharaaEventManagement from "./Pages/User/Dharaa/Index.jsx"

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <StudioDetailsContext>
      {!isAdminRoute ? (
        <div className="relative min-h-screen">
          <Background />
          <div className="relative z-10">
            <Navbar />
            <main className="pt-[6rem] lg:pr-2 sm:px-2 box-border overflow-hidden">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/films/*" element={<FilmsRoute />} />
                <Route path="/allfilms" element={<AllFilms />} />
                <Route path="/photos/*" element={<Photos />} />
                <Route path="/search-result" element={<Search />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/team" element={<Team />} />
                <Route path="/about-us" element={<AboutPage />} />
                <Route path="/dharaa-event-management" element={<DharaaEventManagement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      )}
    </StudioDetailsContext>
  );
}
