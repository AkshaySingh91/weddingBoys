'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/admin/components/ui/Tabs.jsx';
import Herobanner from './_components/Herobanner.jsx';
import HeroCarouselManager from './_components/HeroCarouselManager.jsx';
import Link from 'next/link';
// The Heritage Map and BTS Tape tabs are retired (plan phase 7): no page of this
// site reads their data. Their components (Map.jsx, BtsTape.jsx) stay for the
// old site until it is replaced. The BTS photos live in Content › Home.
import Review from './_components/Review.jsx';
import {
  Sparkle,
  FilmSlate,
  Camera,
  Heart,
} from '@phosphor-icons/react';

const TABS = ['hero', 'showcase', 'bts', 'reviews'];

export default function HomePageSetting() {
  return (
    <Suspense fallback={null}>
      <HomeSettings />
    </Suspense>
  );
}

function HomeSettings() {
  // ?tab=reviews opens a tab directly (the content editor links here).
  const asked = useSearchParams().get('tab');
  const initialTab = TABS.includes(asked) ? asked : 'hero';
  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Homepage Experience Curator"
        subtitle="Control the opening hero video reel, showcase films, behind-the-scenes photos and couple testimonials."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Website Settings' },
          { label: 'Home Experience' },
        ]}
      />

      <Tabs defaultValue={initialTab} className="w-full space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="h-12 bg-white p-1 border border-edge-subtle shadow-sm rounded-xl w-full sm:w-auto justify-start">
            <TabsTrigger value="hero" className="gap-2 px-4 py-2 text-xs">
              <Sparkle size={15} weight="fill" className="text-gold-strong" />
              <span>Hero & Reels</span>
            </TabsTrigger>
            <TabsTrigger value="showcase" className="gap-2 px-4 py-2 text-xs">
              <FilmSlate size={15} weight="fill" className="text-accent-ink" />
              <span>Showcase Reels</span>
            </TabsTrigger>
            <TabsTrigger value="bts" className="gap-2 px-4 py-2 text-xs">
              <Camera size={15} weight="fill" className="text-accent-ink" />
              <span>Behind the scenes</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2 px-4 py-2 text-xs">
              <Heart size={15} weight="fill" className="text-accent-ink" />
              <span>Couple Reviews</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Hero & Reels */}
        <TabsContent value="hero" className="space-y-8 mt-0">
          <Herobanner />
          <HeroCarouselManager />
        </TabsContent>

        {/* Tab 2: Showcase Reels */}
        <TabsContent value="showcase" className="mt-0">
          {/* The home "Our films" tabs are rows now: which rows, in what order,
              is set on the home page composition, and each row's films in
              Admin › Rows. The old tag-list editor (VideoThumbnail) edited a
              list the site no longer reads for this section. */}
          <div className="rounded-xl border border-edge-subtle bg-white p-6 space-y-3">
            <h2 className="font-sans text-xl text-ink">Home “Our films” tabs</h2>
            <p className="text-sm text-ink-secondary max-w-2xl">
              Each tab is a row. Choose which rows appear and their order in the home page composition; choose what each row shows, pin films and set its order in Rows.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/content/home" className="rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-white">Open home page composition</Link>
              <Link href="/admin/collections" className="rounded-lg border border-edge-subtle px-3.5 py-2 text-xs font-semibold text-ink">Open Rows</Link>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Behind the scenes — edited in the home composition now */}
        <TabsContent value="bts" className="mt-0">
          <div className="rounded-xl border border-edge-subtle bg-white p-6 space-y-3">
            <h2 className="font-sans text-xl text-ink">Behind the scenes</h2>
            <p className="text-sm text-ink-secondary max-w-2xl">
              The home page’s behind-the-scenes photos are the “Behind the Scenes” gallery in the home page composition. Add, remove and order them there.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/content/home" className="rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-white">Open home page composition</Link>
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Couple Reviews */}
        <TabsContent value="reviews" className="mt-0">
          <Review />
        </TabsContent>
      </Tabs>
    </div>
  );
}
