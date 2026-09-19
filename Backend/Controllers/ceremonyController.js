import Ceremony from '../Models/CeremonySchema.js';

const DEFAULT_CEREMONIES = [
    { name: 'Haldi', slug: 'haldi', order: 1, color: 'amber', description: 'Turmeric ritual & blessings' },
    { name: 'Mehendi', slug: 'mehendi', order: 2, color: 'emerald', description: 'Henna celebration & festivities' },
    { name: 'Sangeet', slug: 'sangeet', order: 3, color: 'purple', description: 'Musical evening & dance performances' },
    { name: 'Cocktail', slug: 'cocktail', order: 4, color: 'indigo', description: 'Evening cocktail party & celebrations' },
    { name: 'Wedding / Pheras', slug: 'wedding-pheras', order: 5, color: 'rose', description: 'Main wedding vows & rituals' },
    { name: 'Reception', slug: 'reception', order: 6, color: 'gold', description: 'Post-wedding grand reception' },
    { name: 'Pre-Wedding', slug: 'pre-wedding', order: 7, color: 'sky', description: 'Pre-wedding couple shoot & romance' },
    { name: 'Candid & Portraits', slug: 'candid-portraits', order: 8, color: 'neutral', description: 'Couple portraits & candid moments' },
];

/**
 * Ensures standard Indian wedding ceremonies are seeded if the collection is empty.
 */
async function ensureDefaultCeremonies() {
    try {
        const count = await Ceremony.countDocuments();
        if (count === 0) {
            await Ceremony.insertMany(DEFAULT_CEREMONIES);
            console.log('✨ Seeded default Indian wedding ceremonies');
        }
    } catch (e) {
        console.error('Ceremony seeding error:', e.message);
    }
}

// GET /api/ceremonies or /api/admin/ceremonies
export async function listCeremonies(req, res) {
    try {
        await ensureDefaultCeremonies();
        const isAdmin = req.path.includes('/admin');
        const filter = isAdmin ? {} : { isActive: true };
        const ceremonies = await Ceremony.find(filter).sort({ order: 1, createdAt: 1 }).lean();
        return res.status(200).json({ ceremonies });
    } catch (error) {
        console.error('listCeremonies error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// POST /api/admin/ceremonies
export async function createCeremony(req, res) {
    try {
        const { name, color, description, order } = req.body || {};
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Ceremony name is required' });
        }

        const trimmedName = name.trim();
        const slug = trimmedName
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const existing = await Ceremony.findOne({
            $or: [{ name: trimmedName }, { slug }],
        });
        if (existing) {
            return res.status(409).json({ message: `Ceremony "${trimmedName}" already exists` });
        }

        const highestOrder = order !== undefined
            ? Number(order)
            : (await Ceremony.findOne().sort({ order: -1 }).select('order').lean())?.order || 0;

        const ceremony = await Ceremony.create({
            name: trimmedName,
            slug,
            order: order !== undefined ? Number(order) : highestOrder + 1,
            color: color || 'amber',
            description: description?.trim() || '',
            isActive: true,
        });

        return res.status(201).json({ ceremony, message: `Ceremony "${ceremony.name}" created` });
    } catch (error) {
        console.error('createCeremony error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// PATCH /api/admin/ceremonies/:id
export async function updateCeremony(req, res) {
    try {
        const { id } = req.params;
        const { name, color, description, order, isActive } = req.body || {};

        const ceremony = await Ceremony.findById(id);
        if (!ceremony) {
            return res.status(404).json({ message: 'Ceremony not found' });
        }

        if (name && name.trim() && name.trim() !== ceremony.name) {
            const trimmedName = name.trim();
            const slug = trimmedName
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const duplicate = await Ceremony.findOne({
                _id: { $ne: id },
                $or: [{ name: trimmedName }, { slug }],
            });
            if (duplicate) {
                return res.status(409).json({ message: `Ceremony "${trimmedName}" already exists` });
            }

            ceremony.name = trimmedName;
            ceremony.slug = slug;
        }

        if (color !== undefined) ceremony.color = color;
        if (description !== undefined) ceremony.description = description.trim();
        if (order !== undefined) ceremony.order = Number(order);
        if (isActive !== undefined) ceremony.isActive = Boolean(isActive);

        await ceremony.save();
        return res.status(200).json({ ceremony, message: `Ceremony "${ceremony.name}" updated` });
    } catch (error) {
        console.error('updateCeremony error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// DELETE /api/admin/ceremonies/:id
export async function deleteCeremony(req, res) {
    try {
        const { id } = req.params;
        const ceremony = await Ceremony.findById(id);
        if (!ceremony) {
            return res.status(404).json({ message: 'Ceremony not found' });
        }

        await Ceremony.deleteOne({ _id: id });
        return res.status(200).json({ message: `Ceremony "${ceremony.name}" removed` });
    } catch (error) {
        console.error('deleteCeremony error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// POST /api/admin/ceremonies/reorder
export async function reorderCeremonies(req, res) {
    try {
        const { orderedIds = [] } = req.body || {};
        if (!Array.isArray(orderedIds) || !orderedIds.length) {
            return res.status(400).json({ message: 'orderedIds array required' });
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { order: index + 1 } },
            },
        }));

        await Ceremony.bulkWrite(bulkOps);
        const updated = await Ceremony.find().sort({ order: 1 }).lean();
        return res.status(200).json({ ceremonies: updated, message: 'Ceremonies reordered' });
    } catch (error) {
        console.error('reorderCeremonies error:', error);
        return res.status(500).json({ message: error.message });
    }
}
