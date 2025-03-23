import express from 'express'
const Route = express.Router();
import authenticateAdmin from "../../Middleware/authenticateAdmin.js"
import { addNewTagCategory, verifyTagInExistingCategory, addNewTagOnHomePage, addNewTagOnFilmPage } from "../../Controllers/TagsController.js"

Route.use(authenticateAdmin)

Route.post("/api/admin/tags", addNewTagCategory)
Route.put("/api/admin/tags", verifyTagInExistingCategory)
/*************************************************/

Route.post("/api/admin/homepage/tags", addNewTagOnHomePage)
Route.post("/api/admin/filmpage/tags", addNewTagOnFilmPage)

export default Route