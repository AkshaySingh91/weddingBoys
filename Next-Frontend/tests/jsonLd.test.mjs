import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeJsonLd } from '../lib/jsonLd.mjs';

test('JSON-LD cannot close the containing script and still round-trips editorial text', () => {
    const payload = { headline: '</script><img src=x onerror=alert(1)>', nested: { text: 'A < B & C' } };
    const serialized = serializeJsonLd(payload);
    assert.equal(serialized.includes('<'), false);
    assert.deepEqual(JSON.parse(serialized), payload);
});
