'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Heart,
  PinterestLogo,
  WhatsappLogo,
  TwitterLogo,
  InstagramLogo,
  Link as LinkIcon,
  Check,
} from '@phosphor-icons/react';

import { toggleBlogLike } from '@/lib/blogApi.js';

export default function ArticleEngagementBar({
  postSlug = '',
  initialLoves = 0,
  authorName = 'The Wedding Boys',
  authorRole = 'Lead Cinematographer',
  authorAvatar = '',
  shareUrl = '',
}) {
  const [loves, setLoves] = useState(initialLoves);
  const [hasLoved, setHasLoved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = `twb_liked_${postSlug || 'post'}`;

  // Read saved like state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'true') {
        setHasLoved(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  const handleLoveClick = async () => {
    const nextLoved = !hasLoved;
    setHasLoved(nextLoved);
    setLoves((prev) => (nextLoved ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextLoved) {
        localStorage.setItem(storageKey, 'true');
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {}

    if (postSlug) {
      const res = await toggleBlogLike(postSlug, { decrement: !nextLoved });
      if (res?.likeCount !== undefined) {
        setLoves(res.likeCount);
      }
    }
  };

  const handleCopy = () => {
    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-10 sm:my-14 py-4 sm:py-5 px-4 sm:px-6 rounded-2xl border border-[#E5DCD3] bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 font-sans min-w-0">
      {/* 1. Left: Interactive Loves Counter (prompt-2.png: 148 Loves) */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={handleLoveClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
            hasLoved
              ? 'bg-[#FF5353] text-white shadow-sm scale-102'
              : 'bg-[#FCEEE6] text-[#FF5353] hover:bg-[#FF5353] hover:text-white border border-[#E5BDA7]/60'
          }`}
          aria-label="Love this feature story"
        >
          <Heart size={16} weight={hasLoved ? 'fill' : 'bold'} />
          <span>{loves} Loves</span>
        </button>

        {/*
          2. Middle: Social Sharing Icons (prompt-2.png)

          Wraps. On a 360px phone the loves button and six share targets came to
          382px on one unwrapping line, which pushed the whole Cinematic article
          sideways — the only horizontal overflow left on the site.
        */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[#74583E]">
          <span className="text-xs font-semibold text-[#5E2B17] mr-1 hidden sm:inline">
            Share:
          </span>

          {/* Pinterest */}
          <a
            href="https://pinterest.com/pin/create/button/"
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#E5DCD3] hover:bg-[#E60023] hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Share on Pinterest"
          >
            <PinterestLogo size={15} weight="fill" />
          </a>

          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl || '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#E5DCD3] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Share on WhatsApp"
          >
            <WhatsappLogo size={15} weight="fill" />
          </a>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl || '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#E5DCD3] hover:bg-black hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Share on X"
          >
            <TwitterLogo size={15} weight="fill" />
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#E5DCD3] hover:bg-[#E1306C] hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Instagram Profile"
          >
            <InstagramLogo size={15} weight="fill" />
          </a>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E5DCD3] text-[#74583E] hover:border-[#FF5353]/50 text-xs font-medium transition-all cursor-pointer"
            aria-label="Copy article link"
          >
            {copied ? (
              <>
                <Check size={13} weight="bold" className="text-emerald-600" />
                <span className="text-emerald-600 font-semibold text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon size={13} weight="bold" />
                <span className="text-[11px]">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Right: Author Card with Follow Button (prompt-2.png) */}
      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5DCD3]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#FCEEE6] border border-[#E5BDA7]/50 flex items-center justify-center text-[#5E2B17] font-serif font-bold text-xs shrink-0 overflow-hidden shadow-sm">
            <span>A</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#5E2B17] leading-tight truncate">
              {authorName}
            </p>
            <p className="text-[10px] text-[#74583E] tracking-wider truncate">
              {authorRole}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFollowing((prev) => !prev)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-sm ${
            isFollowing
              ? 'bg-[#5E2B17] text-white'
              : 'bg-white border border-[#E5DCD3] text-[#5E2B17] hover:border-[#FF5353] hover:text-[#FF5353]'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
}
