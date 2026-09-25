import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PortfolioItem from '../Models/PortfolioItem.js';
import Media from '../Models/Media.js';
import { renderFromMedia } from '../Services/portfolioSync.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const mediaList = await Media.find({ status: 'Ready' });
    console.log(`Found ${mediaList.length} Ready media items.`);

    let updatedCount = 0;
    for (const media of mediaList) {
        const render = renderFromMedia(media);
        const res = await PortfolioItem.updateMany(
            { media: media._id },
            { $set: { render } }
        );
        if (res.modifiedCount > 0) {
            updatedCount += res.modifiedCount;
        }
    }

    console.log(`Updated render for ${updatedCount} PortfolioItem documents.`);
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
