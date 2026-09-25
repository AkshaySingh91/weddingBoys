// npm test   (no database needed: these are the pure rules)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseLabel, slugify, checkLabel, mirrorsFor, idsForLegacyStrings, TaxonomyError } from '../Services/taxonomy.js';

const group = (key, extra = {}) => ({ _id: key, key, label: key, order: 0, ...extra });
const tag = (id, g, label, extra = {}) => ({ _id: id, group: g, label, slug: slugify(label), aliases: [], ...extra });
const groups = [
    group('ceremony', { order: 0 }),
    group('category', { legacyTagType: 'Category', order: 10 }),
    group('themes', { legacyTagType: 'Wedding Themes', order: 11 }),
    group('unsorted', { order: 99 }),
];
const tags = [
    tag('c-haldi', 'ceremony', 'Haldi'),
    tag('k-haldi', 'category', 'Haldi'),
    tag('k-wedding', 'category', 'Wedding'),
    tag('t-classic', 'themes', 'Classic', { aliases: ['cassic'] }),
    tag('u-bride', 'unsorted', 'Bride'),
];
const tax = {
    tags,
    tagById: new Map(tags.map((t) => [t._id, t])),
    groupById: new Map(groups.map((g) => [g._id, g])),
};

test('labels are normalised and slugged', () => {
    assert.equal(normaliseLabel('  #Pre-Wedding   Film '), 'Pre-Wedding Film');
    assert.equal(slugify('Haldi & Mehendi'), 'haldi-and-mehendi');
    assert.equal(slugify('Wedding / Pheras'), 'wedding-pheras');
});

test('checkLabel refuses what could never be linked to', () => {
    assert.throws(() => checkLabel(' '), TaxonomyError);
    assert.throws(() => checkLabel('Haldi, Mehendi'), /commas/);
    assert.throws(() => checkLabel('x'.repeat(61)), /60/);
    assert.throws(() => checkLabel('###'), TaxonomyError);
    assert.equal(checkLabel(' Royal  Palace '), 'Royal Palace');
});

test('label copies: the ceremony goes to eventGroup, everything else to tags', () => {
    assert.deepEqual(mirrorsFor(['k-wedding', 'c-haldi', 't-classic'], tax), { tags: ['Wedding', 'Classic'], eventGroup: 'Haldi' });
    assert.deepEqual(mirrorsFor([], tax), { tags: [], eventGroup: '' });
    assert.deepEqual(mirrorsFor(['gone'], tax), { tags: [], eventGroup: '' }, 'unknown ids are ignored');
});

test('old item strings resolve to the category tag before a ceremony of the same name', () => {
    const r = idsForLegacyStrings(['Haldi', 'wedding', 'Cassic', 'Bride', 'Nope', 'Haldi'], tax);
    assert.deepEqual(r.ids, ['k-haldi', 'k-wedding', 't-classic', 'u-bride']);
    assert.deepEqual(r.unresolved, ['Nope']);
});
