import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'

import { getAllClients, getSingleClientDetails } from "../../Controllers/ClientController.js"
import { createClient, getClientProfile, updateClientProfile, getClientStats, deleteClient } from "../../Controllers/clientProfileController.js"

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
clientQueryRoute.get('/api/admin/clients/:id', getClientProfile)
clientQueryRoute.patch('/api/admin/clients/:id', updateClientProfile)
clientQueryRoute.delete('/api/admin/clients/:id', deleteClient)

// see specific client detial like videos & photos posted
clientQueryRoute.get('/api/admin/client/:id', getSingleClientDetails)

/***************************************************/
// Retired: the pre-wizard client editor.
//
// These saved into the embedded Client.videos[] / photos[] and then ran
// syncClientPortfolio, which overwrites tags, hero flags and priorities from
// those arrays, forces every item to Published, and DELETES every portfolio
// item that is not in them — i.e. every photo and film uploaded through the
// current Add Wedding wizard. No frontend calls them any more. They answer 410
// rather than 404 so a forgotten tool fails loudly and says why, and each hit is
// logged so we find out if something still depends on them.
const gone = (req, res) => {
    console.warn(`[410] retired legacy client route: ${req.method} ${req.originalUrl}`);
    return res.status(410).json({
        message: 'This client editor has been retired. Use Add Wedding (/admin/clients/new) or the wedding workspace.',
        retired: true,
    });
};
clientQueryRoute.post("/api/admin/add-client/validate-details", gone)
clientQueryRoute.post("/api/admin/add-client/save-details", gone)
clientQueryRoute.put('/api/admin/client/:id/validate-details', gone)
clientQueryRoute.put('/api/admin/client/:id/save-details', gone)



export default clientQueryRoute