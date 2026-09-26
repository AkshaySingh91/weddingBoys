// npm test   (no database needed: the ordering and the rule filter are pure)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assemble, ruleFilter, SORTS } from '../Services/collectionResolver.js';

const item = (id, client) => ({ _id: id, client });

test('pins come first, in their exact order, then the rule', async () => {
    const { items } = await assemble({
        collection: { limit: 5 },
        pins: [item('p2', 'A'), item('p1', 'B')],
        candidates: [item('r1', 'C'), item('r2', 'D')],
    });
    assert.deepEqual(items.map((i) => `${i._id}:${i.source}`), ['p2:pinned', 'p1:pinned', 'r1:rule', 'r2:rule']);
});

test('the plan\'s example: limit 4, V4 pinned — V4, V1, V2 and then V3', async () => {
    const { items } = await assemble({
        collection: { limit: 4 },
        pins: [item('V4', 'w3')],
        candidates: [item('V1', 'w1'), item('V2', 'w2'), item('V3', 'w1')],
    });
    assert.deepEqual(items.map((i) => i._id), ['V4', 'V1', 'V2', 'V3']);
});

test('the per-wedding cap counts pins and reports what it held back', async () => {
    const { items, notShown } = await assemble({
        collection: { limit: 10, rule: { maxPerWedding: 1 } },
        pins: [item('p', 'A')],
        candidates: [item('a2', 'A'), item('b1', 'B'), item('b2', 'B'), item('c1', 'C')],
    });
    assert.deepEqual(items.map((i) => i._id), ['p', 'b1', 'c1']);
    assert.deepEqual(notShown.map((n) => `${n.item._id}:${n.reason}`), ['a2:wedding-cap', 'b2:wedding-cap']);
});

test('the limit cuts, and says there is more', async () => {
    const { items, hasMore } = await assemble({
        collection: { limit: 2 },
        candidates: [item('a', 'A'), item('b', 'B'), item('c', 'C')],
    });
    assert.deepEqual(items.map((i) => i._id), ['a', 'b']);
    assert.equal(hasMore, true);
});

test('pins over the limit are reported, not silently dropped', async () => {
    const { items, notShown } = await assemble({ collection: { limit: 1 }, pins: [item('a', 'A'), item('b', 'B')] });
    assert.deepEqual(items.map((i) => i._id), ['a']);
    assert.deepEqual(notShown.map((n) => n.reason), ['over-limit']);
});

test('candidates may be an async iterable (a paged cursor)', async () => {
    async function* gen() { yield item('x', 'A'); yield item('y', 'B'); }
    const { items } = await assemble({ collection: { limit: 3 }, candidates: gen() });
    assert.deepEqual(items.map((i) => i._id), ['x', 'y']);
});

const T1 = '64b000000000000000000001';
const T2 = '64b000000000000000000002';
const T3 = '64b000000000000000000003';

test('rule filter: any / all tags, excluded tags, cities, dates', () => {
    const any = ruleFilter({ kind: 'Video', rule: { tagIds: [T1, T2], match: 'any', excludeTagIds: [T3], citySlugs: ['Udaipur'], shootDateFrom: '2024-01-01' } });
    assert.equal(any.kind, 'Video');
    assert.deepEqual(any.tagIds.$in.map(String), [T1, T2]);
    assert.deepEqual(any.tagIds.$nin.map(String), [T3]);
    assert.deepEqual(any['location.citySlug'], { $in: ['udaipur'] });
    assert.ok(any.shootDate.$gte instanceof Date);
    const all = ruleFilter({ kind: 'Photo', rule: { tagIds: [T1, T2], match: 'all' } });
    assert.deepEqual(all.tagIds.$all.map(String), [T1, T2]);
});

test('rule off: the row is its pins alone; rule with no criteria: every public item of the kind', () => {
    assert.equal(ruleFilter({ kind: 'Video', rule: { enabled: false } }), null);
    assert.deepEqual(ruleFilter({ kind: 'Photo', rule: {} }), { kind: 'Photo' });
});

test('every sort ends in _id, so ties never reorder', () => {
    for (const s of Object.values(SORTS)) assert.equal(Object.keys(s).at(-1), '_id');
});
