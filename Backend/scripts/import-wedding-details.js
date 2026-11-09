/**
 * Import the studio's answers from docs/data/wedding-details-needed.csv.
 *
 * For each row that has something filled in:
 *   - city / state / venue  -> the wedding's location (same helper as admin,
 *                              so city pages and slugs stay consistent)
 *   - start_date / end_date -> the wedding's celebration dates
 *   - crew                  -> credits on every photo/film of that wedding that
 *                              has none ("Name - Role; Name - Role")
 *   - story_intro           -> the story page intro
 * Photos and films without their own location/date show the wedding's on the
 * detail pages (Services/portfolioService.js placeFor / dateFor).
 *
 * Rows marked "TEST DATA" are skipped. Invalid rows are reported, not written.
 *
 *   node scripts/import-wedding-details.js [csv]          # dry run
 *   node scripts/import-wedding-details.js [csv] --apply  # write
 */
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { locationFrom } from '../Services/weddingProfile.js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '../.env') });
const APPLY = process.argv.includes('--apply');
const file = process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(here, '../../docs/data/wedding-details-needed.csv');

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, commas and newlines inside quotes. */
function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
            else if (ch === '"') quoted = false;
            else field += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i += 1;
            row.push(field); rows.push(row); row = []; field = '';
        } else field += ch;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim()));
}

const day = (v) => {
    if (!v.trim()) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return 'bad';
    const d = new Date(`${v.trim()}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? 'bad' : d;
};
const parseCrew = (v) => v.split(';').map((s) => s.trim()).filter(Boolean).map((s) => {
    const [name, ...role] = s.split(/\s+[-–—]\s+/);
    return { name: (name || '').trim(), role: role.join(' - ').trim() };
});

const [header, ...rows] = parseCsv(fs.readFileSync(file, 'utf8'));
const col = (prefix) => header.findIndex((h) => h.toLowerCase().startsWith(prefix));
const C = { id: col('wedding_id'), couple: col('couple'), city: col('city'), state: col('state'), venue: col('venue'),
    start: col('start_date'), end: col('end_date'), crew: col('crew'), intro: col('story_intro'), notes: col('notes') };

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const problems = [];
let weddings = 0, items = 0;

for (const r of rows) {
    const get = (k) => (C[k] >= 0 ? (r[C[k]] || '').trim() : '');
    const couple = get('couple');
    if (/test data/i.test(get('notes'))) continue;
    const city = get('city'), state = get('state'), venue = get('venue'), intro = get('intro');
    const start = day(get('start')), end = day(get('end')), crewText = get('crew');
    if (!city && !state && !venue && !start && !end && !crewText && !intro) continue;

    const errors = [];
    if ((state || venue) && !city) errors.push('city is required when state or venue is given');
    if (start === 'bad' || end === 'bad') errors.push('dates must be YYYY-MM-DD');
    if (start && start !== 'bad' && end && end !== 'bad' && end < start) errors.push('end_date is before start_date');
    const crew = crewText ? parseCrew(crewText) : [];
    if (crew.some((c) => !c.name || !c.role)) errors.push('crew must be "Name - Role; Name - Role"');
    if (!mongoose.isValidObjectId(get('id'))) errors.push('wedding_id is missing or invalid');
    if (errors.length) { problems.push(`${couple}: ${errors.join('; ')}`); continue; }

    const _id = new mongoose.Types.ObjectId(get('id'));
    const $set = {};
    if (city) $set.location = locationFrom({ city, state, venue, country: 'India' });
    if (start && start !== 'bad') {
        $set['celebrationDates.startDate'] = start;
        $set['celebrationDates.endDate'] = end && end !== 'bad' ? end : start;
    }
    if (intro) $set['story.intro'] = intro;
    const changes = Object.keys($set).map((k) => k.split('.')[0]);
    console.log(`  ${couple.padEnd(26)} ${[...new Set(changes)].join(', ')}${crew.length ? `${changes.length ? ', ' : ''}crew (${crew.length})` : ''}`);
    if (APPLY && Object.keys($set).length) await db.collection('clients').updateOne({ _id }, { $set });
    weddings += 1;
    if (crew.length) {
        const filter = { client: _id, $or: [{ credits: { $exists: false } }, { credits: { $size: 0 } }] };
        const n = await db.collection('portfolioitems').countDocuments(filter);
        if (APPLY) await db.collection('portfolioitems').updateMany(filter, { $set: { credits: crew } });
        items += n;
    }
}

if (problems.length) console.log(`\nNOT IMPORTED (${problems.length}):\n  - ${problems.join('\n  - ')}`);
console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} — weddings updated: ${weddings} · photos/films given crew: ${items}`);
await mongoose.disconnect();
