import { getPublishedPosts, SITE_URL } from '@/lib/blogApi.js';
import BlogIndexClient from './_components/BlogIndexClient.jsx';

export const revalidate = 3600;

const baseMetadata = {
  title: 'The Journal — Wedding Stories, Cinema Craft & Destination Guides | The Wedding Vachan',
  description:
    'Explore real wedding films, palace destination guides, photography masterclasses, and behind-the-lens reflections from The Wedding Vachan cinematography studio.',
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    title: 'The Journal — Wedding Stories & Cinema Craft | The Wedding Vachan',
    description:
      'Curated wedding films, royal destination guides, and photography masterclasses from India’s leading wedding cinematographers.',
    url: `${SITE_URL}/blogs`,
    type: 'website',
  },
};

const stateOf = (params = {}) => ({
  category: typeof params.category === 'string' ? params.category.slice(0, 100) : 'All',
  query: typeof params.q === 'string' ? params.q.slice(0, 120) : '',
  page: Math.min(100000, Math.max(1, Number.parseInt(params.page, 10) || 1)),
});

export async function generateMetadata({ searchParams }) {
  const { category, query, page } = stateOf(await searchParams);
  const params = new URLSearchParams();
  if (category !== 'All') params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const url = `${SITE_URL}/blogs${params.size ? `?${params}` : ''}`;
  return { ...baseMetadata, alternates: { canonical: url }, openGraph: { ...baseMetadata.openGraph, url },
    ...(query ? { robots: { index: false, follow: true } } : {}) };
}

export default async function BlogIndexPage({ searchParams }) {
  const { category, query, page } = stateOf(await searchParams);
  const { posts, total = 0, categories: facets = [] } = await getPublishedPosts({
    category: category === 'All' ? undefined : category, search: query, page, limit: 9,
  });
  const normalizedPosts = posts.map((post) => ({ ...post,
    category: post.category === 'Wedding Planning' ? 'Planning Guides' : post.category }));
  const counts = { All: facets.reduce((sum, facet) => sum + facet.count, 0) };
  for (const facet of facets) if (facet._id) counts[facet._id] = facet.count;
  const categories = ['All', ...Object.keys(counts).filter((key) => key !== 'All')];
  if (!categories.includes(category)) categories.push(category);
  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10">
        <BlogIndexClient key={`${category}:${query}:${page}`} initialPosts={normalizedPosts}
          categories={categories} counts={counts} total={total}
          activeCategory={category} initialQuery={query} currentPage={page} />
      </div>
    </div>
  );
}
