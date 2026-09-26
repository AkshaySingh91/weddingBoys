/**
 * Moves the four packages hardcoded in the home "Our packages" section into
 * Admin › Pricing (plan phase 7), so they can be edited without a deploy.
 *
 *   node scripts/seedPricingPackages.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 * Only when no package exists yet: until then the section keeps its built-in
 * list, and from the first package on it shows Admin › Pricing alone. Same
 * titles, prices, crews, deliverables and "popular" flags as the site today
 * (Next-Frontend/app/(site)/_home/OfferPackages.jsx).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';

dotenv.config();
const { mode, runId } = parseMode();
await mongoose.connect(process.env.MONGO_URI);
console.log(`database "${mongoose.connection.db.databaseName}" · mode ${mode}`);
const PricingPackage = (await import('../Models/PricingPackage.js')).default;
const SCRIPT = 'seedPricingPackages';

const yes = (text) => ({ text, included: true });
const no = (text) => ({ text, included: false });
const WEDDING_CORE = ['Luxury Cinematic Teaser', 'Luxury Cinematic Video', 'Instagram Reels (2-3)', '35+ Retouched Photos'];
const FULL_CREW = ['2 Traditional Videographers', '2 Traditional Photographers', '2 Cinematographers', '2 Candid Photographers', '1 Drone Pilot'];
const PREMIUM = [...WEDDING_CORE, 'Full Wedding Film in 4k', '300 PhotoBook Album', 'Complimentary Mini Book & Table Calendar', 'Complimentary Couple Frame', 'All Raw Data on Pendrive'].map(yes);

export const PACKAGES = [
    {
        name: 'Enchanted Pre-Wedding',
        tagline: 'Perfect for couples wanting storybook memories',
        originalPrice: 50000,
        discountedPrice: 40000,
        team: ['1 Cinematographer', '1 Candid Photographer', '1 Drone Pilot'],
        includes: [
            ...['Story Based Cinematic Teaser', '4-5 Min Cinematic Video', 'Instagram Reels (2-3)', '35+ Retouched Photos', 'Full RAW Data', '10 Save the Dates', 'Complimentary Photo Book'].map(yes),
            no('360° Virtual Tour'), no('Drone Cinematography'),
        ],
        description: 'Ideal for intimate pre-wedding shoots and save-the-date creation. Capture those delicate moments that tell your unique love story.',
        isFeatured: true,
        recommendedFor: 'Intimate pre-wedding shoots & creative save-the-dates',
    },
    {
        name: 'Basic Wedding Package',
        tagline: 'Essential coverage with a touch of elegance',
        originalPrice: 100000,
        discountedPrice: 85000,
        team: ['1 Traditional Videographer', '1 Traditional Photographer', '1 Cinematographer'],
        includes: [
            ...WEDDING_CORE.map(yes),
            no('Full Wedding Film in 4k'), no('300 PhotoBook Album'), no('Complimentary Couple Frame'),
            yes('All Raw Data on Pendrive'),
        ],
        description: 'Great for couples who want essential coverage of their big day without extra frills. A perfect balance of creativity and tradition.',
        isFeatured: false,
        recommendedFor: 'Traditional wedding coverage on a budget',
    },
    {
        name: 'Premium 2-Day Wedding',
        tagline: 'An all-inclusive celebration of love',
        originalPrice: 150000,
        discountedPrice: 130000,
        team: FULL_CREW,
        includes: PREMIUM,
        description: 'Perfect for a lavish 2-day wedding celebration where every detail matters. Relish every moment with comprehensive coverage.',
        isFeatured: false,
        recommendedFor: 'Large, elaborate weddings',
    },
    {
        name: 'Ultimate Wedding & Pre-Wedding Combo',
        tagline: 'For couples who want it all',
        originalPrice: 240000,
        discountedPrice: 210000,
        team: FULL_CREW,
        includes: [
            ...PREMIUM,
            ...['Story Based Cinematic Teaser (Pre-Wedding)', '4-5 Min Cinematic Video (Pre-Wedding)', 'Instagram Reels (Pre-Wedding)', '10 Save the Dates (Pre-Wedding)'].map(yes),
        ],
        description: 'The ultimate combo for couples who desire comprehensive coverage for both pre-wedding and wedding events. Experience luxury in every frame.',
        isFeatured: true,
        recommendedFor: 'Couples who want complete, end-to-end coverage',
    },
].map((p, order) => ({ category: 'wedding', ctaLabel: 'Enquire Now', isActive: true, order, ...p }));

const done = async (code = 0) => { await mongoose.disconnect(); process.exit(code); };

if (mode === 'rollback') {
    let run;
    try { run = await loadRun(SCRIPT, runId); } catch (e) { console.error(e.message); await done(1); }
    const ids = run.changes.filter((c) => c.op === 'create').map((c) => c.docId);
    const { deletedCount } = await PricingPackage.deleteMany({ _id: { $in: ids } });
    console.log(`rolled back ${runId}: ${deletedCount} package(s) removed`);
    await markRolledBack(runId, { removed: deletedCount });
    await done();
}

const existing = await PricingPackage.find().sort({ order: 1 }).lean();

if (mode === 'verify') {
    const problems = [];
    for (const want of PACKAGES) {
        const got = existing.find((p) => p.name === want.name);
        if (!got) { problems.push(`missing "${want.name}"`); continue; }
        if (got.originalPrice !== want.originalPrice || got.discountedPrice !== want.discountedPrice) problems.push(`"${want.name}": price ${got.discountedPrice}/${got.originalPrice}, the site showed ${want.discountedPrice}/${want.originalPrice}`);
        if ((got.includes || []).length !== want.includes.length) problems.push(`"${want.name}": ${(got.includes || []).length} deliverables, the site showed ${want.includes.length}`);
    }
    console.log(`  ${existing.length} package(s): ${existing.map((p) => `${p.name}${p.isActive ? '' : ' (hidden)'}`).join(', ')}`);
    problems.forEach((p) => console.log('  ! ' + p));
    console.log(problems.length ? `${problems.length} difference(s) from the built-in list (fine if edited on purpose)` : '✔ the four built-in packages are in Admin › Pricing');
    await done();
}

if (existing.length) {
    console.log(`  ${existing.length} package(s) already exist; nothing to seed. The site shows Admin › Pricing.`);
    await done();
}
PACKAGES.forEach((p) => console.log(`  create "${p.name}" ₹${p.discountedPrice} (was ₹${p.originalPrice}) · ${p.team.length} crew · ${p.includes.length} deliverables${p.isFeatured ? ' · popular' : ''}`));
if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await done();
}
const run = await startRun(SCRIPT);
try {
    for (const p of PACKAGES) {
        const doc = await PricingPackage.create(p);
        await run.record({ op: 'create', docId: doc._id });
    }
    await run.finish({ created: PACKAGES.length });
} catch (error) {
    await run.fail(error);
    throw error;
}
console.log('Next: node scripts/seedPricingPackages.js --verify');
await done();
