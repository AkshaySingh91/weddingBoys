import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * POST /api/revalidate — On-demand ISR cache purge endpoint
 * Triggered on blog publishing, updating, or archiving to refresh
 * the article, category hubs, city hubs, and sitemap.
 */
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
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
