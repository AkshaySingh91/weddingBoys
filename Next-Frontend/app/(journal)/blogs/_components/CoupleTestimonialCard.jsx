'use client';

import Image from 'next/image';
import { Quotes } from '@phosphor-icons/react';

export default function CoupleTestimonialCard({
  quote = '',
  byline = '',
}) {
  if (!quote || !quote.trim()) return null; // Gracefully collapse if editor didn't add testimonial

  const formattedQuote = quote.startsWith('“') || quote.startsWith('"') ? quote : `“${quote}”`;
  const formattedByline = byline?.trim() ? (byline.startsWith('—') ? byline : `— ${byline}`) : '— Bride & Groom';
  return (
    <section aria-label="Couple Testimonial" className="my-10 sm:my-14">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FDF3EC] via-[#FFF5EE] to-[#FCEEE6] border border-[#E5DCD3] p-6 sm:p-8 md:p-10 shadow-sm">
        {/* Right Side Botanical Floral Watermark (prompt-2.png) */}
        <div className="pointer-events-none absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-44 sm:w-56 h-44 sm:h-56 select-none opacity-80">
          <Image
            src="/Asset/journal/thumbnail-right-side-flower.png"
            alt=""
            fill
            className="object-contain object-right"
          />
        </div>

        {/* Right Vertical Editorial Micro-Tag */}
        <div className="pointer-events-none absolute right-6 sm:right-8 bottom-6 sm:bottom-8 text-right hidden sm:block select-none z-10">
          <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-[#74583E] leading-relaxed">
            REAL<br />PEOPLE<br />REAL<br />EMOTIONS
          </p>
        </div>

        {/* Testimonial Content */}
        <div className="relative z-10 max-w-2xl sm:max-w-3xl space-y-4">
          {/* Coral Quotation Mark Icon */}
          <div className="text-[#FF5353] opacity-90">
            <Quotes size={36} weight="fill" />
          </div>

          {/* Emotional Quote in Playfair Display */}
          <blockquote className="font-playfair font-serif text-lg sm:text-xl md:text-[22px] italic text-[#5E2B17] leading-relaxed">
            {formattedQuote}
          </blockquote>

          {/* Couple Byline */}
          <p className="text-xs sm:text-[13px] font-sans font-semibold tracking-wide text-[#74583E] pt-1">
            {formattedByline}
          </p>
        </div>
      </div>
    </section>
  );
}
