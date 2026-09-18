/**
 * EnquiryCtaBlock — contextual enquiry CTA with tracked click event.
 */
'use client';

import { ArrowRight } from '@phosphor-icons/react';
import { trackBlogCtaClick } from '@/lib/analytics/tracker.js';

export default function EnquiryCtaBlock({ node, post }) {
  const text = node?.attrs?.text || 'Plan Your Dream Wedding';
  const subtitle = node?.attrs?.subtitle || 'Let\'s bring your vision to life — reach out to our team.';
  const href = node?.attrs?.href || '/contact';

  const handleClick = () => {
    if (post?.slug) {
      trackBlogCtaClick(post.slug);
    }
    // Fire external analytics event if available
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('cta_enquiry_click', { props: { slug: post?.slug } });
    }
  };

  return (
    <section className="my-12 overflow-hidden rounded-2xl bg-gradient-to-br from-studio-ink via-studio-obsidian to-studio-ink p-8 text-center sm:p-12">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-studio-gold">
        The Wedding Boys
      </p>
      <h3 className="font-playfair text-2xl font-bold text-white sm:text-3xl">
        {text}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
        {subtitle}
      </p>
      <a
        href={href}
        onClick={handleClick}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-studio-gold px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-studio-goldDark hover:shadow-xl hover:gap-3"
      >
        Get in Touch
        <ArrowRight size={16} weight="bold" />
      </a>
    </section>
  );
}
