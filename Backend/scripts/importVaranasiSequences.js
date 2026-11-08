/**
 * One-time migration of the two checked-in Varanasi frame folders to managed
 * R2 releases. Creates Ready releases but does not publish them; review in
 * /admin/varanasi-sequences before switching the live pointer.
 *
 *   node scripts/importVaranasiSequences.js           # inventory only
 *   node scripts/importVaranasiSequences.js --execute # upload to dev/ R2 + dev DB
 *   node scripts/importVaranasiSequences.js --execute --publish # switch dev page after review
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import DBconnection from '../Config/DBconnection.js';
import Sequence from '../Models/Sequence.js';
import SequencePage from '../Models/SequencePage.js';
import { generateSequence } from '../Services/sequenceProcessor.js';
import { queueRevalidate } from '../Services/revalidate.js';

const root = path.resolve('../Next-Frontend/public');
const scenes = [
    { slot: 'hero', folder: path.join(root, 'varanasi-frames-2/webp'), pattern: /^varanasi-frames_(\d{3})\.webp$/, expected: 150 },
    { slot: 'director', folder: path.join(root, 'director-frames'), pattern: /^Timeline_1_(\d{3})\.webp$/, expected: 146 },
];

async function inventory(scene) {
    const names = (await fs.readdir(scene.folder)).filter((name) => scene.pattern.test(name));
    names.sort((a, b) => Number(a.match(scene.pattern)[1]) - Number(b.match(scene.pattern)[1]));
    if (names.length !== scene.expected || names.some((name, index) => Number(name.match(scene.pattern)[1]) !== index + 1)) {
        throw new Error(`${scene.slot}: expected continuous frames 1–${scene.expected}, found ${names.length}`);
    }
    return names.map((name) => path.join(scene.folder, name));
}

async function main() {
    const inputs = await Promise.all(scenes.map(inventory));
    scenes.forEach((scene, i) => console.log(`${scene.slot}: ${inputs[i].length} ordered source frames`));
    if (!process.argv.includes('--execute')) return;
    if (process.env.STORAGE_KEY_PREFIX !== 'dev') throw new Error('Migration requires STORAGE_KEY_PREFIX=dev');
    await DBconnection();
    try {
        if (mongoose.connection.name !== 'weddingboys_dev') throw new Error('Migration requires weddingboys_dev');
        for (let i = 0; i < scenes.length; i += 1) {
            const scene = scenes[i];
            const name = `Varanasi ${scene.slot} (imported)`;
            let sequence = await Sequence.findOne({ pageKey: 'varanasi', slot: scene.slot, name, sourceMediaId: { $exists: false } }).sort({ createdAt: -1 });
            if (sequence?.status === 'Ready') {
                console.log(`${scene.slot} release ${sequence.releaseId} is already Ready; skipping.`);
                continue;
            }
            if (!sequence) {
                const releaseId = nanoid(12);
                sequence = await Sequence.create({
                    name, slug: `varanasi-${scene.slot}-${releaseId}`,
                    pageKey: 'varanasi', slot: scene.slot, releaseId,
                    ownerType: 'Website', frameCount: inputs[i].length, status: 'Draft',
                });
            }
            console.log(`Generating ${scene.slot} release ${sequence.releaseId}...`);
            await generateSequence(sequence._id, { framePaths: inputs[i] });
            console.log(`Ready ${scene.slot} release ${sequence.releaseId}; preview and publish in admin.`);
        }
        if (process.argv.includes('--publish')) {
            const hero = await Sequence.findOne({ pageKey: 'varanasi', slot: 'hero', name: 'Varanasi hero (imported)', status: 'Ready' }).sort({ createdAt: -1 });
            const director = await Sequence.findOne({ pageKey: 'varanasi', slot: 'director', name: 'Varanasi director (imported)', status: 'Ready' }).sort({ createdAt: -1 });
            if (!hero || !director) throw new Error('Both imported scenes must be Ready before publishing');
            await SequencePage.findOneAndUpdate({ pageKey: 'varanasi' }, {
                $set: { 'slots.hero': hero._id, 'slots.director': director._id, updatedBy: 'dev-import-cli' },
            }, { upsert: true });
            await Sequence.updateMany({ _id: { $in: [hero._id, director._id] } }, { $set: { publishedAt: new Date() } });
            queueRevalidate({ tags: ['page:varanasi'], paths: ['/varanasi'] });
            await new Promise((resolve) => setTimeout(resolve, 2500));
            console.log(`Published dev releases: hero=${hero.releaseId}, director=${director.releaseId}`);
        }
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
