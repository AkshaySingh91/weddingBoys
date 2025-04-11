import express from 'express'
import dotenv from 'dotenv'
import DBconnection from './Config/DBconnection.js';
import cors from 'cors'
import cookieParser from 'cookie-parser';
dotenv.config();
const app = express();
const PORT = process.env.PORT;
// middlewares
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://theweddingboys.in', 'https://www.theweddingboys.in']
        : 'http://localhost:3000',
    credentials: true,
};


app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser(process.env.COOKIE_SECRET_KEY))

// Routes
// it include signup, login etc
import authRoute from './Routes/Admin/authRoute.js'
// it include add & updating client details
import clientQueryRoute from './Routes/Admin/clientQueryRoute.js'
// it will change content from home page
import updateHomePage from "./Routes/Admin/HomePageRoute.js"
// it will update tags
import TagsRoute from "./Routes/Admin/TagsRoute.js"
// it will change client reviews
import ReviewRoute from "./Routes/Admin/ReviewRoutes.js"
import ProfilePageRoute from "./Routes/Admin/ProfilePageRoute.js"
import studioSettingRoute from "./Routes/Admin/SettingRoute.js"
import clientEnquiryRoute from "./Routes/Admin/ClientEnquiryRoute.js"
import adminTeamImageRoute from "./Routes/Admin/TeamImageRoute.js"
import studioDetailsRoute from './Routes/User/studioDetailsRoute.js'
import submitEnquiryRoute from "./Routes/User/enqueryRoute.js"
import searchRoute from "./Routes/User/searchRoute.js"
import getTeamImage from "./Routes/User/TeamImageRoute.js"

// it will show all content for home page
import HomePageRoute from "./Routes/User/homePageRoute.js"
// it will give all videos  
import videosRoute from './Routes/User/videoRoute.js'
import photosRoute from './Routes/User/photoRoute.js'
import btsRoleRoutes from './Routes/Admin/btsRoleRoutes.js';


// all this route wont required authentication
app.use(HomePageRoute)
app.use(photosRoute)
app.use(videosRoute)
app.use(authRoute)
app.use(studioDetailsRoute)
app.use(submitEnquiryRoute)
app.use(searchRoute)
app.use(getTeamImage)
// all this route required authentication
app.use(clientEnquiryRoute)
app.use(studioSettingRoute)
app.use(ReviewRoute)
app.use(TagsRoute)
app.use(updateHomePage)
app.use(clientQueryRoute)
app.use(ProfilePageRoute)
app.use(adminTeamImageRoute)
app.use('/api/bts-schema', btsRoleRoutes);


const server = () => {
    DBconnection()
    app.listen(PORT, () => {
        console.log('Listning...')
    })
}
server();
