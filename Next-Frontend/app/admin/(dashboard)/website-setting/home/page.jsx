'use client';

import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/admin/components/ui/Tabs.jsx';
import Herobanner from './_components/Herobanner.jsx';
import HeroCarouselManager from './_components/HeroCarouselManager.jsx';
import VideoThumbnail from './_components/VideoThumbnail.jsx';
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
          <VideoThumbnail />
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
