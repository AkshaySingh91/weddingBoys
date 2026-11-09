import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { bestIndex, scoreFrame, focalPoint } from '../Services/coverService.js';

const solid = (v) => sharp({ create: { width: 160, height: 90, channels: 3, background: { r: v, g: v, b: v } } }).jpeg().toBuffer();
const noise = async (w = 160, h = 90, mean = 120) => {
    const px = Buffer.alloc(w * h * 3);
    for (let i = 0; i < px.length; i++) px[i] = Math.max(0, Math.min(255, mean + Math.round((Math.random() - 0.5) * 160)));
    return sharp(px, { raw: { width: w, height: h, channels: 3 } }).jpeg().toBuffer();
};

test('cover: fades, blown-out and flat frames are rejected', async () => {
    assert.equal(await scoreFrame(await solid(5)), null);
    assert.equal(await scoreFrame(await solid(250)), null);
    assert.equal(await scoreFrame(await solid(120)), null);
    assert.ok(await scoreFrame(await noise()));
});

test('cover: the sharp, well-exposed candidate wins; all-rejected gives -1', async () => {
    const detailed = await scoreFrame(await noise());
    const blurred = await scoreFrame(await sharp(await noise()).blur(4).toBuffer());
    assert.equal(bestIndex([null, blurred, detailed, null]), 2);
    assert.equal(bestIndex([null, null]), -1);
});

test('cover: focal point follows the subject in a landscape still', async () => {
    // Flat grey frame with a bright, saturated subject on the right third.
    const subject = await sharp({ create: { width: 200, height: 360, channels: 3, background: { r: 230, g: 150, b: 120 } } }).png().toBuffer();
    const frame = await sharp({ create: { width: 1280, height: 720, channels: 3, background: { r: 60, g: 60, b: 60 } } })
        .composite([{ input: subject, left: 960, top: 200 }]).jpeg().toBuffer();
    const { x, y } = await focalPoint(frame);
    assert.ok(x > 0.6, `x=${x}`);
    assert.ok(y >= 0 && y <= 1);
});
