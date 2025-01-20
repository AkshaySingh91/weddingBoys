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

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin')


  return (<>
    <StudioDetailsContext>
      {
        !isAdminRoute &&
        <div className='lg:pt-4 lg:pl-40 lg:pr-2 sm:px-2  box-border max-w-screen min-h-screen  scrollbar-thin'>
          <Header></Header>
          <Sidebar></Sidebar>
          <main className='w-auto h-auto box-border bg-primary rounded-2xl item-center overflow-x-hidden'>
            <Routes>
              <Route exact path='/' element={
                <Home></Home>}>
              </Route>
              <Route path='/films/*' element={
                <FilmsRoute></FilmsRoute>}>
              </Route>
              <Route path='/allfilms' element={
                <AllFilms></AllFilms>}>
              </Route>
              <Route path='/photos/*' element={
                <Photos></Photos>}>
              </Route>
              <Route path='/search-result' element={
                <Search></Search>}>
              </Route>
              <Route exact path='/contact' element={
                <Contact></Contact>}>
              </Route>
              <Route exact path='/team' element={
                <Team></Team>}>
              </Route>
              <Route path='/*'
                element={<NotFound />}>
              </Route>
            </Routes>
          </main>
          <Footer></Footer>
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