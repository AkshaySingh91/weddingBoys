// Bounded per-process abuse protection. A shared reverse-proxy limit should also
// be configured when more than one API instance is deployed.
export function rateLimit({ limit, windowMs, maxKeys = 10000 }) {
    const buckets = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket?.remoteAddress || 'unknown';
        let bucket = buckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            if (buckets.size >= maxKeys) buckets.delete(buckets.keys().next().value);
            bucket = { count: 0, resetAt: now + windowMs };
            buckets.set(key, bucket);
        }
        if (++bucket.count > limit) {
            res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
            return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
        }
        return next();
    };
}
