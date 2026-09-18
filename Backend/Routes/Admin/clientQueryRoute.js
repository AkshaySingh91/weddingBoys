import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'

import { getAllClients, getSingleClientDetails, checkClientDetails, sendPutUrlsForNewClient, AddNewClient, validateClientUpdatedDetails, sendPutUrlsForNewMedia, updateClientDetails } from "../../Controllers/ClientController.js"
import { createClient, updateClientProfile, getClientStats, deleteClient } from "../../Controllers/clientProfileController.js"

const clientQueryRoute = express.Router();
// check if admin is requesting or not 
clientQueryRoute.use(authenticateAdmin)

/***************************************************/
// see all client that have added on website
clientQueryRoute.get('/api/admin/clients/', getAllClients)

/***************************************************/
// Client identity, independent of its media. The wizard creates the entity
// first so uploads can be scoped to a real client id from the first byte.
clientQueryRoute.post('/api/admin/clients', createClient)
// `/stats` before `/:id` so Express does not match it as an id.
clientQueryRoute.get('/api/admin/clients/:id/stats', getClientStats)
clientQueryRoute.patch('/api/admin/clients/:id', updateClientProfile)
clientQueryRoute.delete('/api/admin/clients/:id', deleteClient)

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