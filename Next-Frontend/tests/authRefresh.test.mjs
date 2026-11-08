import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NEXT_PUBLIC_API_URL = 'http://api.test';

/** A fake API: protected calls are 401 until /refresh has been called. */
function fakeApi({ refreshOk = true } = {}) {
    const calls = [];
    let fresh = false;
    const fetch = async (input) => {
        const url = typeof input === 'string' ? input : input.url;
        calls.push(url);
        if (url.endsWith('/api/admin/auth/refresh')) {
            await new Promise((r) => setTimeout(r, 5));
            fresh = refreshOk;
            return new Response(null, { status: refreshOk ? 200 : 401 });
        }
        if (url.includes('/api/admin/auth/')) return new Response(null, { status: 401 });
        return new Response(JSON.stringify({ ok: true }), { status: fresh ? 200 : 401 });
    };
    return { calls, fetch };
}

const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; delete globalThis.window; });

/** As in a browser, `window` is the global object, so bare `fetch` is window.fetch. */
async function install(api) {
    globalThis.window = globalThis;
    globalThis.fetch = api.fetch;
    const mod = await import(`../lib/apiClient.js?${Math.random()}`);
    mod.installAuthRefresh();
    return globalThis.fetch;
}

test('an expired token is refreshed and the request retried', async () => {
    const api = fakeApi();
    const fetch = await install(api);
    const res = await fetch('http://api.test/api/admin/clients', { credentials: 'include' });
    assert.equal(res.status, 200);
    assert.deepEqual(api.calls, [
        'http://api.test/api/admin/clients',
        'http://api.test/api/admin/auth/refresh',
        'http://api.test/api/admin/clients',
    ]);
});

test('a burst of 401s triggers exactly one refresh', async () => {
    const api = fakeApi();
    const fetch = await install(api);
    const results = await Promise.all(['a', 'b', 'c'].map((p) => fetch(`http://api.test/api/admin/${p}`)));
    assert.deepEqual(results.map((r) => r.status), [200, 200, 200]);
    assert.equal(api.calls.filter((u) => u.endsWith('/refresh')).length, 1);
});

test('a failed refresh returns the original 401, no retry', async () => {
    const api = fakeApi({ refreshOk: false });
    const fetch = await install(api);
    const res = await fetch('http://api.test/api/admin/clients');
    assert.equal(res.status, 401);
    assert.equal(api.calls.length, 2);
});

test('auth endpoints and other origins pass straight through', async () => {
    const api = fakeApi();
    const fetch = await install(api);
    assert.equal((await fetch('http://api.test/api/admin/auth/login', { method: 'POST' })).status, 401);
    assert.equal((await fetch('https://media.example/x.jpg')).status, 401);
    assert.equal(api.calls.filter((u) => u.endsWith('/refresh')).length, 0);
});

test('a Request body is replayed on retry', async () => {
    const api = fakeApi();
    const bodies = [];
    const inner = api.fetch;
    api.fetch = async (input, init) => {
        if (input instanceof Request) bodies.push(await input.clone().text());
        return inner(input, init);
    };
    const fetch = await install(api);
    const res = await fetch(new Request('http://api.test/api/admin/save', { method: 'POST', body: '{"a":1}' }));
    assert.equal(res.status, 200);
    assert.deepEqual(bodies, ['{"a":1}', '{"a":1}']);
});
