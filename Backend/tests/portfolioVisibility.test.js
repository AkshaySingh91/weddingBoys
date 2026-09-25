// npm test   (no database needed: these are the pure rules)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_GATE, hasRender, readinessOf, explainVisibility } from '../Services/portfolioVisibility.js';
import { baselineClientStatus, baselineMediaReady, baselineItemStatus } from '../scripts/lib/visibilityBaseline.js';

const film = { kind: 'Video', render: { webUrl: 'w.mp4', posterUrl: 'p.jpg' } };
const photo = { kind: 'Photo', render: { imageUrl: 'i.jpg' } };
const live = { status: 'Published', clientStatus: 'Published', mediaReady: true };

test('the public gate is exactly the three fields', () => {
    assert.deepEqual({ ...PUBLIC_GATE }, live);
});

test('something to show: a photo needs an image, a film a video and a poster', () => {
    assert.equal(hasRender('Photo', { imageUrl: 'x' }), true);
    assert.equal(hasRender('Photo', {}), false);
    assert.equal(hasRender('Video', { sourceUrl: 'v' }), false, 'no poster');
    assert.equal(hasRender('Video', { posterUrl: 'p' }), false, 'no video');
    assert.equal(hasRender('Video', { loopUrl: 'l', posterUrl: 'p' }), true);
});

test('ready only when processed and showable', () => {
    assert.equal(readinessOf(photo, 'Ready'), true);
    assert.equal(readinessOf(photo, 'Processing'), false);
    assert.equal(readinessOf({ kind: 'Photo', render: {} }, 'Ready'), false);
    assert.equal(readinessOf(film, 'Archived'), false);
});

test('explainVisibility: public with no reasons', () => {
    assert.deepEqual(explainVisibility({ ...live, ...photo }, { status: 'Ready' }), { public: true, reasons: [] });
});

test('explainVisibility: every reason, in order', () => {
    const v = explainVisibility({ status: 'Draft', clientStatus: 'Draft', mediaReady: false }, { status: 'Processing' });
    assert.deepEqual(v, { public: false, reasons: ['hidden-by-admin', 'wedding-draft', 'processing'] });
    assert.deepEqual(explainVisibility({ ...live, clientStatus: 'Archived' }).reasons, ['wedding-archived']);
});

test('explainVisibility: media reasons', () => {
    const item = { ...live, mediaReady: false };
    assert.deepEqual(explainVisibility(item, { status: 'Archived' }).reasons, ['asset-missing']);
    assert.deepEqual(explainVisibility(item, { status: 'Processing', processing: { lastError: 'ffmpeg' } }).reasons, ['failed']);
    assert.deepEqual(explainVisibility(item, { status: 'Ready' }).reasons, ['asset-missing'], 'ready but nothing to show');
    assert.deepEqual(explainVisibility(item, undefined).reasons, ['processing'], 'unpopulated media');
});

test('baseline: weddings without a status', () => {
    assert.equal(baselineClientStatus({ videos: [{}], photos: [] }), 'Published', 'embedded work is live today');
    assert.equal(baselineClientStatus({ videos: [], photos: [] }), 'Draft');
    assert.equal(baselineClientStatus({ status: 'Draft', videos: [{}] }), 'Draft', 'an explicit status wins');
});

test('baseline: archived media stays ready only for legacy items that are shown today', () => {
    assert.equal(baselineMediaReady({ ...photo, legacy: { subdocId: 'x' } }, 'Archived'), true);
    assert.equal(baselineMediaReady(photo, 'Archived'), false);
    assert.equal(baselineMediaReady({ kind: 'Photo', render: {}, legacy: { subdocId: 'x' } }, 'Archived'), false);
    assert.equal(baselineMediaReady(photo, 'Processing'), false);
});

test('baseline: only Add Wedding drafts in draft weddings become Published intent', () => {
    assert.equal(baselineItemStatus({ status: 'Draft' }, 'Draft'), 'Published');
    assert.equal(baselineItemStatus({ status: 'Draft' }, 'Published'), 'Draft', 'may be hidden on purpose');
    assert.equal(baselineItemStatus({ status: 'Draft', legacy: { subdocId: 'x' } }, 'Draft'), 'Draft');
    assert.equal(baselineItemStatus({ status: 'Published' }, 'Draft'), 'Published');
});
