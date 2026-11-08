import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';

// Synthetic storage only. Never contact the configured bucket.
process.env.R2_ACCOUNT_ID = 'test';
process.env.R2_BUCKET_NAME = 'test';
process.env.R2_PUBLIC_URL = 'https://media.example.invalid';
process.env.R2_ACCESS_KEY_ID = 'test';
process.env.R2_SECRET_ACCESS_KEY = 'test';
const { completeUpload, getUploadParts } = await import('../Controllers/uploadController.js');
const { finishPlacements, processJob } = await import('../Services/mediaProcessor.js');
const { default: UploadSession } = await import('../Models/UploadSession.js');
const { default: Media } = await import('../Models/Media.js');
const { default: MediaJob } = await import('../Models/MediaJob.js');
const { default: PortfolioItem } = await import('../Models/PortfolioItem.js');

const response = () => ({ code: 200, status(value) { this.code = value; return this; }, json(value) { this.body = value; return this; } });
function harness(t, { multipart = false, bytes = 12 } = {}) {
    const session = { _id: 'upload', status: 'Open', mediaId: 'asset', key: 'test/orig.jpg', fileName: 'original.jpg',
        fileSize: 12, contentType: 'image/jpeg', rendition: 'orig', meta: {}, ...(multipart ? { uploadId: 'multipart', partCount: 1 } : {}) };
    let media;
    let job;
    let failQueue = false;
    t.mock.method(console, 'error', () => {});
    const storage = t.mock.method(S3Client.prototype, 'send', async (command) => {
        if (command.constructor.name === 'ListPartsCommand') { const error = new Error('Already completed'); error.name = 'NoSuchUpload'; throw error; }
        assert.equal(command.constructor.name, 'HeadObjectCommand');
        return { ContentLength: bytes, ContentType: 'image/jpeg', ETag: 'test' };
    });
    t.mock.method(UploadSession, 'findById', async () => ({ ...session }));
    t.mock.method(UploadSession, 'findOneAndUpdate', async (_filter, update) => {
        if (session.completionLockedAt) return null;
        Object.assign(session, update.$set); return session;
    });
    t.mock.method(UploadSession, 'updateOne', async (filter, update) => {
        if (filter.completionToken !== session.completionToken) return { matchedCount: 0 };
        Object.assign(session, update.$set);
        for (const key of Object.keys(update.$unset || {})) delete session[key];
        return { matchedCount: 1 };
    });
    t.mock.method(Media, 'findOne', async () => media);
    t.mock.method(Media, 'findOneAndUpdate', async (_filter, update) => media ||= { _id: 'media', ...update.$setOnInsert });
    const enqueue = t.mock.method(MediaJob, 'findOneAndUpdate', async (filter, update) => {
        if (failQueue) throw new Error('Synthetic queue outage');
        job ||= { _id: 'job', ...filter, ...update.$setOnInsert }; return job;
    });
    return { session, storage, enqueue, failQueue(value) { failQueue = value; }, async complete() {
        const res = response(); await completeUpload({ params: { sessionId: 'upload' }, body: {} }, res); return res;
    } };
}

test('completion recovers a queue failure without losing or duplicating the asset', async (t) => {
    const h = harness(t);
    h.failQueue(true);
    assert.equal((await h.complete()).code, 500);
    assert.equal(h.session.status, 'Completing');
    assert.equal(h.session.completionLockedAt, undefined);
    h.failQueue(false);
    const recovered = await h.complete();
    assert.equal(recovered.code, 200);
    assert.equal(h.session.status, 'Completed');
    const calls = h.enqueue.mock.callCount();
    assert.equal((await h.complete()).body.media, recovered.body.media);
    assert.equal(h.enqueue.mock.callCount(), calls);
});

test('multipart completion recovers an object committed before the DB write', async (t) => {
    const h = harness(t, { multipart: true });
    assert.equal((await h.complete()).code, 200);
    assert.equal(h.storage.mock.callCount(), 2);
});

test('single PUT must match the stored object size before recording a media asset', async (t) => {
    const h = harness(t, { bytes: 999 });
    assert.equal((await h.complete()).code, 400);
    assert.equal(h.enqueue.mock.callCount(), 0);
    assert.notEqual(h.session.status, 'Completed');
});

test('overlapping completion requests cannot take an active lease', async (t) => {
    const h = harness(t); h.session.completionLockedAt = new Date();
    assert.equal((await h.complete()).code, 409);
    assert.equal(h.storage.mock.callCount(), 0);
});

test('a committed resumable upload tells the browser to finish without listing spent multipart parts', async (t) => {
    const h = harness(t, { multipart: true });
    h.session.status = 'Completing';
    const res = response();
    await getUploadParts({ params: { sessionId: 'upload' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.completionPending, true);
    assert.equal(h.storage.mock.callCount(), 0);
});

test('portfolio synchronization failure propagates and a retry skips the encode', async (t) => {
    let saves = 0;
    const media = { mediaId: 'asset', status: 'Ready', processing: { filesReadyForJob: 'job' }, save: async () => { saves++; } };
    await assert.rejects(finishPlacements(media, 'job', async () => { throw new Error('Synthetic sync outage'); }), /sync outage/);
    assert.equal(media.processing.placementsSyncedForJob, undefined);
    assert.equal(saves, 0);
    t.mock.method(Media, 'findOne', async () => media);
    t.mock.method(PortfolioItem, 'updateMany', async () => ({ modifiedCount: 0 }));
    t.mock.method(PortfolioItem, 'find', () => ({ select() { return this; }, lean: async () => [] }));
    await processJob({ _id: 'job', mediaId: 'asset', type: 'derivatives' });
    assert.equal(media.processing.placementsSyncedForJob, 'job');
    assert.equal(saves, 1);
});
