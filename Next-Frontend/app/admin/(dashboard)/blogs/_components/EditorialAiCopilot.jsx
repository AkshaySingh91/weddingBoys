'use client';

import { useState, useMemo } from 'react';
import {
  Sparkle,
  X,
  Check,
  Copy,
  TextT,
  FileText,
  MagnifyingGlass,
  Question,
  ArrowsClockwise,
  Heart,
  LightbulbFilament,
} from '@phosphor-icons/react';

export default function EditorialAiCopilot({ isOpen, onClose, form, onApply }) {
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'excerpt' | 'keywords' | 'faq'
  const [copiedKey, setCopiedKey] = useState(null);
  const [appliedKey, setAppliedKey] = useState(null);

  // Extract clean text from HTML content or AST
  const plainBody = useMemo(() => {
    return (form.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [form.content]);

  const storyTitle = (form.title || 'Untitled Wedding Story').trim();
  const keyword = (form.focusKeyword || form.category || 'Wedding Cinematography').trim();
  const venue = form.venue ? form.venue.trim() : 'Royal Destination Venue';
  const mood = form.mood || 'romantic';

  // Heuristic generation algorithm for metadata
  const generatedMeta = useMemo(() => {
    const kw = keyword.charAt(0).toUpperCase() + keyword.slice(1);

    const titleA = `${storyTitle.slice(0, 38)} | ${kw}`.slice(0, 60);
    const descA = `Experience this breathtaking ${mood} celebration filmed at ${venue}. Timeless wedding cinematography, candid emotion, and fine-art framing by The Wedding Vachan.`.slice(0, 155);

    const titleB = `${kw}: A ${mood.charAt(0).toUpperCase() + mood.slice(1)} Celebration at ${venue}`.slice(0, 58);
    const descB = `Discover intimate ceremony moments and golden-hour portraits from ${storyTitle}. Complete cinematography breakdown and wedding planning guide.`.slice(0, 158);

    const titleC = `${storyTitle.slice(0, 42)} — Film Guide`.slice(0, 56);
    const descC = `An editorial visual narrative capturing authentic rituals and luxury details. Explore cinematography advice and vendor credits for this ${mood} wedding.`.slice(0, 152);

    return [
      {
        id: 'opt_1',
        tag: 'High Search Intent',
        title: titleA,
        description: descA,
      },
      {
        id: 'opt_2',
        tag: 'Editorial & Cinematic',
        title: titleB,
        description: descB,
      },
      {
        id: 'opt_3',
        tag: 'Storyteller & Guide',
        title: titleC,
        description: descC,
      },
    ];
  }, [storyTitle, keyword, venue, mood]);

  // Excerpt suggestions
  const generatedExcerpts = useMemo(() => {
    return [
      {
        id: 'exc_1',
        style: 'Poetic & Cinematic',
        text: `Set against the grandeur of ${venue}, this ${mood} wedding unfolded in a symphony of golden light, raw emotion, and heirloom family traditions captured on cinema lens.`,
      },
      {
        id: 'exc_2',
        style: 'Modern & Atmospheric',
        text: `From twilight pheras to high-energy baraat rhythms, witness how candid moments and bespoke architectural framing brought this ${mood} celebration to life.`,
      },
      {
        id: 'exc_3',
        style: 'Editorial Guide Style',
        text: `An insider glimpse into planning and filming a luxury celebration at ${venue}, featuring photography lighting tips, schedule advice, and authentic storytelling.`,
      },
    ];
  }, [venue, mood]);

  // Secondary keyword expansion
  const generatedKeywords = useMemo(() => {
    const base = [
      `${keyword} guide`,
      `${venue} wedding film`,
      `candid ${mood} wedding cinematography`,
      'luxury destination wedding videographer',
      'golden hour varmala lighting',
      'fine art wedding photography india',
    ];
    return base;
  }, [keyword, venue, mood]);

  // FAQ generator
  const generatedFaqs = useMemo(() => {
    return [
      {
        question: `What was the cinematography approach for filming at ${venue}?`,
        answer: `We utilized multi-camera cinema rigs and gimbal tracking systems to document grand architectural perspectives while preserving candid, non-intrusive family rituals.`,
      },
      {
        question: `How was audio recorded during the vows and ceremony?`,
        answer: `We deployed wind-shielded wireless lavaliers on the couple and priest along with ambient field recorders to capture authentic vows and Vedic mantras in studio clarity.`,
      },
      {
        question: `What lighting conditions work best for this style of wedding?`,
        answer: `Golden-hour sunlight provides the softest tones for couple portraits, transitioning into warm ambient brass lamp and tungsten illumination for night pheras.`,
      },
    ];
  }, [venue]);

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApply = (patch, key) => {
    if (typeof onApply === 'function') {
      onApply(patch);
      setAppliedKey(key);
      setTimeout(() => setAppliedKey(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-gold/30 bg-white shadow-2xl">
        {/* Top Gold Header Rule */}
        <div className="h-1.5 w-full bg-gradient-to-r from-accent via-gold to-accent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge-subtle px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent-ink">
              <Sparkle size={18} weight="bold" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-ink">
                Editorial AI Co-Pilot
              </h2>
              <span className="text-[11px] font-medium text-ink-muted">
                Intelligent metadata drafting &amp; SEO enhancement
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-ink-muted hover:bg-ground-sunk hover:text-ink-secondary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-edge-subtle bg-ground/70 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('meta')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'meta'
                ? 'border-accent text-accent-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <TextT size={14} />
            Title &amp; Meta
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('excerpt')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'excerpt'
                ? 'border-accent text-accent-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileText size={14} />
            Story Excerpts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keywords')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'keywords'
                ? 'border-accent text-accent-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <MagnifyingGlass size={14} />
            Keywords
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'faq'
                ? 'border-accent text-accent-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Question size={14} />
            FAQ Suggestions
          </button>
        </div>

        {/* Content Area */}
        <div className="max-h-[460px] overflow-y-auto p-6 space-y-4">
          {/* TAB 1: Title & Meta Description */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted">
                Calibrated against Google SERP limits (Title ≤ 60 chars, Description ≤ 160 chars) with your focus keyword:
                <strong className="text-ink ml-1">&ldquo;{keyword}&rdquo;</strong>.
              </p>

              {generatedMeta.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-edge-subtle bg-ground/50 p-4 space-y-2 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent-ink uppercase tracking-wider">
                      {item.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleApply(
                          { metaTitle: item.title, metaDescription: item.description },
                          item.id
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        appliedKey === item.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-ink text-white hover:bg-ink'
                      }`}
                    >
                      {appliedKey === item.id ? (
                        <>
                          <Check size={12} weight="bold" /> Applied
                        </>
                      ) : (
                        'Apply to Story'
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Title ({item.title.length}/60)
                    </label>
                    <p className="text-xs font-semibold text-ink">{item.title}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Description ({item.description.length}/160)
                    </label>
                    <p className="text-xs text-ink-secondary leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Story Excerpts */}
          {activeTab === 'excerpt' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted">
                Poetic, luxury narrative teasers styled for your selected mood:
                <strong className="text-ink ml-1 capitalize">&ldquo;{mood}&rdquo;</strong>.
              </p>

              {generatedExcerpts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-edge-subtle bg-ground/50 p-4 space-y-2.5 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent-ink">{item.style}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.text, item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-edge-subtle bg-white px-2 py-1 text-xs text-ink-secondary hover:bg-ground cursor-pointer"
                      >
                        {copiedKey === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        {copiedKey === item.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApply({ excerpt: item.text }, item.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          appliedKey === item.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-ink text-white hover:bg-ink'
                        }`}
                      >
                        {appliedKey === item.id ? (
                          <>
                            <Check size={12} weight="bold" /> Applied
                          </>
                        ) : (
                          'Apply as Excerpt'
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed font-serif italic">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Secondary Keywords */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted">
                High-volume search entities and long-tail destination queries:
              </p>

              <div className="flex flex-wrap gap-2">
                {generatedKeywords.map((kw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-xl border border-edge-subtle bg-ground px-3 py-1.5 text-xs text-ink"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const existing = form.keywords || [];
                        if (!existing.includes(kw)) {
                          handleApply({ keywords: [...existing, kw] }, `kw_${i}`);
                        }
                      }}
                      className="ml-1 rounded-lg p-0.5 text-ink-muted hover:text-accent-ink cursor-pointer"
                      title="Add to post keywords"
                    >
                      {appliedKey === `kw_${i}` ? <Check size={12} className="text-emerald-600" /> : '+'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FAQ Suggestions */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted">
                Structured questions &amp; answers customized for {venue}:
              </p>

              <div className="space-y-3">
                {generatedFaqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-edge-subtle bg-ground/60 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-ink">{faq.question}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const existing = form.faq || [];
                          handleApply({ faq: [...existing, faq] }, `faq_${idx}`);
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                          appliedKey === `faq_${idx}`
                            ? 'bg-emerald-600 text-white'
                            : 'bg-accent text-white hover:bg-accent-hover'
                        }`}
                      >
                        {appliedKey === `faq_${idx}` ? <Check size={11} /> : '+ Add to Story'}
                      </button>
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-edge-subtle bg-ground px-6 py-3 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <LightbulbFilament size={14} className="text-gold-strong" />
            <span>AI suggestions are tailored to your story title, mood, and venue.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
