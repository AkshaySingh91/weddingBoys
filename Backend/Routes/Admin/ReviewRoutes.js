import express from "express"
import authenticateAdmin from "../../Middleware/authenticateAdmin.js";
import { putObjectUrl, deleteObject } from "../../Controllers/awsController.js"
import ClientReview from "../../Models/ReviewSchema.js"
import * as uuid from "uuid"
import mongoose from "mongoose";
import { queueRevalidate } from "../../Services/revalidate.js";

const Route = express.Router();
Route.use(authenticateAdmin)

// Reviews feed the home "Love notes" section and, when linked to a wedding, its
// story page (plan phase 7): refresh both after any successful change.
// Scoped: this router sees every admin request.
Route.use(['/api/admin/review', '/api/admin/reviews'], (req, res, next) => {
    if (req.method !== 'GET') res.on('finish', () => { if (res.statusCode < 300) queueRevalidate({ tags: ['page:home', 'portfolio'] }) });
    next();
})

// The admin form offers all four; the schema accepted only the first two, so a
// "Couple" or "Family" review failed to save.
const ROLES = ClientReview.schema.path('person.gender').enumValues;

// The wedding a review belongs to: an id, or null to unlink. Anything else is ignored.
const clientRef = (v) => (v === null || v === '' ? null : mongoose.isValidObjectId(v) ? v : undefined);

// while adding new Review this will validate new reviews & send put url to upload reviewing client one photo 
async function validateReviewAndSendPutUrl(req, res, next) {
    try {
        if (!(req.body.newReview && req.body.newReview.reviewText && req.body.newReview.photo && req.body.newReview.person && req.body.newReview.person.name && req.body.newReview.person.gender && req.body.newReview.photo.type && req.body.newReview.photo.size && req.body.newReview.photo.name && req.body.newReview.person.gender.trim() && req.body.newReview.person.name.trim() && req.body.newReview.reviewText.trim())) {
            return res.status(400).json({ message: "Review details required" })
        }
        const types = ['image/jpeg', 'image/png', 'image/jpg']
        if (!types.includes(req.body.newReview.photo.type)) {
            return res.status(400).json({ message: "photo should 'image/jpeg', 'image/png', 'image/jpg" })
        }
        const { photo } = req.body.newReview;
        const key = `user/photos/${uuid.v4()}.${photo.type.split('/')[1]}`
        const url = await putObjectUrl(key, photo.type);
        res.status(200).json({ urls: { url, key } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// this will save new Review details 
async function saveNewClientReview(req, res, next) {
    try {
        if (!(req.body.newReview && req.body.key && req.body.newReview.reviewText && req.body.newReview.person && req.body.newReview.person.name && req.body.newReview.person.gender && ROLES.includes(req.body.newReview.person.gender) && req.body.newReview.person.name.trim() && req.body.newReview.reviewText.trim())) {
            return res.status(400).json({ message: "Review details required" })
        }
        const { key, newReview } = req.body;
        await ClientReview.create({
            reviewText: newReview.reviewText,
            photo: { key },
            person: {
                gender: newReview.person.gender,
                name: newReview.person.name
            },
            client: clientRef(newReview.client) ?? null,
        })
        res.status(200).json({ message: 'New Review added.' })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// validate updated review & if text updated send put url 
async function validateUpdatedReviewAndSendPutUrl(req, res, next) {
    try { 
        if (!(req.body.editingReview && req.body.editingReview.reviewText && req.body.editingReview.reviewText.trim() && req.body.editingReview.person && req.body.editingReview.person.name && req.body.editingReview.person.name.trim() && ROLES.includes(req.body.editingReview.person.gender))) {
            return res.status(400).json({ message: "Review details required" })
        } else if (!req.body.editingReview._id) {
            return res.status(400).json({ message: "Review ID required." })
        }
        const { editingReview } = req.body;
        // if new photo will added then this parameter will present else only key present  
        if (editingReview.photo && (editingReview.photo.size && editingReview.photo.type && editingReview.photo.name)) {
            const types = ['image/jpeg', 'image/png', 'image/jpg']
            if (types.includes(editingReview.photo.type)) {
                const key = `user/photos/${uuid.v4()}.${editingReview.photo.type.split('/')[1]}`
                const putUrl = await putObjectUrl(key, editingReview.photo.type);
                return res.status(200).json({ urls: { putUrl, key } });
            } else {
                return res.status(400).json({ message: "photo should 'image/jpeg', 'image/png', 'image/jpg" })
            }
        } else if (editingReview.photo.key) {
            // if not addded  
            saveUpdatedReview(req, res, next)
        }


    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}
// this will save updated review details 
async function saveUpdatedReview(req, res, next) {
    try {
        if (!(req.body.editingReview && req.body.editingReview.reviewText && req.body.editingReview.reviewText.trim() && req.body.editingReview.person && req.body.editingReview.person.name && req.body.editingReview.person.name.trim() && ROLES.includes(req.body.editingReview.person.gender))) {
            return res.status(400).json({ message: "Review details required" })
        } else if (!req.body.editingReview._id) {
            return res.status(400).json({ message: "Review ID required." })
        } else if (!(req.body.editingReview.photo && req.body.editingReview.photo.key)) {
            return res.status(400).json({ message: "Review key required." })
        }
        const { editingReview } = req.body;
        const { _id } = editingReview;

        // find review by id
        const review = await ClientReview.findById(_id);
        if (review) {
            if (req.body.isNewFile && review.photo && review.photo.key) {
                // new file delte old from s3
                await deleteObject(review.photo.key);
            }
            const client = clientRef(editingReview.client);
            await ClientReview.findByIdAndUpdate(_id, {
                reviewText: editingReview.reviewText,
                person: {
                    name: editingReview.person.name, gender: editingReview.person.gender
                },
                // Same photo: keep its Media link (writing only the key dropped it).
                photo: req.body.isNewFile ? { key: editingReview.photo.key } : { ...review.toObject().photo, key: editingReview.photo.key },
                ...(client !== undefined && { client }),
            })
            return res.status(200).json({ message: "Client review has updated" });
        } else {
            return res.status(400).json({ message: "Review Not found." })
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}
// delete review inc photo
async function deleteReview(req, res, next) {
    try {
        if (!req.body.reviewDetials) {
            return res.status(400).json({ message: "REview to be delete not found" });
        }
        const { reviewDetials } = req.body;
        const review = await ClientReview.find({ 'photo.key': reviewDetials.photo.key })
        if (review.length > 1) {
            return res.status(500).json({ message: 'More that 1 review found to delete.' })
        }
        const key = review[0].photo.key;
        await deleteObject(key);
        await ClientReview.findOneAndDelete({ 'photo.key': key });
        res.status(200).json({ message: 'Review deleted.' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

Route.post("/api/admin/review/get-put-url", validateReviewAndSendPutUrl)
Route.post("/api/admin/review/save-details", saveNewClientReview)

Route.put("/api/admin/review/get-put-url", validateUpdatedReviewAndSendPutUrl)
Route.put("/api/admin/review/save-details", saveUpdatedReview)

Route.delete("/api/admin/reviews", deleteReview)

export default Route;
 