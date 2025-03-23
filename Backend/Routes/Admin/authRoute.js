import express from "express";
import { adminSignup, adminLogin, adminAuthStatus, adminLogout, requestOtp, verifyOtp, checkIsAdminAvailable, updatePassword } from "../../Controllers/adminController.js";
import { verifyToken, signupValidator, loginValidator } from "../../Utils/validator.js";

const adminRoute = express.Router();
adminRoute.use(express.json());


// first verify data inc file meta , name also check if he exist
adminRoute.post('/api/admin/verify-details', signupValidator)
// generate otp & save otp in schema for further validation
adminRoute.post('/api/admin/request-otp', requestOtp)
// verify otp store in schema check if there otp exist & if it not expire 
adminRoute.post('/api/admin/verify-otp', verifyOtp)
// save all details 
adminRoute.post('/api/admin/signup', adminSignup)
/***********************************************************************/


adminRoute.post('/api/admin/login', loginValidator, adminLogin)
/***********************************************************************/

adminRoute.post('/api/admin/check-details', checkIsAdminAvailable)
/***********************************************************************/
// it will update password if previous not remember
adminRoute.post('/api/admin/update-password', updatePassword)
/***********************************************************************/
// it use middleware to check if he is admin 
adminRoute.get('/api/admin/auth-status', verifyToken, adminAuthStatus)
/***********************************************************************/
// clear cookiee 
adminRoute.get('/api/admin/logout', adminLogout)





export default adminRoute;