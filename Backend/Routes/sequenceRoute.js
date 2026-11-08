import express from 'express';
import { nanoid } from 'nanoid';
import { verifyToken } from '../Middleware/auth.js';
import Media from '../Models/Media.js';
import Sequence from '../Models/Sequence.js';
import SequencePage from '../Models/SequencePage.js';
import { enqueueJob } from '../Services/mediaJobQueue.js';
import { queueRevalidate } from '../Services/revalidate.js';
import { cdnUrl } from '../Services/r2UploadService.js';

const route = express.Router();
const validSlot = (slot) => ['hero', 'director'].includes(slot);

function payload(sequence) {
    if (!sequence || sequence.status !== 'Ready') return null;
    return {
        id: String(sequence._id), releaseId: sequence.releaseId,
        frameCount: sequence.frameCount, width: sequence.width, height: sequence.height,
        posterUrl: sequence.posterUrl, blurDataURL: sequence.blurDataURL,
        focalX: sequence.focalX ?? 0.5, focalY: sequence.focalY ?? 0.5,
        tiers: (sequence.tiers || []).filter((tier) => tier.keyPattern).map((tier) => ({
            label: tier.label, everyNth: tier.everyNth, width: tier.width, height: tier.height,
            bytes: tier.bytes, keyPattern: cdnUrl(tier.keyPattern), padTo: sequence.padTo,
        })),
    };
}

route.get('/api/sequences/varanasi', async (_req, res) => {
    try {
        const page = await SequencePage.findOne({ pageKey: 'varanasi' }).populate('slots.hero slots.director');
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return res.json({ hero: payload(page?.slots?.hero), director: payload(page?.slots?.director) });
    } catch (error) {
        return res.status(503).json({ message: 'Sequence configuration unavailable' });
    }
});

route.use('/api/admin/sequences', verifyToken);

route.get('/api/admin/sequences', async (_req, res) => {
    try {
        const [sequences, page] = await Promise.all([
            Sequence.find({ pageKey: 'varanasi' }).sort({ createdAt: -1 }).limit(50).lean(),
            SequencePage.findOne({ pageKey: 'varanasi' }).lean(),
        ]);
        return res.json({ sequences: sequences.map((sequence) => ({ ...sequence, preview: payload(sequence) })), published: {
            hero: page?.slots?.hero ? String(page.slots.hero) : null,
            director: page?.slots?.director ? String(page.slots.director) : null,
        } });
    } catch {
        return res.status(503).json({ message: 'Sequences unavailable' });
    }
});

route.post('/api/admin/sequences', async (req, res) => {
    try {
        const { slot, sourceMediaId } = req.body || {};
        const startSec = Number(req.body?.startSec ?? 0);
        const durationSec = req.body?.durationSec === undefined || req.body?.durationSec === '' ? undefined : Number(req.body.durationSec);
        const frameCount = Number(req.body?.frameCount ?? 150);
        const focalX = Number(req.body?.focalX ?? 0.5);
        const focalY = Number(req.body?.focalY ?? 0.5);
        if (!validSlot(slot) || typeof sourceMediaId !== 'string' || !sourceMediaId) return res.status(400).json({ message: 'Valid slot and sourceMediaId required' });
        if (!Number.isFinite(startSec) || startSec < 0 || (durationSec !== undefined && (!Number.isFinite(durationSec) || durationSec < 1 || durationSec > 15)) || !Number.isInteger(frameCount) || frameCount < 24 || frameCount > 240 || !Number.isFinite(focalX) || focalX < 0 || focalX > 1 || !Number.isFinite(focalY) || focalY < 0 || focalY > 1) {
            return res.status(400).json({ message: 'Invalid trim or frame count' });
        }
        const media = await Media.findOne({ mediaId: sourceMediaId, ownerType: 'Website', mediaType: 'Video' }).lean();
        if (!media || !['Processing', 'Ready'].includes(media.status)) return res.status(404).json({ message: 'Website source video not found or not uploaded' });
        const releaseId = nanoid(12);
        const sequence = await Sequence.create({
            name: `Varanasi ${slot}`, slug: `varanasi-${slot}-${releaseId}`,
            pageKey: 'varanasi', slot, releaseId, sourceMediaId, frameCount, focalX, focalY,
            ownerType: 'Website', status: 'Draft',
        });
        await enqueueJob({ mediaId: sourceMediaId, type: 'sequence',
            options: { sequenceId: String(sequence._id), startSec, durationSec, frameCount },
            idempotencyKey: `sequence:${releaseId}` });
        return res.status(202).json({ sequence });
    } catch (error) {
        return res.status(500).json({ message: 'Could not create sequence', detail: error.message });
    }
});

// Repointing to an older Ready release is also the rollback operation.
route.post('/api/admin/sequences/:id/publish', async (req, res) => {
    try {
        const sequence = await Sequence.findById(req.params.id);
        if (!sequence || sequence.pageKey !== 'varanasi' || !validSlot(sequence.slot)) return res.status(404).json({ message: 'Sequence not found' });
        if (sequence.status !== 'Ready' || !sequence.manifestKey) return res.status(409).json({ message: 'Sequence is not ready' });
        const page = await SequencePage.findOneAndUpdate({ pageKey: 'varanasi' }, {
            $set: { [`slots.${sequence.slot}`]: sequence._id, updatedBy: req.user?.email || 'admin' },
            $setOnInsert: { pageKey: 'varanasi' },
        }, { upsert: true, new: true });
        sequence.publishedAt = new Date();
        await sequence.save();
        queueRevalidate({ tags: ['page:varanasi'], paths: ['/varanasi'] });
        return res.json({ published: { hero: page.slots.hero, director: page.slots.director } });
    } catch (error) {
        return res.status(error.name === 'CastError' ? 400 : 500).json({ message: 'Could not publish sequence' });
    }
});

export default route;
