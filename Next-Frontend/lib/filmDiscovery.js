export async function fetchFilmDiscovery() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/films/discovery`, {
            next: { revalidate: 60, tags: ['portfolio', 'page:films', 'page:home'] },
        });
        return response.ok ? await response.json() : null;
    } catch { return null; }
}
