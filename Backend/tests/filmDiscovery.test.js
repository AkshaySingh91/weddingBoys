import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFilmDiscovery } from '../Services/filmDiscovery.js';

const taxonomy = {
    groups: [{ _id: 'c', key: 'ceremony' }, { _id: 'a', key: 'category' }, { _id: 't', key: 'pre-wedding-themes' }, { _id: 'h', key: 'wedding-themes', hidden: true }],
    tags: [{ _id: 'pre', group: 'c', label: 'Pre-Wedding' }, { _id: 'pre-copy', group: 'a', label: 'Pre-Wedding' }, { _id: 'beach', group: 't', label: 'Beach' }, { _id: 'royal', group: 'h', label: 'Royal' }],
};
const item = (id, score, tags = ['pre', 'beach']) => ({ _id: id, client: { _id: 'couple', clientName: { Bride: 'A', Groom: 'B' } }, spotlight: score, tagIds: tags, render: { posterUrl: '/poster.webp' } });

test('every matching film appears in every relevant category, without a ten-film cap or duplicate entries', () => {
    const films = Array.from({ length: 24 }, (_, index) => item(String(index), index));
    const result = buildFilmDiscovery([...films, films[0]], taxonomy);
    assert.equal(result.total, 24);
    for (const key of ['best-films', 'destination-inspiration', 'events-pre-wedding', 'themes-beach', 'destination-beach']) {
        const row = result.rows.find(r => r.key === key);
        assert.equal(row.items.length, 24);
        assert.deepEqual(row.items.map(i => i.priority), Array.from({ length: 24 }, (_, i) => 23 - i));
    }
});

test('visual score wins over hero status and falls back to legacy general priority', () => {
    const result = buildFilmDiscovery([{ ...item('low-hero', 50), isHero: true }, item('best', 96), { ...item('legacy', 0), generalPriority: 88 }], taxonomy);
    assert.deepEqual(result.films.map(f => f.videos._id), ['best', 'legacy', 'low-hero']);
});

test('mirrored event tags form one row and hidden or empty categories stay absent', () => {
    const result = buildFilmDiscovery([item('one', 90, ['pre', 'pre-copy', 'royal'])], taxonomy);
    assert.equal(result.rows.filter(r => r.title === 'Pre-Wedding').length, 1);
    assert.equal(result.rows.find(r => r.title === 'Pre-Wedding').items.length, 1);
    assert(!result.rows.some(r => r.title === 'Royal' || r.title === 'Beach'));
});

test('location categories use recorded locations without inventing a destination', () => {
    const result = buildFilmDiscovery([{ ...item('mountain', 96, []), location: { city: 'Manali', state: 'Himachal Pradesh' } }, item('unknown', 94, [])], taxonomy);
    assert.deepEqual(result.rows.find(r => r.key === 'place-manali').items.map(f => f.videos._id), ['mountain']);
    assert.equal(result.rows.find(r => r.key === 'destination-inspiration').items.length, 1);
});
