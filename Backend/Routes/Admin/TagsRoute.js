import express from 'express'
const Route = express.Router();
import authenticateAdmin from "../../Middleware/authenticateAdmin.js"
import { addNewTagCategory, addTermToCategory, addNewTagOnHomePage, addNewTagOnFilmPage, addNewTagOnPhotoPage } from "../../Controllers/TagsController.js"

Route.use(authenticateAdmin)

Route.post("/api/admin/tags", addNewTagCategory)
Route.post("/api/admin/tags/:tagType/terms", addTermToCategory)
// Retired: the bulk "replace every tag" save. It deleted the whole vocabulary and
// recreated it, orphaning strings already stored on portfolio items, losing
// renames, and half-completing on a duplicate. Rename / merge / delete return
// safely with the unified tag system (plan phase 3). Logged so we see any caller.
Route.put("/api/admin/tags", (req, res) => {
    console.warn(`[410] retired bulk tag save: ${req.method} ${req.originalUrl}`);
    return res.status(410).json({
        message: 'Bulk tag editing has been retired. Add terms one at a time; rename, merge and delete are coming with the new tag manager.',
        retired: true,
    });
})
/*************************************************/

Route.post("/api/admin/homepage/tags", addNewTagOnHomePage)
Route.post("/api/admin/filmpage/tags", addNewTagOnFilmPage)
Route.post("/api/admin/photopage/tags", addNewTagOnPhotoPage)

export default Route