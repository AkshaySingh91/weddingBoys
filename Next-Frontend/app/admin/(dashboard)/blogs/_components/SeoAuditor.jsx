'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import {
  CheckCircle,
  WarningCircle,
  XCircle,
  Sparkle,
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  FileText,
  Image as ImageIcon,
  TextH,
} from '@phosphor-icons/react';

// Helper: recursively extract text and nodes from Tiptap AST
function extractNodesFromAst(node, collector = { text: [], headings: [], images: [], paragraphs: [] }) {
  if (!node) return collector;

  if (node.type === 'heading') {
    const headingText = (node.content || []).map(c => c.text || '').join('');
    collector.headings.push({
      level: node.attrs?.level || 2,
      text: headingText,
    });
  } else if (node.type === 'paragraph') {
    const pText = (node.content || []).map(c => c.text || '').join('');
    if (pText.trim()) collector.paragraphs.push(pText.trim());
  } else if (node.type === 'image') {
    collector.images.push({
      alt: node.attrs?.alt || '',
      caption: node.attrs?.caption || '',
    });
  }

  if (node.text) {
    collector.text.push(node.text);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      extractNodesFromAst(child, collector);
    }
  }

  return collector;
}

export default function SeoAuditor({ form, onScoreChange }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'issues' | 'passed'

  const onScoreChangeRef = useRef(onScoreChange);
  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
  });

  const lastScoreRef = useRef(null);

  // Extract content metrics from either contentJson or fallback plain text
  const auditData = useMemo(() => {
    const rawNodes = form.contentJson
      ? extractNodesFromAst(form.contentJson)
      : { text: [], headings: [], images: [], paragraphs: [] };

    const bodyText = rawNodes.text.join(' ') || (form.content || '').replace(/<[^>]*>/g, ' ');
    const words = bodyText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const focusKw = (form.focusKeyword || '').trim().toLowerCase();
    const effectiveTitle = (form.metaTitle || form.title || '').trim();
    const effectiveDesc = (form.excerpt || form.metaDescription || '').trim();

    // Check heading sequence
    let headingOrderValid = true;
    let hasH2 = false;
    for (let i = 0; i < rawNodes.headings.length; i++) {
      const h = rawNodes.headings[i];
      if (h.level === 2) hasH2 = true;
      if (h.level === 3 && !hasH2) {
        headingOrderValid = false; // H3 appears before any H2
      }
    }

    // Check image alt coverage
    const totalImages = rawNodes.images.length + (form.coverImage ? 1 : 0);
    const imagesWithAlt = rawNodes.images.filter(img => Boolean(img.alt?.trim() || img.caption?.trim())).length
      + (form.coverImage ? 1 : 0);
    const altCoveragePct = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100;

    // First 150 words of body text
    const introText = words.slice(0, 150).join(' ').toLowerCase();

    // Headings text
    const allHeadingsText = rawNodes.headings.map(h => h.text.toLowerCase()).join(' ');

    // Rule checks
    const rules = [
      // 1. Focus Keyword defined
      {
        id: 'kw_defined',
        label: 'Focus Keyword Defined',
        category: 'SEO',
        passed: Boolean(focusKw),
        warn: false,
        score: focusKw ? 8 : 0,
        maxScore: 8,
        message: focusKw
          ? `Target keyword set to "${focusKw}"`
          : 'Define a focus keyword to evaluate target search rankings',
      },
      // 2. Keyword in Title
      {
        id: 'kw_in_title',
        label: 'Keyword in Title',
        category: 'SEO',
        passed: focusKw ? effectiveTitle.toLowerCase().includes(focusKw) : false,
        warn: false,
        score: focusKw && effectiveTitle.toLowerCase().includes(focusKw) ? 10 : 0,
        maxScore: 10,
        message: focusKw
          ? (effectiveTitle.toLowerCase().includes(focusKw)
            ? 'Focus keyword is present in the headline'
            : 'Include your focus keyword inside the story title')
          : 'Requires focus keyword',
      },
      // 3. Keyword in Excerpt / Meta Description
      {
        id: 'kw_in_desc',
        label: 'Keyword in Meta Description',
        category: 'SEO',
        passed: focusKw ? effectiveDesc.toLowerCase().includes(focusKw) : false,
        warn: false,
        score: focusKw && effectiveDesc.toLowerCase().includes(focusKw) ? 9 : 0,
        maxScore: 9,
        message: focusKw
          ? (effectiveDesc.toLowerCase().includes(focusKw)
            ? 'Focus keyword appears in the search snippet excerpt'
            : 'Add your focus keyword to the meta description')
          : 'Requires focus keyword',
      },
      // 4. Keyword in Early Content
      {
        id: 'kw_in_intro',
        label: 'Keyword in Content Introduction',
        category: 'SEO',
        passed: focusKw ? introText.includes(focusKw) : false,
        warn: false,
        score: focusKw && introText.includes(focusKw) ? 8 : 0,
        maxScore: 8,
        message: focusKw
          ? (introText.includes(focusKw)
            ? 'Keyword appears in the first 150 words of the story'
            : 'Introduce your focus keyword within the opening paragraphs')
          : 'Requires focus keyword',
      },
      // 5. Keyword in Headings
      {
        id: 'kw_in_headings',
        label: 'Keyword in H2 / H3 Headings',
        category: 'SEO',
        passed: focusKw ? allHeadingsText.includes(focusKw) : false,
        warn: false,
        score: focusKw && allHeadingsText.includes(focusKw) ? 8 : 0,
        maxScore: 8,
        message: focusKw
          ? (allHeadingsText.includes(focusKw)
            ? 'Focus keyword is reinforced in subheadings'
            : 'Use your focus keyword or close synonym in at least one H2 heading')
          : 'Requires focus keyword',
      },
      // 6. Title Length
      {
        id: 'title_length',
        label: 'Title Length (40–60 chars)',
        category: 'Snippet',
        passed: effectiveTitle.length >= 40 && effectiveTitle.length <= 60,
        warn: (effectiveTitle.length >= 30 && effectiveTitle.length < 40) || (effectiveTitle.length > 60 && effectiveTitle.length <= 70),
        score: (effectiveTitle.length >= 40 && effectiveTitle.length <= 60)
          ? 10
          : (effectiveTitle.length >= 30 && effectiveTitle.length <= 70 ? 6 : 0),
        maxScore: 10,
        message: `${effectiveTitle.length} chars (Recommended: 40–60 chars for Google search card display)`,
      },
      // 7. Meta Description Length
      {
        id: 'desc_length',
        label: 'Description Length (120–160 chars)',
        category: 'Snippet',
        passed: effectiveDesc.length >= 120 && effectiveDesc.length <= 160,
        warn: (effectiveDesc.length >= 90 && effectiveDesc.length < 120) || (effectiveDesc.length > 160 && effectiveDesc.length <= 180),
        score: (effectiveDesc.length >= 120 && effectiveDesc.length <= 160)
          ? 12
          : (effectiveDesc.length >= 90 && effectiveDesc.length <= 180 ? 7 : 0),
        maxScore: 12,
        message: `${effectiveDesc.length} chars (Optimal: 120–160 characters for complete SERP snippet)`,
      },
      // 8. Word Count & Content Depth
      {
        id: 'word_count',
        label: 'Story Depth (≥ 400 words)',
        category: 'Readability',
        passed: wordCount >= 400,
        warn: wordCount >= 250 && wordCount < 400,
        score: wordCount >= 400 ? 12 : (wordCount >= 250 ? 6 : 0),
        maxScore: 12,
        message: `${wordCount} words (${wordCount >= 600 ? 'Comprehensive depth' : wordCount >= 400 ? 'Good editorial length' : 'Aim for at least 400 words for search indexation'})`,
      },
      // 9. Heading Structure
      {
        id: 'heading_order',
        label: 'Logical Heading Order (H2 → H3)',
        category: 'Readability',
        passed: hasH2 && headingOrderValid,
        warn: !hasH2 && rawNodes.headings.length === 0,
        score: hasH2 && headingOrderValid ? 8 : (rawNodes.headings.length === 0 ? 3 : 0),
        maxScore: 8,
        message: hasH2 && headingOrderValid
          ? 'Proper hierarchical section headings'
          : (!hasH2 ? 'Add H2 section headings to divide the story into readable chapters' : 'Ensure H2 precedes H3 headings'),
      },
      // 10. Image Alt Coverage & Visual Density
      {
        id: 'alt_coverage',
        label: 'Visual Media & Alt Attributes',
        category: 'Accessibility',
        passed: altCoveragePct >= 80 && totalImages >= 1,
        warn: totalImages >= 1 && altCoveragePct < 80,
        score: (altCoveragePct >= 80 && totalImages >= 1) ? 8 : (totalImages >= 1 ? 4 : 0),
        maxScore: 8,
        message: totalImages > 0
          ? `${altCoveragePct}% alt text coverage across ${totalImages} image(s)`
          : 'Add photographs with descriptive alt text for visual search ranking',
      },
      // 11. Visual Density (at least 1 image or video per 350 words)
      {
        id: 'visual_density',
        label: 'Visual Rhythm & Pacing',
        category: 'Readability',
        passed: wordCount < 300 || (totalImages >= Math.floor(wordCount / 350)),
        warn: totalImages < Math.floor(wordCount / 350),
        score: (wordCount < 300 || totalImages >= Math.floor(wordCount / 350)) ? 7 : 3,
        maxScore: 7,
        message: `Visual pacing: ${totalImages} visual block(s) for ${wordCount} words`,
      },
    ];

    const currentTotal = rules.reduce((sum, r) => sum + r.score, 0);
    const maxTotal = rules.reduce((sum, r) => sum + r.maxScore, 0);
    const normalizedScore = Math.round((currentTotal / maxTotal) * 100);

    return {
      score: normalizedScore,
      rules,
      wordCount,
      totalImages,
    };
  }, [
    form?.title,
    form?.focusKeyword,
    form?.excerpt,
    form?.metaTitle,
    form?.metaDescription,
    form?.content,
    form?.contentJson,
  ]);

  // Sync score with parent form when changed
  useEffect(() => {
    if (typeof onScoreChangeRef.current === 'function' && auditData.score !== lastScoreRef.current) {
      lastScoreRef.current = auditData.score;
      onScoreChangeRef.current(auditData.score);
    }
  }, [auditData.score]);

  const passedCount = auditData.rules.filter(r => r.passed).length;
  const issuesCount = auditData.rules.filter(r => !r.passed).length;

  const filteredRules = auditData.rules.filter(r => {
    if (filter === 'passed') return r.passed;
    if (filter === 'issues') return !r.passed;
    return true;
  });

  // Score color grading
  const getScoreTheme = (score) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        bar: 'bg-emerald-600',
        label: 'Excellent',
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        bar: 'bg-[#C29555]',
        label: 'Good — Needs Polish',
      };
    }
    return {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-600',
      label: 'Needs Optimization',
    };
  };

  const theme = getScoreTheme(auditData.score);

  return (
    <div className="rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm">
      {/* Header with Score Ring & Expand Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8C532B]/10 text-[#8C532B]">
            <Sparkle size={18} weight="bold" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
              SEO & Readability Auditor
            </h3>
            <span className="text-[11px] font-medium text-stone-500">
              Live algorithmic content analysis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 ${theme.bg} ${theme.border}`}>
            <span className={`text-xs font-black ${theme.text}`}>
              {auditData.score}%
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${theme.text}`}>
              {theme.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse auditor' : 'Expand auditor'}
          >
            {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress Bar Meter */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full transition-all duration-500 rounded-full ${theme.bar}`}
          style={{ width: `${auditData.score}%` }}
        />
      </div>

      {isExpanded && (
        <div className="mt-4">
          {/* Filter Pills */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${filter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
              >
                All ({auditData.rules.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('issues')}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${filter === 'issues'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
              >
                Issues ({issuesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('passed')}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${filter === 'passed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
              >
                Passed ({passedCount})
              </button>
            </div>

            <div className="text-[11px] font-mono text-stone-400">
              {auditData.wordCount} words
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredRules.map((rule) => {
              const isPass = rule.passed;
              const isWarn = !isPass && rule.warn;
              return (
                <div
                  key={rule.id}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${isPass
                    ? 'border-emerald-100 bg-emerald-50/40'
                    : isWarn
                      ? 'border-amber-100 bg-amber-50/40'
                      : 'border-rose-100 bg-rose-50/40'
                    }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isPass ? (
                      <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                    ) : isWarn ? (
                      <WarningCircle size={15} weight="fill" className="text-amber-600" />
                    ) : (
                      <XCircle size={15} weight="fill" className="text-rose-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-stone-800">
                        {rule.label}
                      </span>
                      <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                        {rule.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">
                      {rule.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
