'use client';

import Link from 'next/link';
import {
  Sparkle,
  ArrowRight,
  InstagramLogo,
  YoutubeLogo,
  FacebookLogo,
  TwitterLogo
} from '@phosphor-icons/react';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';

export default function Footer() {
  const { studioSocials } = useStudioDetails();
  return (
    <footer className="relative w-full text-[#2F2F2F] font-sans pt-6 mt-16">
      {/* Bi-Weekly Dispatch Newsletter Card */}
      <div className="px-6 sm:px-10 mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDF3EC] via-[#FFF5EE] to-[#FCEEE6] border border-[#E5DCD3] py-7 sm:py-8 px-6 sm:px-10 shadow-sm max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-[0.2em] text-accent-ink uppercase">
                <Sparkle size={11} weight="fill" />
                <span>The Wedding Vachan Journal</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#5E2B17] leading-tight">
                Cinematic Love Stories, In The Journal
              </h3>
              <p className="text-xs text-[#74583E] max-w-md leading-relaxed">
                Explore real wedding films, destination guides, and stories from behind the lens.
              </p>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-5">
              <Link href="/blogs" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-[#E04242]">
                Browse wedding stories <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Footer (Clean Mahogany Editorial) */}
      <div className="bg-[#2A160F] text-[#FAF8F5] pt-12 pb-8 border-t border-[#5E2B17]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Col 1: Studio Identity */}
            <div className="space-y-3 lg:col-span-2">
              <div>
                <span className="font-display text-base font-bold tracking-[0.16em] text-white block">
                  THE WEDDING VACHAN
                </span>
                <span className="text-[8px] font-mono tracking-[0.25em] text-[#FAD7A0] uppercase block mt-0.5">
                  Cinematography Studio
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed max-w-sm">
                India’s premier wedding cinematography studio, crafting emotionally charged, motion-picture heirlooms across royal palaces, coastal sanctuaries, and worldwide destinations.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2.5 text-stone-300">
                {studioSocials?.instagram && (
                  <a
                    href={studioSocials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#4E2818] rounded-full hover:text-accent-ink hover:bg-[#5E2B17] transition-all"
                    aria-label="Instagram"
                  >
                    <InstagramLogo size={15} />
                  </a>
                )}
                {studioSocials?.youtube && (
                  <a
                    href={studioSocials.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#4E2818] rounded-full hover:text-accent-ink hover:bg-[#5E2B17] transition-all"
                    aria-label="YouTube"
                  >
                    <YoutubeLogo size={15} />
                  </a>
                )}
                {studioSocials?.facebook && (
                  <a
                    href={studioSocials.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#4E2818] rounded-full hover:text-accent-ink hover:bg-[#5E2B17] transition-all"
                    aria-label="Facebook"
                  >
                    <FacebookLogo size={15} weight="fill" />
                  </a>
                )}
                {studioSocials?.x && (
                  <a
                    href={studioSocials.x}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#4E2818] rounded-full hover:text-accent-ink hover:bg-[#5E2B17] transition-all"
                    aria-label="Twitter"
                  >
                    <TwitterLogo size={15} weight="fill" />
                  </a>
                )}
              </div>
            </div>

            {/* Col 2: Explore */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#FAD7A0]">
                Explore
              </h4>
              <ul className="space-y-2 text-xs text-stone-300">
                <li>
                  <Link href="/" className="hover:text-accent-ink transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/films" className="hover:text-accent-ink transition-colors">
                    Films
                  </Link>
                </li>
                <li>
                  <Link href="/photos" className="hover:text-accent-ink transition-colors">
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/team" className="hover:text-accent-ink transition-colors">
                    Our Team
                  </Link>
                </li>
                <li>
                  <Link href="/about-us" className="hover:text-accent-ink transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/dharaa-event-management" className="hover:text-accent-ink transition-colors">
                    Dharaa Events
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Journal Stories & Destinations */}
            <div className="space-y-8">
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#FAD7A0]">
                  Editorial Journal
                </h4>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <Link href="/blogs" className="hover:text-accent-ink transition-colors">
                      All Published Stories
                    </Link>
                  </li>
                  <li>
                    <Link href="/blogs?category=Real+Weddings" className="hover:text-accent-ink transition-colors">
                      Real Wedding Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/blogs?category=Planning+Guides" className="hover:text-accent-ink transition-colors">
                      Destination Planning Guides
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#FAD7A0]">
                  Royal Destinations
                </h4>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <Link href="/weddings/udaipur" className="hover:text-accent-ink transition-colors">
                      Udaipur Palace Celebrations
                    </Link>
                  </li>
                  <li>
                    <Link href="/weddings/jaipur" className="hover:text-accent-ink transition-colors">
                      Jaipur Heritage Haveli
                    </Link>
                  </li>
                  <li>
                    <Link href="/weddings/goa" className="hover:text-accent-ink transition-colors">
                      Goa Coastal Nuptials
                    </Link>
                  </li>
                  <li>
                    <Link href="/varanasi" className="hover:text-accent-ink transition-colors">
                      Varanasi Sacred Ghats
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Col 4: Studio Inquiries */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#FAD7A0]">
                Studio Inquiries
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                We accept a strictly limited number of cinematic commissions each wedding season to guarantee uncompromising artistry.
              </p>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-accent hover:bg-[#E04242] text-xs font-semibold text-white transition-all shadow-sm"
                >
                  <span>Inquire for Your Date</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="mt-12 pt-6 border-t border-[#5E2B17]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[10px] text-stone-400">
            <p>© {new Date().getFullYear()} The Wedding Vachan Studio. All rights reserved.</p>
            <p className="font-display italic text-[#FAD7A0]/80 text-center md:text-right">
              Dedicated to the poetry, cinema, and enduring emotion of love.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
