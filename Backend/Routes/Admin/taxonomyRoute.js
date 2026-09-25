import express from 'express';
import { verifyToken } from '../../Middleware/auth.js';
import {
    getTaxonomy, listOperations, undoOperation,
    createGroup, updateGroup, deleteGroup, reorderGroups,
    createTag, updateTag, moveTag, mergeTag, deleteTag, reorderTags,
} from '../../Controllers/taxonomyController.js';

const Route = express.Router();
// Scoped to its own prefix: an unscoped `use(verifyToken)` would put every
// router mounted after this one behind admin login (see app.js).
Route.use('/api/admin/taxonomy', verifyToken);

Route.get('/api/admin/taxonomy', getTaxonomy);
Route.get('/api/admin/taxonomy/operations', listOperations);
Route.post('/api/admin/taxonomy/operations/:id/undo', undoOperation);

Route.post('/api/admin/taxonomy/groups', createGroup);
Route.post('/api/admin/taxonomy/groups/reorder', reorderGroups);
Route.patch('/api/admin/taxonomy/groups/:id', updateGroup);
Route.delete('/api/admin/taxonomy/groups/:id', deleteGroup);

Route.post('/api/admin/taxonomy/tags', createTag);
Route.post('/api/admin/taxonomy/tags/reorder', reorderTags);
Route.patch('/api/admin/taxonomy/tags/:id', updateTag);
Route.post('/api/admin/taxonomy/tags/:id/move', moveTag);
Route.post('/api/admin/taxonomy/tags/:id/merge', mergeTag);
Route.delete('/api/admin/taxonomy/tags/:id', deleteTag);

export default Route;
