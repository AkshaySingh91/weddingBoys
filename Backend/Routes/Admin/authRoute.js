import express from "express";
import { adminSignup, adminLogin, adminAuthStatus, adminLogout, requestOtp, verifyOtp, checkIsAdminAvailable, updatePassword } from "../../Controllers/adminController.js";
import { verifyToken, signupValidator, loginValidator } from "../../Utils/validator.js";

const adminRoute = express.Router();
adminRoute.use(express.json());


// first verify data inc file meta , name also check if he exist
adminRoute.post('/admin/verify-details', signupValidator)
// generate otp & save otp in schema for further validation
adminRoute.post('/admin/request-otp', requestOtp)
// verify otp store in schema check if there otp exist & if it not expire 
adminRoute.post('/admin/verify-otp', verifyOtp)
// save all details 
adminRoute.post('/admin/signup', adminSignup)
/***********************************************************************/


adminRoute.post('/admin/login', loginValidator, adminLogin)
/***********************************************************************/

adminRoute.post('/admin/check-details', checkIsAdminAvailable)
/***********************************************************************/
// it will update password if previous not remember
adminRoute.post('/admin/update-password', updatePassword)
/***********************************************************************/
// it use middleware to check if he is admin 
adminRoute.get('/admin/auth-status', verifyToken, adminAuthStatus)
/***********************************************************************/
// clear cookiee 
adminRoute.get('/admin/logout', adminLogout)





export default adminRoute;