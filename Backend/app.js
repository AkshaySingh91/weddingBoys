import 'dotenv/config';
import express from 'express'
import DBconnection from './Config/DBconnection.js';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { startEnquiryNotifications } from './Services/enquiryNotifications.js';
import mongoose from 'mongoose';
import Enquiry from './Models/EnquirySchema.js';
import Media from './Models/Media.js';
import MediaJob from './Models/MediaJob.js';
import { protectAdmin } from './Middleware/adminPolicy.js';
const app = express();
const PORT = process.env.PORT || 8080;
// The API is reverse-proxied by local Nginx. Never trust arbitrary forwarded IPs.
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');
// middlewares
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://theweddingvachan.com', 'https://www.theweddingvachan.com', 'https://admin.theweddingvachan.com']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://admin.localhost:3000', 'http://admin.localhost:3001'],
    credentials: true,
};


app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser(process.env.COOKIE_SECRET_KEY))
app.get('/api/health', (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    return res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' });
});
app.use('/api/admin', protectAdmin);

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
import browseRoute from './Routes/User/browseRoute.js'
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
import sequenceRoute from './Routes/sequenceRoute.js'
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
app.use(browseRoute)
app.use(studioDetailsRoute)
app.use(submitEnquiryRoute)
app.use(searchRoute)
app.use(getTeamImage)
app.use(publicBlogRoute)
app.use(publicCommentRoute)
app.use(publicBlogAnalyticsRoute)
app.use(publicContentRoute)
app.use(pricingConfigRoute)
app.use(sequenceRoute)
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


const server = async () => {
    for (const key of ['MONGO_URI', 'JWT_SECRET_KEY', 'COOKIE_SECRET_KEY']) {
        if (!process.env[key]) throw new Error(`${key} is required`);
    }
    await DBconnection();
    await Promise.all([
        Enquiry.init(), MediaJob.init(),
        Media.collection.createIndex({ mediaId: 1 }, { unique: true }),
    ]);
    startBlogPublishScheduler();
    startEnquiryNotifications();
    app.listen(PORT, () => {
        console.log('Listning...')
    })
}
server().catch(async (error) => {
    console.error('API startup failed:', error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
});
