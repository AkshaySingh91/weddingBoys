/**
 * Publish draft weddings that are ready, through the same service the admin
 * uses (setClientStatus), so every photo/film's clientStatus follows.
 *
 * A draft is published only when:
 *   - it has a location (city)
 *   - at least one photo or film has finished processing (mediaReady)
 *     — those processed items are published with it (imported items start as
 *     Draft); items still processing stay Draft
 *   - it is not test data (a "Demo Partner" name)
 *   - none of its items is credited to another studio
 * Everything else is listed with the reason it was held back.
 *
 *   node scripts/publish-ready-weddings.js           # dry run: readiness report
 *   node scripts/publish-ready-weddings.js --apply   # publish the ready ones
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const APPLY = process.argv.includes('--apply');
const { setClientStatus } = await import('../Services/portfolioVisibility.js');
const { default: Client } = await import('../Models/ClientSchema.js');
const { default: PortfolioItem } = await import('../Models/PortfolioItem.js');

await mongoose.connect(process.env.MONGO_URI);
const drafts = await Client.find({ status: 'Draft' }).lean();
const name = (c) => `${c.clientName?.Bride || '?'} & ${c.clientName?.Groom || '?'}`;
const external = (credits = []) => credits.some((x) => /source studio|courtesy/i.test(`${x.name} ${x.role}`));

const ready = [];
const held = [];
for (const c of drafts) {
    const items = await PortfolioItem.find({ client: c._id }).select('kind mediaReady status credits eventGroup').lean();
    const shown = items.filter((i) => i.mediaReady);
    const reasons = [];
    if (/demo partner/i.test(name(c))) reasons.push('test data');
    if (!c.location?.city) reasons.push('no city');
    if (!shown.length) reasons.push('no processed photo/film');
    if (items.some((i) => external(i.credits))) reasons.push('credited to another studio');
    const info = {
        c,
        city: c.location?.city || '-',
        photos: shown.filter((i) => i.kind === 'Photo').length,
        films: shown.filter((i) => i.kind !== 'Photo').length,
        dated: Boolean(c.celebrationDates?.startDate || c.weddingDate),
        crew: items.filter((i) => (i.credits || []).length).length,
        ceremony: items.filter((i) => i.eventGroup).length,
        total: items.length,
    };
    (reasons.length ? held : ready).push({ ...info, reasons });
}

const row = (r) => `  ${name(r.c).padEnd(26)} ${r.city.padEnd(10)} ${String(r.photos).padStart(2)} photos ${String(r.films).padStart(2)} films · dates ${r.dated ? 'yes' : 'no '} · crew ${r.crew}/${r.total} · ceremony ${r.ceremony}/${r.total}`;
console.log(`READY (${ready.length}):`);
ready.forEach((r) => console.log(row(r)));
console.log(`\nHELD BACK (${held.length}):`);
held.forEach((r) => console.log(`${row(r)}  <- ${r.reasons.join(', ')}`));

if (APPLY) {
    let publicItems = 0;
    for (const r of ready) {
        await PortfolioItem.updateMany({ client: r.c._id, mediaReady: true, status: 'Draft' }, { $set: { status: 'Published' } });
        publicItems += (await setClientStatus(r.c._id, 'Published'))?.publicItems || 0;
    }
    console.log(`\nPUBLISHED ${ready.length} weddings · ${publicItems} photos/films now public`);
    await new Promise((res) => setTimeout(res, 3000)); // let the coalesced revalidate fire
} else console.log('\nDRY RUN — nothing published');
await mongoose.disconnect();
