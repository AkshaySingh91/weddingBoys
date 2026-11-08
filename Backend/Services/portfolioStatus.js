import Client from '../Models/ClientSchema.js';
import { isItemId, portfolioReadsEnabled, findById } from './portfolioService.js';

export function itemStatus(kind) {
    return async (req, res) => {
        if (!isItemId(req.params.id)) return res.status(404).json({ status: 'missing' });
        try {
            const item = portfolioReadsEnabled()
                ? await findById(req.params.id)
                : await Client.findOne({ [`${kind === 'Photo' ? 'photos' : 'videos'}._id`]: req.params.id }).select('_id').lean();
            if (!item || (portfolioReadsEnabled() && item.kind !== kind)) return res.status(404).json({ status: 'missing' });
            return res.json({ status: 'found' });
        } catch {
            return res.status(503).json({ message: 'Portfolio status is temporarily unavailable' });
        }
    };
}
