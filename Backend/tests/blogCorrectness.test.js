import { test } from 'node:test';
import assert from 'node:assert/strict';
import BlogPost from '../Models/blogPost.js';
import BlogDailyStat from '../Models/BlogDailyStat.js';
import Comment from '../Models/Comment.js';
import { getBlogAnalytics, trackBlogEvent } from '../Controllers/blogAnalyticsController.js';
import { getPublishedPosts } from '../Controllers/blogController.js';

const response = () => ({ code: 200, status(n) { this.code = n; return this; }, json(value) { this.body = value; return this; } });
function analytics(t, measured) {
    const post = { _id: 'post', title: 'Story', slug: 'story', category: 'Real Weddings', status: 'Published', viewCount: 1000 };
    t.mock.method(BlogPost, 'find', () => ({ select() { return this; }, lean: async () => [post] }));
    t.mock.method(BlogPost, 'aggregate', async () => []);
    let query = 0;
    t.mock.method(BlogDailyStat, 'aggregate', async () => {
        const n = query++;
        if (!measured) return [];
        return [
            [{ _id: new Date().toISOString().slice(0, 10), views: 10, uniqueViews: 8, readCompletes: 2, ctaClicks: 1 }],
            [{ views: 5, readCompletes: 1 }],
            [{ _id: 'post', periodViews: 10, periodReadCompletes: 2, periodCtaClicks: 1 }],
            [{ _id: 'post', periodViews: 10 }],
        ][n];
    });
    t.mock.method(Comment, 'aggregate', async () => []);
    t.mock.method(Comment, 'countDocuments', async () => 0);
}

test('analytics keeps lifetime and period views separate and calculates rates from period data', async (t) => {
    analytics(t, true);
    const res = response(); await getBlogAnalytics({ query: { range: '7d' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.kpis.totalViews, 10);
    assert.equal(res.body.kpis.lifetimeViews, 1000);
    assert.equal(res.body.kpis.avgReadCompletionRate, 20);
    assert.equal(res.body.kpis.viewsTrendPercent, 100);
    assert.equal(res.body.categoryShare[0].views, 10);
    assert.equal(res.body.categoryShare[0].sharePercent, 100);
});

test('an unmeasured period does not invent top stories or completion events', async (t) => {
    analytics(t, false);
    const res = response(); await getBlogAnalytics({ query: {} }, res);
    assert.equal(res.body.kpis.totalViews, 0);
    assert.equal(res.body.kpis.lifetimeViews, 1000);
    assert.deepEqual(res.body.topStories, []);
    assert.equal(res.body.measurement.hasDailyRecords, false);
});

test('tracking does not expose or count a draft story', async (t) => {
    t.mock.method(BlogPost, 'findOne', (query) => {
        assert.equal(query.status, 'Published');
        return { select: async () => null };
    });
    t.mock.method(BlogDailyStat, 'recordEvent', () => assert.fail('must not record a draft'));
    const res = response(); await trackBlogEvent({ params: { slug: 'draft' }, body: {} }, res);
    assert.equal(res.code, 404);
});

test('blog archive pages query beyond record 48 with category aliases and escaped search', async (t) => {
    let skip;
    t.mock.method(BlogPost, 'countDocuments', async (query) => {
        assert.deepEqual(query.category, { $in: ['Planning Guides', 'Wedding Planning'] });
        assert.equal(query.$or[0].title.test('['), true);
        return 60;
    });
    t.mock.method(BlogPost, 'find', () => ({ sort() { return this; }, skip(value) { skip = value; return this; },
        limit(value) { assert.equal(value, 9); return this; }, populate() { return this; }, select: async () => [{ slug: 'older-story' }] }));
    t.mock.method(BlogPost, 'aggregate', async () => [{ _id: 'Planning Guides', count: 60 }]);
    const res = response(); await getPublishedPosts({ query: { page: '7', limit: '9', category: 'Planning Guides', search: '[' } }, res);
    assert.equal(res.code, 200);
    assert.equal(skip, 54);
    assert.equal(res.body.total, 60);
    assert.equal(res.body.hasMore, false);
    assert.equal(res.body.posts[0].slug, 'older-story');
});
