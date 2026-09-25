import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const TAG = /^[a-z0-9:_-]{1,64}$/i;

/**
 * Cache tags from the backend (Backend/Services/revalidate.js): `portfolio`,
 * `page:<key>`. Unlike the blog branch below this has NO fallback secret — that
 * one is shipped to the browser, so anyone could use it. Without
 * REVALIDATION_SECRET set, tag requests are refused.
 *
 * `{ expire: 0 }` is the documented form for a webhook that needs the data
 * gone now (node_modules/next/dist/docs/.../revalidateTag.md); the one-argument
 * form is deprecated.
 */
function revalidateTags(body) {
    const expected = process.env.REVALIDATION_SECRET;
    if (!expected || body.secret !== expected) {
        return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
    }
    const tags = (body.tags || []).filter((t) => typeof t === 'string' && TAG.test(t)).slice(0, 20);
    const paths = (body.paths || []).filter((p) => typeof p === 'string' && p.startsWith('/') && p.length < 200).slice(0, 20);
    tags.forEach((t) => revalidateTag(t, { expire: 0 }));
    paths.forEach((p) => revalidatePath(p));
    return NextResponse.json({ revalidated: true, tags, paths, now: Date.now() });
}

/**
 * POST /api/revalidate — On-demand ISR cache purge endpoint
 * Triggered on blog publishing, updating, or archiving to refresh
 * the article, category hubs, city hubs, and sitemap.
 */
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        if (Array.isArray(body.tags) || Array.isArray(body.paths)) return revalidateTags(body);
        const { searchParams } = new URL(request.url);

        const secret = body.secret || searchParams.get('secret');
        const expectedSecret = process.env.REVALIDATION_SECRET || 'wb_editorial_secret_2026';

        if (secret !== expectedSecret) {
            return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
        }

        const path = body.path || searchParams.get('path');
        const slug = body.slug || searchParams.get('slug');
        const city = body.city || searchParams.get('city');

        const revalidatedPaths = [];

        if (path) {
            revalidatePath(path);
            revalidatedPaths.push(path);
        }

        if (slug) {
            revalidatePath('/blogs');
            revalidatePath(`/blogs/${slug}`);
            revalidatedPaths.push('/blogs', `/blogs/${slug}`);
        }

        if (city) {
            revalidatePath(`/weddings/${city}`);
            revalidatedPaths.push(`/weddings/${city}`);
        }

        // Always revalidate the sitemap if an article or city was purged
        if (slug || city || path === '/blogs') {
            revalidatePath('/sitemap.xml');
            revalidatedPaths.push('/sitemap.xml');
        }

        return NextResponse.json({
            revalidated: true,
            paths: revalidatedPaths,
            now: Date.now(),
        });
    } catch (err) {
        console.error('On-demand revalidation error:', err);
        return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
    }
}
