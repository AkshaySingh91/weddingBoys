'use client';

import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/admin/components/ui/Tabs.jsx';
import Herobanner from './_components/Herobanner.jsx';
import HeroCarouselManager from './_components/HeroCarouselManager.jsx';
import Link from 'next/link';
import Map from './_components/Map.jsx';
import BtsTape from './_components/BtsTape.jsx';
import Review from './_components/Review.jsx';
import {
  Sparkle,
  FilmSlate,
  MapPin,
  Camera,
  Heart,
} from '@phosphor-icons/react';

export default function HomePageSetting() {
  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Homepage Experience Curator"
        subtitle="Control the opening hero video reel, showcase films, interactive heritage map, BTS production tape, and couple testimonials."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Website Settings' },
          { label: 'Home Experience' },
        ]}
      />

      <Tabs defaultValue="hero" className="w-full space-y-6">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="h-12 bg-white p-1 border border-[#E5DCD3] shadow-sm rounded-2xl w-full sm:w-auto justify-start">
            <TabsTrigger value="hero" className="gap-2 px-4 py-2 text-xs">
              <Sparkle size={15} weight="fill" className="text-[#C29555]" />
              <span>Hero & Reels</span>
            </TabsTrigger>
            <TabsTrigger value="showcase" className="gap-2 px-4 py-2 text-xs">
              <FilmSlate size={15} weight="fill" className="text-[#A3603A]" />
              <span>Showcase Reels</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2 px-4 py-2 text-xs">
              <MapPin size={15} weight="fill" className="text-[#A3603A]" />
              <span>Heritage Map</span>
            </TabsTrigger>
            <TabsTrigger value="bts" className="gap-2 px-4 py-2 text-xs">
              <Camera size={15} weight="fill" className="text-[#A3603A]" />
              <span>BTS Tape</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2 px-4 py-2 text-xs">
              <Heart size={15} weight="fill" className="text-[#A3603A]" />
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
          <div className="rounded-2xl border border-[#E7E2DA] bg-white p-6 space-y-3">
            <h2 className="font-serif text-xl text-[#1C1917]">Home “Our films” tabs</h2>
            <p className="text-sm text-[#57534E] max-w-2xl">
              Each tab is a row. Choose which rows appear and their order in the home page composition; choose what each row shows, pin films and set its order in Rows.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/content/home" className="rounded-lg bg-[#1C1917] px-3.5 py-2 text-xs font-semibold text-white">Open home page composition</Link>
              <Link href="/admin/collections" className="rounded-lg border border-[#E7E2DA] px-3.5 py-2 text-xs font-semibold text-[#1C1917]">Open Rows</Link>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Heritage Map */}
        <TabsContent value="map" className="mt-0">
          <Map />
        </TabsContent>

        {/* Tab 4: BTS Tape */}
        <TabsContent value="bts" className="mt-0">
          <BtsTape />
        </TabsContent>

        {/* Tab 5: Couple Reviews */}
        <TabsContent value="reviews" className="mt-0">
          <Review />
        </TabsContent>
      </Tabs>
    </div>
  );
}
