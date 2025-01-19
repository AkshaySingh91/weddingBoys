import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'

import { getAllClients, getSingleClientDetails, checkClientDetails, sendPutUrlsForNewClient, AddNewClient, validateClientUpdatedDetails, sendPutUrlsForNewMedia, updateClientDetails } from "../../Controllers/ClientController.js"

const clientQueryRoute = express.Router();
// check if admin is requesting or not 
clientQueryRoute.use(authenticateAdmin)

/***************************************************/
// see all client that have added on website
clientQueryRoute.get('/admin/api/clients/', getAllClients)
// see specific client detial like videos & photos posted
clientQueryRoute.get('/admin/api/client/:id', getSingleClientDetails)

/***************************************************/
// while adding new client validate their details 
clientQueryRoute.post("/admin/api/add-client/validate-details", checkClientDetails, sendPutUrlsForNewClient)
// after validating new client details & sending puturls user media will upload on s3 & we have to save keys & other meta
clientQueryRoute.post("/admin/api/add-client/save-details", AddNewClient)

/***************************************************/
// for existing client when details are updated like new media added validate it 
clientQueryRoute.put('/admin/api/client/:id/validate-details', validateClientUpdatedDetails, sendPutUrlsForNewMedia)
clientQueryRoute.put('/admin/api/client/:id/save-details', updateClientDetails)



export default clientQueryRoute