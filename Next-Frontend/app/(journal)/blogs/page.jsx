import { getPublishedPosts, SITE_URL } from '@/lib/blogApi.js';
import BlogIndexClient from './_components/BlogIndexClient.jsx';

export const revalidate = 3600;

export const metadata = {
  title: 'The Journal — Wedding Stories, Cinema Craft & Destination Guides | The Wedding Boys',
  description:
    'Explore real wedding films, palace destination guides, photography masterclasses, and behind-the-lens reflections from The Wedding Boys cinematography studio.',
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    title: 'The Journal — Wedding Stories & Cinema Craft | The Wedding Boys',
    description:
      'Curated wedding films, royal destination guides, and photography masterclasses from India’s leading wedding cinematographers.',
    url: `${SITE_URL}/blogs`,
    type: 'website',
  },
};

export default async function BlogIndexPage() {
  const { posts } = await getPublishedPosts({ limit: 48 });

  // Extract distinct category list (normalized)
  const normalizedPosts = posts.map((p) => ({
    ...p,
    category: p.category === 'Wedding Planning' ? 'Planning Guides' : p.category,
  }));

  const rawCategories = Array.from(
    new Set(normalizedPosts.map((p) => p.category).filter(Boolean))
  );
  const categories = ['All', ...rawCategories];

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10">
        {/* Client Magazine Hub with Masthead, Filter, Hero & Grid */}
        <BlogIndexClient initialPosts={normalizedPosts} categories={categories} />
      </div>
    </div>
  );
}
