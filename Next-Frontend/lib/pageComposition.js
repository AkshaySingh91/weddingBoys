/**
 * A page's composed section, resolved on the server (Admin › Content, plan
 * phase 6): `/api/content/<page>?resolve=1` returns each section with the data
 * its settings choose (rows from Admin › Rows, filter groups from the tag
 * manager). Tagged so publishing the page or changing a row refreshes it.
 *
 * Returns the section's `{ settings, data }`, or null when the page or section
 * is missing or the API is unreachable — callers then fall back to fetching
 * for themselves, so the page never breaks on the CMS.
 */
const api_url = process.env.NEXT_PUBLIC_API_URL;

export async function composedSection(pageKey, component) {
    try {
        const res = await fetch(`${api_url}/api/content/${pageKey}?resolve=1`, {
            next: { revalidate: 300, tags: [`page:${pageKey}`, 'portfolio'] },
        });
        if (!res.ok) return null;
        const { page } = await res.json();
        const block = (page?.blocks || []).find((b) => b.type === 'section' && b.settings?.component === component);
        return block?.data ? { settings: block.settings, data: block.data } : null;
    } catch {
        return null;
    }
}
