import express from 'express';
import { verifyToken } from '../../Middleware/auth.js';
import {
    listPortfolio, assignToClient, updatePortfolioItem,
    bulkUpdatePortfolio, setHeroSet, removePortfolioItem,
} from '../../Controllers/portfolioController.js';

const Route = express.Router();
Route.use('/api/admin/portfolio', verifyToken);

Route.get('/api/admin/portfolio', listPortfolio);
Route.post('/api/admin/portfolio', assignToClient);
// `/bulk` and `/hero` must precede `/:id` or Express matches them as an id.
Route.patch('/api/admin/portfolio/bulk', bulkUpdatePortfolio);
Route.post('/api/admin/portfolio/hero', setHeroSet);
Route.patch('/api/admin/portfolio/:id', updatePortfolioItem);
Route.delete('/api/admin/portfolio/:id', removePortfolioItem);

export default Route;
