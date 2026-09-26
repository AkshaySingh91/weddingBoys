// npm test   (no database or network needed: these are the pure rules)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoUrl, embedUrlFor, ExternalVideoError } from '../Services/externalVideo.js';
import { checkSlug, slugForNames, locationFrom } from '../Services/weddingProfile.js';
import { crewOf, toWeddingCard } from '../Services/cards.js';

test('video links: YouTube and Vimeo forms parse', () => {
    const yt = { provider: 'youtube', videoId: 'dQw4w9WgXcQ' };
    for (const u of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ']) {
        assert.deepEqual(parseVideoUrl(u), yt, u);
    }
    assert.deepEqual(parseVideoUrl('https://vimeo.com/1084537'), { provider: 'vimeo', videoId: '1084537' });
    assert.deepEqual(parseVideoUrl('https://player.vimeo.com/video/1084537?h=x'), { provider: 'vimeo', videoId: '1084537' });
});

test('video links: other hosts and look-alikes are refused', () => {
    for (const u of ['https://evil.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
        'javascript:alert(1)', 'not a url', 'https://www.youtube.com/watch?v=short']) {
        assert.throws(() => parseVideoUrl(u), ExternalVideoError, u);
    }
});

test('embeds use the privacy-friendly players', () => {
    assert.match(embedUrlFor({ provider: 'youtube', videoId: 'dQw4w9WgXcQ' }), /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    assert.match(embedUrlFor({ provider: 'vimeo', videoId: '1' }), /dnt=1/);
});

test('slugs', () => {
    assert.equal(slugForNames('Aisha', 'Rahul'), 'aisha-rahul');
    assert.equal(slugForNames('Zz Aisha ', ' Zz Rahul'), 'zz-aisha-zz-rahul');
    assert.equal(checkSlug(' Aisha-Rahul '), 'aisha-rahul');
    for (const bad of ['Not A Slug!', 'a', '-x-', 'a--b', 'story']) assert.throws(() => checkSlug(bad), undefined, bad);
});

test('location gets a city slug; blanks are dropped', () => {
    assert.deepEqual(locationFrom({ city: '  Udaipur ', venue: 'The  Leela', state: '' }), { city: 'Udaipur', venue: 'The Leela', citySlug: 'udaipur' });
});

test('crew is merged by name with every role once', () => {
    const crew = crewOf([
        { credits: [{ name: 'Nisha', role: 'Photographer' }, { name: 'Suraj', role: 'Drone pilot' }] },
        { credits: [{ name: 'nisha', role: 'photographer' }, { name: 'Nisha', role: 'Editor' }, { name: '', role: 'x' }] },
    ]);
    assert.deepEqual(crew, [{ name: 'Nisha', roles: ['Photographer', 'Editor'] }, { name: 'Suraj', roles: ['Drone pilot'] }]);
});

test('a wedding card falls back to the first shoot for its date', () => {
    const card = toWeddingCard({ slug: 'a-b', clientName: { Bride: 'A', Groom: 'B' } }, null, { films: 1, photos: 2, firstShoot: new Date('2023-03-05') });
    assert.equal(card.dates, 'March 2023');
    assert.equal(card.href, '/weddings/story/a-b');
});
