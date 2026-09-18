import SiteConfig from '../Models/SiteConfig.js';

// GET /api/config  — public globals (header/footer/socials/studio) for the site.
export async function getPublicConfig(_req, res) {
    try {
        const cfg = await SiteConfig.getSingleton();
        const populated = await SiteConfig.findById(cfg._id)
            .populate('studio.logo')
            .populate('seo.ogImage');
        res.status(200).json({ config: populated });
    } catch (error) {
        console.error('getPublicConfig error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/admin/config  — replace/patch the global config (SuperAdmin/Editor).
export async function updateConfig(req, res) {
    try {
        const cfg = await SiteConfig.getSingleton();
        // Deep-merge top-level groups so a partial save doesn't wipe siblings.
        const groups = ['studio', 'socials', 'header', 'footer', 'seo'];
        for (const g of groups) {
            if (req.body[g] !== undefined) cfg[g] = { ...cfg[g]?.toObject?.() ?? cfg[g], ...req.body[g] };
        }
        await cfg.save();
        res.status(200).json({ message: 'Configuration saved', config: cfg });
    } catch (error) {
        console.error('updateConfig error:', error);
        res.status(400).json({ message: error.message });
    }
}
