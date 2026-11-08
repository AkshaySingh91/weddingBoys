import { test } from 'node:test';
import assert from 'node:assert/strict';
import PortfolioItem from '../Models/PortfolioItem.js';
import { pagination } from '../Utils/pagination.js';
import { findFeedWithTotal, findFeed, findRecommended } from '../Services/portfolioService.js';
import { SORTS } from '../Services/collectionResolver.js';

test('pagination rejects zero, negative, nonfinite, fractional and excessive sizes', () => {
    for (const value of ['0', '-1', 'NaN', 'Infinity', '2.5', ['1', '2']]) {
        assert.deepEqual(pagination({ page: value, limit: value }), { page: 1, limit: 12 });
    }
    assert.deepEqual(pagination({ limit: '9999999', page: '9999999' }), { page: 100000, limit: 100 });
});

test('public photo and recommendation queries cannot disable Mongo limits with zero', async (t) => {
    const limits = [];
    t.mock.method(PortfolioItem, 'find', () => ({
        sort() { return this; }, skip() { return this; }, limit(n) { limits.push(n); return this; },
        populate() { return this; }, lean: async () => [],
    }));
    await findFeed({ kind: 'Photo', limit: 0 });
    await findRecommended({ item: { kind: 'Photo', _id: 'id', tagIds: ['tag'] }, limit: 0 });
    assert.deepEqual(limits, [10, 10]);
});

test('the paginated video feed applies the CMS-selected sort through the service', async (t) => {
    let actual;
    t.mock.method(PortfolioItem, 'countDocuments', async () => 0);
    t.mock.method(PortfolioItem, 'find', () => ({
        sort(value) { actual = value; return this; }, skip() { return this; }, limit() { return this; },
        populate() { return this; }, lean: async () => [],
    }));
    await findFeedWithTotal({ kind: 'Video', sort: 'newestShoot' });
    assert.deepEqual(actual, SORTS.newestShoot);
});
