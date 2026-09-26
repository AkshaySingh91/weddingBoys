import express from 'express';
import { verifyToken } from '../../Middleware/auth.js';
import {
    listPortfolio, assignToClient, updatePortfolioItem,
    bulkUpdatePortfolio, setHeroSet, removePortfolioItem,
    addExternalFilm, setPoster, removePoster, replaceFile,
} from '../../Controllers/portfolioController.js';

const Route = express.Router();
Route.use('/api/admin/portfolio', verifyToken);

Route.get('/api/admin/portfolio', listPortfolio);
Route.post('/api/admin/portfolio', assignToClient);
// `/bulk`, `/hero` and `/external` must precede `/:id` or Express matches them as an id.
Route.patch('/api/admin/portfolio/bulk', bulkUpdatePortfolio);
Route.post('/api/admin/portfolio/hero', setHeroSet);
Route.post('/api/admin/portfolio/external', addExternalFilm);
Route.patch('/api/admin/portfolio/:id', updatePortfolioItem);
Route.post('/api/admin/portfolio/:id/poster', setPoster);
Route.delete('/api/admin/portfolio/:id/poster', removePoster);
Route.post('/api/admin/portfolio/:id/replace', replaceFile);
Route.delete('/api/admin/portfolio/:id', removePortfolioItem);

export default Route;
