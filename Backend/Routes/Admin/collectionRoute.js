import express from 'express';
import { verifyToken } from '../../Middleware/auth.js';
import {
    listCollections, getCollection, previewDraft, createCollection, updateCollection,
    deleteCollection, itemAction, reorderPins, itemPlacements,
} from '../../Controllers/collectionController.js';

const Route = express.Router();
// Scoped: an unscoped `use(verifyToken)` would guard every router mounted later.
Route.use('/api/admin/collections', verifyToken);
Route.use('/api/admin/portfolio/:id/placements', verifyToken);

Route.get('/api/admin/collections', listCollections);
Route.post('/api/admin/collections', createCollection);
// `/preview` before `/:id`, or Express reads "preview" as an id.
Route.post('/api/admin/collections/preview', previewDraft);
Route.get('/api/admin/collections/:id', getCollection);
Route.patch('/api/admin/collections/:id', updateCollection);
Route.delete('/api/admin/collections/:id', deleteCollection);
Route.post('/api/admin/collections/:id/pins', reorderPins);
Route.post('/api/admin/collections/:id/items/:itemId/:action', itemAction);
Route.get('/api/admin/portfolio/:id/placements', itemPlacements);

export default Route;
