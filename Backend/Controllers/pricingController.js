import { z } from 'zod';
import PricingPackage from '../Models/PricingPackage.js';

const badge = z.object({ label: z.string(), tone: z.enum(['popular', 'discount', 'new', 'custom']).optional() });
const metric = z.object({ label: z.string(), value: z.string(), icon: z.string().optional() });
const featureCategory = z.object({ title: z.string(), icon: z.string().optional(), items: z.array(z.string()) });

const packageSchema = z.object({
    name: z.string().min(1),
    category: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    currency: z.string().optional(),
    originalPrice: z.number().nonnegative(),
    discountedPrice: z.number().nonnegative().nullable().optional(),
    priceSuffix: z.string().optional(),
    badges: z.array(badge).optional(),
    metrics: z.array(metric).optional(),
    featureCategories: z.array(featureCategory).optional(),
    ctaLabel: z.string().optional(),
    ctaLink: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    order: z.number().optional(),
}).passthrough();

const zodFail = (res, error) => res.status(400).json({
    message: error.issues[0]?.message || 'Invalid package',
    errors: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
});

// GET /api/pricing?category=  — public, active tiers only, ordered.
export async function getActivePackages(req, res) {
    try {
        const query = { isActive: true };
        if (req.query.category) query.category = req.query.category;
        const packages = await PricingPackage.find(query).sort({ order: 1, createdAt: 1 });
        res.status(200).json({ packages });
    } catch (error) {
        console.error('getActivePackages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// GET /api/admin/pricing  — all tiers (any status).
export async function listPackages(_req, res) {
    try {
        const packages = await PricingPackage.find().sort({ order: 1, createdAt: 1 });
        res.status(200).json({ packages });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

// POST /api/admin/pricing
export async function createPackage(req, res) {
    const parsed = packageSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    try {
        const count = await PricingPackage.countDocuments();
        const pkg = await PricingPackage.create({ order: count, ...parsed.data });
        res.status(201).json({ package: pkg });
    } catch (error) {
        console.error('createPackage error:', error);
        res.status(400).json({ message: error.message });
    }
}

// PUT /api/admin/pricing/:id
export async function updatePackage(req, res) {
    const parsed = packageSchema.partial().safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    try {
        const pkg = await PricingPackage.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
        if (!pkg) return res.status(404).json({ message: 'Package not found' });
        res.status(200).json({ package: pkg });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// DELETE /api/admin/pricing/:id
export async function deletePackage(req, res) {
    try {
        await PricingPackage.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Package deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/admin/pricing/reorder  — body: { order: [id, id, ...] }
export async function reorderPackages(req, res) {
    try {
        const ids = Array.isArray(req.body.order) ? req.body.order : [];
        await Promise.all(ids.map((id, index) => PricingPackage.updateOne({ _id: id }, { order: index })));
        const packages = await PricingPackage.find().sort({ order: 1 });
        res.status(200).json({ packages });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}
