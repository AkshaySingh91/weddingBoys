import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'

import { getAllClients, getSingleClientDetails, checkClientDetails, sendPutUrlsForNewClient, AddNewClient, validateClientUpdatedDetails, sendPutUrlsForNewMedia, updateClientDetails } from "../../Controllers/ClientController.js"

const clientQueryRoute = express.Router();
// check if admin is requesting or not 
clientQueryRoute.use(authenticateAdmin)

/***************************************************/
// see all client that have added on website
clientQueryRoute.get('/api/admin/clients/', getAllClients)
// see specific client detial like videos & photos posted
clientQueryRoute.get('/api/admin/client/:id', getSingleClientDetails)

/***************************************************/
// while adding new client validate their details 
clientQueryRoute.post("/api/admin/add-client/validate-details", checkClientDetails, sendPutUrlsForNewClient)
// after validating new client details & sending puturls user media will upload on s3 & we have to save keys & other meta
clientQueryRoute.post("/api/admin/add-client/save-details", AddNewClient)

/***************************************************/
// for existing client when details are updated like new media added validate it 
clientQueryRoute.put('/api/admin/client/:id/validate-details', validateClientUpdatedDetails, sendPutUrlsForNewMedia)
clientQueryRoute.put('/api/admin/client/:id/save-details', updateClientDetails)



export default clientQueryRoute