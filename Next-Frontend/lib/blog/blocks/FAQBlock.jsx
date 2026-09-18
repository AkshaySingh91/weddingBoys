/**
 * FAQBlock — FAQ pairs as an accessible accordion.
 *
 * Outputs semantic markup for FAQPage JSON-LD, which the article page also
 * emits — the two must keep listing the same questions, so both read `post.faq`.
 *
 * The first question opens by default. A stack of identical closed bars gives
 * the reader nothing to judge whether the section is worth opening; showing one
 * answer says what kind of answers these are.
 */
'use client';

import { useState } from 'react';
import { Plus, Minus } from '@phosphor-icons/react';

export default function FAQBlock({ node, post }) {
  const items = (node?.attrs?.items && node.attrs.items.length > 0)
    ? node.attrs.items
    : (post?.faq || []);
  const [openIdx, setOpenIdx] = useState(0);

  if (items.length === 0) return null;

  return (
    <section className="faq-block" itemScope itemType="https://schema.org/FAQPage">
      <h2 className="mb-4 font-playfair text-2xl font-bold text-studio-ink">FAQs</h2>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
              /*
                The open item is marked by a coral edge and a white ground; the
                closed ones sit flat on the page. The border is always present,
                just transparent when closed, so opening one does not shift the
                row sideways by its width.
              */
              className={`overflow-hidden rounded-xl border-l-[3px] transition-colors ${
                isOpen
                  ? 'border-l-studio-coral bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                  : 'border-l-transparent bg-studio-card'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left"
                aria-expanded={isOpen}
              >
                <span itemProp="name" className="text-[14px] font-semibold text-studio-ink">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isOpen
                      ? 'border-studio-coral text-studio-coral'
                      : 'border-studio-borderStrong text-studio-inkMuted'
                  }`}
                >
                  {isOpen ? <Minus size={11} weight="bold" /> : <Plus size={11} weight="bold" />}
                </span>
              </button>

              <div
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
                className={`grid transition-all duration-200 ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                {/*
                  `grid-rows-[0fr→1fr]` rather than a max-height guess: a
                  max-h-96 clipped any answer longer than 384px, and picking a
                  larger number only moves where it clips. This animates to the
                  content's real height whatever that is.
                */}
                <div className="overflow-hidden">
                  <div itemProp="text" className="px-4 pb-4 text-[13px] leading-relaxed text-studio-inkSecondary">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
