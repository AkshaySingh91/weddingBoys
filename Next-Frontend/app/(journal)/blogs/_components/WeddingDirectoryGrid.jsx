'use client';

import Link from 'next/link';
import {
  Sparkle,
  ArrowRight,
  VideoCamera,
  Buildings,
  TShirt,
  Scissors,
  CalendarCheck,
  Flower,
  InstagramLogo,
} from '@phosphor-icons/react';

function getVendorIcon(role = '') {
  const r = (role || '').toLowerCase();
  if (r.includes('film') || r.includes('cinema') || r.includes('video')) return VideoCamera;
  if (r.includes('venue') || r.includes('hotel') || r.includes('palace') || r.includes('resort')) return Buildings;
  if (r.includes('bridal') || r.includes('bride') || r.includes('lehenga') || r.includes('couture')) return TShirt;
  if (r.includes('groom') || r.includes('sherwani') || r.includes('suit') || r.includes('safa')) return Scissors;
  if (r.includes('plan') || r.includes('event') || r.includes('manage') || r.includes('coordinator')) return CalendarCheck;
  if (r.includes('floral') || r.includes('decor') || r.includes('flower')) return Flower;
  return Sparkle;
}

export default function WeddingDirectoryGrid({ vendorCredits = [] }) {
  if (!vendorCredits || vendorCredits.length === 0) return null; // Gracefully collapse if editor didn't add vendors

  const vendors = vendorCredits.map((vc) => ({
    ...vc,
    icon: getVendorIcon(vc.role),
  }));

  return (
    <section aria-label="Curated Wedding Directory" className="my-10 sm:my-14 font-sans">
      {/* Directory Section Header (prompt-2.png) */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E5DCD3] mb-5 sm:mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.2em] text-[#FF5353] uppercase">
          <Sparkle size={13} weight="fill" />
          <span>The Curated Wedding Directory</span>
        </div>

        <Link
          href="/blogs"
          className="text-xs font-medium text-[#74583E] hover:text-[#FF5353] transition-colors inline-flex items-center gap-1"
        >
          <span>View All Vendors</span>
          <ArrowRight size={12} weight="bold" />
        </Link>
      </div>

      {/* 6-Card Interactive Grid (3 cols x 2 rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {vendors.map((vendor) => {
          const Icon = vendor.icon || Buildings;
          return (
            <a
              key={vendor.role}
              href={vendor.url || '#'}
              target={vendor.url?.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-[#E5DCD3] bg-white shadow-sm hover:shadow-md hover:border-[#FF5353]/40 transition-all duration-300"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FCEEE6] border border-[#E5BDA7]/50 flex items-center justify-center text-[#FF5353] group-hover:bg-[#FF5353] group-hover:text-white transition-colors shrink-0 shadow-sm">
                  <Icon size={18} weight="fill" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#74583E] block truncate">
                    {vendor.role}
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-[#5E2B17] group-hover:text-[#FF5353] transition-colors block truncate mt-0.5">
                    {vendor.name}
                  </span>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {vendor.instagram && (
                  <span
                    title="Instagram Profile"
                    className="p-1 rounded-full text-[#74583E] hover:text-[#FF5353] transition-colors"
                  >
                    <InstagramLogo size={15} />
                  </span>
                )}
                <span className="text-[#74583E] group-hover:text-[#FF5353] group-hover:translate-x-1 transition-all">
                  <ArrowRight size={13} weight="bold" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
