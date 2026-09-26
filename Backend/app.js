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
        : ['http://localhost:5173', 'http://localhost:3000', 'http://admin.localhost:3000'],
    credentials: true,
};


app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser(process.env.COOKIE_SECRET_KEY))

// Routes
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
import weddingRoute from './Routes/User/weddingRoute.js'
import collectionRoute from './Routes/User/collectionRoute.js'
import adminCollectionRoute from './Routes/Admin/collectionRoute.js'
import photosRoute from './Routes/User/photoRoute.js'
import btsRoleRoutes from './Routes/Admin/btsRoleRoutes.js';
import blogsRoute from './Routes/Admin/blogsRoute.js'
import embedRoute from './Routes/Admin/embedRoute.js'
import mediaRoute from './Routes/Admin/mediaRoute.js'
import publicBlogRoute from './Routes/User/blogRoute.js'
import publicCommentRoute from './Routes/User/commentRoute.js'
import publicBlogAnalyticsRoute from './Routes/User/blogAnalyticsRoute.js'
import adminCommentRoute from './Routes/Admin/commentAdminRoute.js'
import adminBlogAnalyticsRoute from './Routes/Admin/blogAnalyticsAdminRoute.js'
import authV2Route from './Routes/Admin/authV2Route.js'
import userRoute from './Routes/Admin/userRoute.js'
import publicContentRoute from './Routes/User/contentRoute.js'
import adminContentRoute from './Routes/Admin/contentRoute.js'
import pricingConfigRoute from './Routes/User/pricingConfigRoute.js'
import adminOpsRoute from './Routes/Admin/adminOpsRoute.js'
import { startBlogPublishScheduler } from './Services/blogPublishScheduler.js';
// browser→R2 direct upload control plane (create/sign/parts/complete/abort)
import uploadRoute from './Routes/Admin/uploadRoute.js'
// portfolio: assign media to clients, cross-client curation
import portfolioRoute from './Routes/Admin/portfolioRoute.js'
// wedding ceremonies master taxonomy (Haldi, Mehendi, Sangeet, etc.)
import ceremonyRoute from './Routes/Admin/ceremonyRoute.js'
import taxonomyRoute from './Routes/Admin/taxonomyRoute.js'

// all this route wont required authentication
app.use(HomePageRoute)
app.use(photosRoute)
app.use(videosRoute)
// public wedding story pages — must stay above clientEnquiryRoute (admin auth)
app.use(weddingRoute)
app.use(collectionRoute)
app.use(studioDetailsRoute)
app.use(submitEnquiryRoute)
app.use(searchRoute)
app.use(getTeamImage)
app.use(publicBlogRoute)
app.use(publicCommentRoute)
app.use(publicBlogAnalyticsRoute)
app.use(publicContentRoute)
app.use(pricingConfigRoute)
// ceremonies master taxonomy — public list + verifyToken-guarded admin CRUD
app.use(ceremonyRoute)
// tag system admin — verifyToken scoped to /api/admin/taxonomy inside the router
app.use(taxonomyRoute)
// collections (rows) admin — verifyToken scoped inside the router
app.use(adminCollectionRoute)
// enterprise auth (login/refresh/logout/forgot/reset) — guards applied per-route
app.use(authV2Route)
// user management — guards applied per-route (SuperAdmin for mutations)
app.use(userRoute)
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
app.use(adminBlogAnalyticsRoute)
app.use(blogsRoute)
app.use(adminCommentRoute)
app.use(embedRoute)
app.use(mediaRoute)
// Mounted before adminOpsRoute, which applies verifyToken to everything that
// reaches it — anything after that router inherits its guard.
app.use(uploadRoute)
app.use(portfolioRoute)
// content CMS — guards applied per-route
app.use(adminContentRoute)
// pricing CRUD, globals, analytics — verifyToken applied inside the router
app.use(adminOpsRoute)

const server = () => {
    DBconnection()
    startBlogPublishScheduler()
    app.listen(PORT, () => {
        console.log('Listning...')
    })
}
server();
