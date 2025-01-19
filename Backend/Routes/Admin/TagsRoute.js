import express from 'express'
const Route = express.Router();
import authenticateAdmin from "../../Middleware/authenticateAdmin.js"
import { addNewTagCategory, verifyTagInExistingCategory, addNewTagOnHomePage, addNewTagOnFilmPage } from "../../Controllers/TagsController.js"

Route.use(authenticateAdmin)

Route.post("/admin/api/tags", addNewTagCategory)
Route.put("/admin/api/tags", verifyTagInExistingCategory)
/*************************************************/

Route.post("/admin/api/homepage/tags", addNewTagOnHomePage)
Route.post("/admin/api/filmpage/tags", addNewTagOnFilmPage)

export default Route