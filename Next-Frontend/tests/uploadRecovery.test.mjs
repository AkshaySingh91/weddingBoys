import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUpload } from '../lib/upload/multipartUploader.js';

test('resuming a committed upload completes the same session without sending bytes again', async (t) => {
    const requests = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        requests.push({ url, options });
        const body = url.endsWith('/parts') ? { completionPending: true, uploadId: 'committed', parts: [] }
            : { media: { mediaId: 'existing-asset' } };
        return { ok: true, json: async () => body };
    });
    const upload = createUpload({ file: { name: 'film.mp4', size: 120, lastModified: 1 }, resumeSessionId: 'same-session' });
    const media = await upload.promise;
    assert.equal(media.mediaId, 'existing-asset');
    assert.equal(requests.length, 2);
    assert.ok(requests[0].url.endsWith('/same-session/parts'));
    assert.ok(requests[1].url.endsWith('/same-session/complete'));
    assert.equal(requests[1].options.method, 'POST');
});
