import { test } from 'node:test';
import assert from 'node:assert/strict';
import PageContent from '../Models/PageContent.js';
import { getPageContent } from '../Controllers/contentController.js';

test('public CMS reads sanitize legacy rich text and never expose a draft', async (t) => {
    const page = { blocks: [{ type: 'richText', body: '<p>Keep <strong>formatting</strong></p><img src="x" onerror="alert(1)"><script>alert(1)</script>' }], draft: { blocks: [{ body: 'private draft' }] } };
    t.mock.method(PageContent, 'findOne', () => ({ populate() { return this; }, then(resolve, reject) { return Promise.resolve(page).then(resolve, reject); } }));
    const res = { status() { return this; }, json(body) { this.body = body; return this; } };
    await getPageContent({ params: { pageKey: 'home' }, query: {} }, res);
    assert.ok(res.body.page.blocks[0].body.includes('<strong>formatting</strong>'));
    assert.ok(!/onerror|<script|private draft/.test(JSON.stringify(res.body)));
    assert.equal('draft' in res.body.page, false);
});
