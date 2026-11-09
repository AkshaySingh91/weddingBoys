/**
 * Fill wedding and portfolio-item details that can be derived from evidence
 * already in the database. Nothing here is invented:
 *
 *   1. eventGroup  — from the item's own tags, only when exactly one ceremony
 *                    is named (a photo tagged Haldi AND Reception is ambiguous
 *                    and is left alone).
 *   2. celebrationDates — a wedding without dates gets the earliest and latest
 *                    shoot date of its own photos and films.
 *   3. credits     — an item without credits gets the credits already recorded
 *                    on another item of the same wedding (same crew).
 *
 * Location, dates and crew that exist nowhere in the system are NOT filled:
 * those must come from the studio (admin › Weddings, or the details sheet).
 *
 *   node scripts/fill-wedding-details.js           # dry run: prints the plan
 *   node scripts/fill-wedding-details.js --apply   # writes it
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const APPLY = process.argv.includes('--apply');

// Tag (lower-case) -> eventGroup, matching the groups the admin already uses.
const CEREMONY = {
    'pre-wedding': 'Pre-Wedding', prewedding: 'Pre-Wedding',
    engagement: 'Engagement', 'ring ceremony': 'Engagement',
    haldi: 'Haldi', mehendi: 'Mehendi', mehndi: 'Mehendi', sangeet: 'Sangeet',
    tilak: 'Tilak',
    wedding: 'Wedding / Pheras', pheras: 'Wedding / Pheras', varmala: 'Wedding / Pheras', jaimala: 'Wedding / Pheras',
    reception: 'Reception',
};

// Legacy credits were sometimes entered with name and role swapped
// ("Phototgrapher — Nisha"), misspelt, or as test data. Normalise them; never
// spread a credit that names another studio as the source.
const ROLE_WORDS = /^(phot(o|ot)grapher|photographer|video editor|videographer|cinematographer|editor|assistant|drone pilot)$/i;
const ROLE_FIX = { phototgrapher: 'Photographer' };
const titleCase = (s) => String(s).trim().replace(/\b\w/g, (ch) => ch.toUpperCase());
function cleanCredits(list = []) {
    const out = [];
    for (const raw of list) {
        let nameText = String(raw?.name || '').trim();
        let role = String(raw?.role || '').trim();
        if (!nameText || !role || /^test$/i.test(nameText) || /^test$/i.test(role)) continue;
        if (ROLE_WORDS.test(nameText) && !ROLE_WORDS.test(role)) [nameText, role] = [role, nameText];
        role = ROLE_FIX[role.toLowerCase()] || role;
        nameText = /^[a-z]/.test(nameText) ? titleCase(nameText) : nameText;
        role = /^[a-z]/.test(role) ? titleCase(role) : role;
        if (!out.some((c) => c.name.toLowerCase() === nameText.toLowerCase() && c.role.toLowerCase() === role.toLowerCase())) out.push({ name: nameText, role });
    }
    return out;
}
const isExternal = (list = []) => list.some((c) => /source studio|courtesy/i.test(`${c.name} ${c.role}`));
const sameCredits = (a = [], b = []) => JSON.stringify(a.map((c) => [c.name, c.role])) === JSON.stringify(b.map((c) => [c.name, c.role]));
const MAX_SPAN_DAYS = 14;
const flags = [];

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const clients = await db.collection('clients').find({}).toArray();
const items = await db.collection('portfolioitems').find({}).toArray();
const tagNames = new Map((await db.collection('taxonomytags').find({}).toArray()).map((t) => [String(t._id), t.name || t.label || '']));

const itemOps = [];
const clientOps = [];
const log = { eventGroup: 0, eventGroupAmbiguous: 0, eventGroupNoEvidence: 0, dates: 0, credits: 0 };
const name = (c) => `${c.clientName?.Bride || '?'} & ${c.clientName?.Groom || '?'}`;

for (const c of clients) {
    const its = items.filter((i) => String(i.client) === String(c._id));

    // 1. eventGroup from the item's own tags.
    for (const i of its) {
        if (i.eventGroup && i.eventGroup.trim()) continue;
        const words = [...(i.tags || []), ...(i.tagIds || []).map((id) => tagNames.get(String(id)))]
            .filter(Boolean).map((t) => String(t).trim().toLowerCase());
        const groups = [...new Set(words.map((w) => CEREMONY[w]).filter(Boolean))];
        if (groups.length === 1) {
            itemOps.push({ updateOne: { filter: { _id: i._id }, update: { $set: { eventGroup: groups[0] } } } });
            log.eventGroup += 1;
            console.log(`  eventGroup  ${name(c).padEnd(26)} ${String(i._id)} -> ${groups[0]}`);
        } else if (groups.length > 1) log.eventGroupAmbiguous += 1;
        else log.eventGroupNoEvidence += 1;
    }

    // 2. Wedding dates from its own items' shoot dates.
    const hasDates = c.celebrationDates?.startDate || c.weddingDate;
    const dates = its.map((i) => i.shootDate).filter(Boolean).map((d) => new Date(d)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
    const spanDays = dates.length ? (dates[dates.length - 1] - dates[0]) / 86400000 : 0;
    if (!hasDates && dates.length && spanDays > MAX_SPAN_DAYS) {
        flags.push(`${name(c)}: shoot dates span ${Math.round(spanDays)} days (${dates[0].toISOString().slice(0, 10)} → ${dates[dates.length - 1].toISOString().slice(0, 10)}) — not one celebration; set the real dates in admin`);
    } else if (!hasDates && dates.length) {
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        if (startDate.getUTCMonth() === 0 && startDate.getUTCDate() === 1 && spanDays === 0) {
            flags.push(`${name(c)}: only date on record is 1 January ${startDate.getUTCFullYear()} — looks like a placeholder, not set; enter the real date in admin`);
        } else {
            clientOps.push({ updateOne: { filter: { _id: c._id }, update: { $set: { 'celebrationDates.startDate': startDate, 'celebrationDates.endDate': endDate } } } });
            log.dates += 1;
            console.log(`  dates       ${name(c).padEnd(26)} ${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}`);
        }
    }

    // 3a. Clean existing credits in place (swapped name/role, typos, test rows).
    const cleaned = new Map();
    for (const i of its) {
        if (!(i.credits || []).length) continue;
        if (isExternal(i.credits)) {
            flags.push(`${name(c)}: ${i.kind.toLowerCase()} ${String(i._id)} is credited to another studio (${i.credits.map((x) => `${x.name} — ${x.role}`).join('; ')}) — check before publishing`);
            continue;
        }
        const next = cleanCredits(i.credits);
        cleaned.set(String(i._id), next);
        if (!sameCredits(next, i.credits)) {
            itemOps.push({ updateOne: { filter: { _id: i._id }, update: { $set: { credits: next } } } });
            log.cleaned = (log.cleaned || 0) + 1;
            console.log(`  clean       ${name(c).padEnd(26)} ${String(i._id)}: ${i.credits.length} -> ${next.length} credits`);
        }
    }

    // 3b. Credits from a sibling item of the same wedding (same crew).
    const sourceId = [...cleaned.keys()].find((id) => cleaned.get(id).length);
    if (sourceId) {
        const credits = cleaned.get(sourceId);
        let n = 0;
        for (const i of its) {
            if ((i.credits || []).length) continue;
            itemOps.push({ updateOne: { filter: { _id: i._id }, update: { $set: { credits } } } });
            log.credits += 1; n += 1;
        }
        if (n) console.log(`  credits     ${name(c).padEnd(26)} ${n} item(s) <- ${credits.length} credits from ${sourceId}`);
    }
}
if (flags.length) console.log(`\nNEEDS A DECISION (${flags.length}):\n  - ${flags.join('\n  - ')}`);

console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — eventGroup set: ${log.eventGroup} (ambiguous left: ${log.eventGroupAmbiguous}, no evidence: ${log.eventGroupNoEvidence}) · wedding dates set: ${log.dates} · items given credits: ${log.credits}`);
if (APPLY) {
    if (itemOps.length) console.log('items modified:', (await db.collection('portfolioitems').bulkWrite(itemOps)).modifiedCount);
    if (clientOps.length) console.log('weddings modified:', (await db.collection('clients').bulkWrite(clientOps)).modifiedCount);
}
await mongoose.disconnect();
