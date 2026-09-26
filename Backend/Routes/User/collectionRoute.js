/**
 * Public rows (plan phase 5):
 *   GET /api/collections/:key          one row
 *   GET /api/collections?keys=a,b,c    several rows of one page, in order; a row
 *                                      with `dedupe` skips what earlier rows showed
 * Only Published rows, only public items (Services/collectionResolver.js).
 * Mounted in app.js above clientEnquiryRoute, which guards everything after it.
 */
import express from 'express';
import Collection from '../../Models/Collection.js';
import { resolveCollection, resolveMany } from '../../Services/collectionResolver.js';
import { toCard } from '../../Services/cards.js';

const Route = express.Router();
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const head = (c) => ({ key: c.key, title: c.title, subtitle: c.subtitle || null, kind: c.kind });

Route.get('/api/collections', async (req, res) => {
    try {
        const keys = String(req.query.keys || '').split(',').map((k) => k.trim().toLowerCase()).filter((k) => KEY.test(k)).slice(0, 20);
        if (!keys.length) return res.status(400).json({ message: 'Pass keys=a,b,c' });
        const rows = await resolveMany(keys);
        return res.status(200).json({ rows: rows.map((r) => ({ collection: head(r.collection), items: r.items.map(toCard), hasMore: r.hasMore })) });
    } catch (error) {
        console.error('GET /api/collections error:', error);
        return res.status(500).json({ message: 'Could not load the rows' });
    }
});

Route.get('/api/collections/:key', async (req, res) => {
    try {
        const key = String(req.params.key || '').toLowerCase();
        if (!KEY.test(key)) return res.status(404).json({ message: 'Row not found' });
        const c = await Collection.findOne({ key, status: 'Published' }).lean();
        if (!c) return res.status(404).json({ message: 'Row not found' });
        const { items, hasMore } = await resolveCollection(c);
        return res.status(200).json({ collection: head(c), items: items.map(toCard), hasMore });
    } catch (error) {
        console.error('GET /api/collections/:key error:', error);
        return res.status(500).json({ message: 'Could not load the row' });
    }
});

export default Route;
