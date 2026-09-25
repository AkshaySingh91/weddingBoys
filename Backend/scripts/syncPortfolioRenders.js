/**
 * Re-sync the render cache on every PortfolioItem from its (Ready) Media.
 *
 *   node scripts/syncPortfolioRenders.js [--dry-run]
 *
 * Uses the poster-safe writer: items with a hand-picked poster keep it. The
 * first version of this script did `$set: { render }` wholesale, which would
 * have replaced the six legacy films' chosen posters with auto-extracted frames.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PortfolioItem from '../Models/PortfolioItem.js';
import Media from '../Models/Media.js';
import { syncRenderForMedia } from '../Services/portfolioRender.js';

dotenv.config();
const DRY = process.argv.includes('--dry-run');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${DRY ? '[dry-run] ' : ''}database "${mongoose.connection.db.databaseName}"`);

    const mediaList = await Media.find({ status: 'Ready' });
    const placed = await PortfolioItem.countDocuments({ media: { $in: mediaList.map((m) => m._id) } });
    console.log(`${mediaList.length} Ready media, ${placed} placement(s).`);
    if (DRY) { await mongoose.disconnect(); return; }

    const total = { full: 0, keptPoster: 0, posterUpdated: 0 };
    for (const media of mediaList) {
        const r = await syncRenderForMedia(media);
        total.full += r.full; total.keptPoster += r.keptPoster; total.posterUpdated += r.posterUpdated;
    }
    console.log(`updated: ${total.full} full render(s), ${total.keptPoster} kept their own poster, ${total.posterUpdated} custom poster URL(s) refreshed.`);
    await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
