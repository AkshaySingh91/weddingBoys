'use client';

/**
 * ArticleRail — the column beside the article.
 *
 * Six cards, in the reference design's order: On This Page → Personal
 * Consultation → Related Guides → Share → Author → Studio quote.
 *
 * Three things about it are deliberate.
 *
 * It is on the RIGHT. The contents list used to sit left at a fixed 240px, which
 * put a column of links between the page edge and the first word of every
 * paragraph — the reader's eye had to start past it on every line.
 *
 * The contents card only exists when the article HAS headings. An article
 * written as a photo sequence has none, and a card reading "On this page" above
 * nothing is worse than no card. The rail still renders, because the other cards
 * do not depend on headings.
 *
 * Share and author live HERE and nowhere else. They used to be repeated in the
 * article footer, so a reader met the same author card twice in one scroll.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Info, ArrowRight, Link2, Check } from 'lucide-react';

const coverOf = (post) =>
    typeof post?.coverImage === 'string'
        ? post.coverImage
        : post?.coverImage?.cdnUrl || post?.coverImage?.publicUrl || post?.coverImage?.url || null;

const avatarOf = (author) =>
    author?.avatarMedia?.cdnUrl || author?.avatarMedia?.publicUrl || author?.avatarMedia?.url
    || author?.avatar?.url || author?.avatarUrl || null;

/* ── Card shells ────────────────────────────────────────────────────────── */

/** White panel with a Playfair title — the reference's default card. */
function Card({ title, action, children, className = '' }) {
    return (
        <section className={`rounded-2xl border border-studio-border bg-white p-5 ${className}`}>
            {title && (
                <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h2 className="font-playfair text-[17px] font-bold text-studio-ink">{title}</h2>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

/* ── 1. On this page ────────────────────────────────────────────────────── */

function ContentsCard({ toc }) {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        if (!toc?.length) return undefined;
        const headings = toc.map((h) => document.getElementById(h.id)).filter(Boolean);
        if (!headings.length) return undefined;

        // The bottom margin keeps "current" from flipping to the next section the
        // instant its first pixel appears — it has to reach the upper third of
        // the viewport before it counts as where the reader is.
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length) setActiveId(visible[0].target.id);
            },
            { rootMargin: '0px 0px -70% 0px', threshold: 0.1 },
        );
        headings.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, [toc]);

    const go = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (!el) return;
        window.history.replaceState(null, '', `#${id}`);
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (!toc?.length) return null;

    /*
      Numbering is computed up front, not accumulated inside the map. The React
      Compiler rejects a counter mutated during render — it cannot guarantee the
      same value on a re-render — and it is right to: only top-level sections are
      numbered, so the count depends on every heading before this one.
    */
    const numbered = [];
    let n = 0;
    for (const h of toc) {
        const top = h.level <= 2;
        if (top) n += 1;
        numbered.push({ ...h, top, no: top ? n : null });
    }

    return (
        <section className="rounded-2xl border border-studio-border bg-white p-5">
            <h2 className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-studio-inkMuted">
                On this page
            </h2>
            <nav aria-label="Table of contents">
                <ul className="space-y-2.5">
                    {numbered.map((h) => {
                        const active = activeId === h.id;
                        return (
                            <li key={h.id} className={h.top ? '' : 'pl-4'}>
                                <a
                                    href={`#${h.id}`}
                                    onClick={(e) => go(e, h.id)}
                                    aria-current={active ? 'true' : undefined}
                                    className="group relative flex gap-2 text-[13px] leading-snug"
                                >
                                    {/* The current section is marked by a dot in the
                                        gutter, not a filled bar — the reference keeps
                                        the list flat so the numbers stay aligned. */}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-studio-coral transition-opacity ${
                                            active ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    />
                                    {h.top && (
                                        <span className={`shrink-0 tabular-nums ${
                                            active ? 'font-semibold text-studio-coral' : 'text-studio-inkMuted'
                                        }`}>
                                            {h.no}.
                                        </span>
                                    )}
                                    <span className={`min-w-0 transition-colors ${
                                        active
                                            ? 'font-semibold text-studio-coral'
                                            : 'text-studio-inkSecondary group-hover:text-studio-ink'
                                    }`}>
                                        {h.text}
                                    </span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </section>
    );
}

/* ── 2. Personal consultation ───────────────────────────────────────────── */

function CtaCard() {
    const year = new Date().getFullYear() + 1;
    return (
        <section className="relative overflow-hidden rounded-2xl border border-studio-coral/15 bg-studio-blush p-5">
            {/* A botanical watermark, clipped by the card. Decorative only. */}
            <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                className="pointer-events-none absolute -right-4 -top-3 h-28 w-28 text-studio-coral/10"
            >
                <path
                    fill="currentColor"
                    d="M50 4c14 18 22 34 22 48 0 16-10 26-22 26S28 68 28 52C28 38 36 22 50 4zm0 14c-9 13-14 24-14 34 0 11 6 18 14 18s14-7 14-18c0-10-5-21-14-34z"
                />
                <path fill="currentColor" d="M48 60h4v36h-4z" />
            </svg>

            <p className="relative mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-studio-terracotta">
                Personal consultation
            </p>
            <h2 className="relative mb-2 font-playfair text-xl font-bold leading-snug text-studio-ink">
                Planning a {year} destination wedding?
            </h2>
            <p className="relative mb-4 text-[13px] leading-relaxed text-studio-inkSecondary">
                Speak directly with our technical director about venue lighting and camera permits.
            </p>
            <Link
                href="/contact"
                className="relative inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-studio-coral px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-studio-coralDark"
            >
                Book Creative Consultation
                <ArrowRight size={14} />
            </Link>
            <p className="relative mt-3 flex items-center gap-1.5 text-[11px] text-studio-inkMuted">
                <Info size={12} className="shrink-0" />
                No obligations. Just expert advice.
            </p>
        </section>
    );
}

/* ── 3. Related guides ──────────────────────────────────────────────────── */

function RelatedCard({ posts }) {
    if (!posts?.length) return null;
    return (
        <Card
            title="Related Guides"
            action={
                <Link href="/blogs" className="shrink-0 text-[11px] font-semibold text-studio-terracotta hover:underline">
                    View All →
                </Link>
            }
        >
            <ul className="space-y-4">
                {posts.slice(0, 3).map((p) => {
                    const cover = coverOf(p);
                    return (
                        <li key={p._id || p.slug}>
                            <Link href={`/blogs/${p.slug}`} className="group flex gap-3">
                                <div className="relative h-[52px] w-[68px] shrink-0 overflow-hidden rounded-lg bg-studio-canvas">
                                    {cover && (
                                        <Image
                                            src={cover}
                                            alt={p.coverImage?.altText || p.title}
                                            fill
                                            unoptimized
                                            sizes="68px"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-studio-ink transition-colors group-hover:text-studio-coral">
                                        {p.title}
                                    </p>
                                    <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-studio-inkMuted">
                                        {p.category} · {p.readingTime || 1} min read
                                    </p>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
}

/* ── 4. Share ───────────────────────────────────────────────────────────── */

/*
  Brand colours, as in the reference. A share row reads as a row of recognised
  marks; in monochrome outlines the reader has to decode each one by its label.
*/
const SHARE_TARGETS = [
    { label: 'Pinterest', bg: '#E60023', href: (u, t) => `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`,
      path: 'M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.3 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.1-3.8-3 0-4.9 2.2-4.9 4.7 0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.8c-.1.3-.3.4-.5.2-1.2-.5-1.8-1.9-1.8-3.5 0-2.6 2.2-5.7 6.6-5.7 3.5 0 5.8 2.5 5.8 5.3 0 3.6-2 6.3-5 6.3-1 0-1.9-.5-2.2-1.2l-.6 2.4c-.2.8-.7 1.7-1 2.3A10 10 0 1 0 12 2z' },
    { label: 'WhatsApp', bg: '#25D366', href: (u, t) => `https://wa.me/?text=${t}%20${u}`,
      path: 'M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.5-1.2-2.9s.7-2 1-2.3c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2 0 .4-.1.5l-.3.4c-.1.1-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l2 .9c.2.1.4.2.4.3.1.2.1.7-.1 1.4z' },
    { label: 'Twitter', bg: '#1DA1F2', href: (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      path: 'M22 5.9c-.7.3-1.5.6-2.4.7.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.7a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5a4.1 4.1 0 0 0 3.3 4 4.1 4.1 0 0 1-1.9.1 4.1 4.1 0 0 0 3.8 2.9A8.3 8.3 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.6c.8-.6 1.5-1.3 2-2z' },
    { label: 'Facebook', bg: '#1877F2', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      path: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z' },
    { label: 'LinkedIn', bg: '#0A66C2', href: (u, t) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}&title=${t}`,
      path: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.3 18.3H5.8V9.8h2.5v8.5zM7 8.7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11.3 9.6h-2.5v-4.1c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1v4.8h-2.5V9.8h2.4v1a2.6 2.6 0 0 1 2.3-1.2c1.7 0 2.9 1.1 2.9 3.4v5.3z' },
];

function ShareCard({ url, title }) {
    const [copied, setCopied] = useState(false);
    if (!url) return null;

    const enc = encodeURIComponent(url);
    const encTitle = encodeURIComponent(title || '');

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable — the share links still work */
        }
    };

    return (
        <Card title="Share this story">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={copy}
                    aria-label="Copy link"
                    title="Copy link"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-400 text-white transition-transform hover:scale-105"
                >
                    {copied ? <Check size={15} /> : <Link2 size={15} />}
                </button>
                {SHARE_TARGETS.map((s) => (
                    <a
                        key={s.label}
                        href={s.href(enc, encTitle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Share on ${s.label}`}
                        title={`Share on ${s.label}`}
                        style={{ backgroundColor: s.bg }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
                    >
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                            <path d={s.path} />
                        </svg>
                    </a>
                ))}
            </div>
            {copied && <p className="mt-2 text-[11px] text-studio-terracotta">Link copied</p>}
        </Card>
    );
}

/* ── 5. Author ──────────────────────────────────────────────────────────── */

function AuthorCard({ author }) {
    const name = author?.name || 'The Wedding Boys';
    const avatar = avatarOf(author);
    /*
      `role` on the Admin model is an RBAC enum (SuperAdmin / Editor), not a job
      title, so it is never printed here — a byline reading "Editor" because of a
      permissions flag would be wrong. `title` is the display field when set.
    */
    const jobTitle = author?.title || 'Lead Cinematographer';
    const bio = author?.bio
        || 'Passionate about capturing real emotions and timeless stories. 10+ years of experience in wedding cinematography.';

    return (
        <Card title="Author">
            <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-studio-obsidian">
                    {avatar ? (
                        <Image src={avatar} alt={name} fill unoptimized sizes="48px" className="object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center font-playfair text-lg font-bold text-studio-gold">
                            {name[0]}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-studio-ink">{name}</p>
                    <p className="text-[11px] text-studio-inkMuted">{jobTitle}</p>
                </div>
                <Link
                    href="/contact"
                    className="shrink-0 rounded-full border border-studio-coral px-3.5 py-1.5 text-[11px] font-semibold text-studio-coral transition-colors hover:bg-studio-coral hover:text-white"
                >
                    Follow
                </Link>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-studio-inkSecondary">{bio}</p>
        </Card>
    );
}

/* ── 6. Studio quote ────────────────────────────────────────────────────── */

/*
  Rendered only when the post actually carries a quote. The reference shows one
  attributed to the author, and attributing words to a real person that they did
  not write is not something a template should invent — so an empty field means
  no card rather than a plausible-sounding default.
*/
function QuoteCard({ post }) {
    const quote = post?.weddingDetails?.flourishQuote || post?.testimonial;
    if (!quote) return null;
    const who = post?.testimonialAuthor || post?.author?.name;

    return (
        <section className="rounded-2xl bg-studio-blush p-5">
            <span aria-hidden="true" className="block font-playfair text-4xl leading-none text-studio-coral/30">“</span>
            <blockquote className="-mt-2 font-lora text-[13.5px] italic leading-relaxed text-studio-inkSecondary">
                {quote}
            </blockquote>
            {who && (
                <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-studio-inkMuted">
                    — {who}
                </p>
            )}
        </section>
    );
}

/* ── The rail ───────────────────────────────────────────────────────────── */

/**
 * `layout`:
 *   'column'  — the default, a 300px sticky column beside the article.
 *   'stacked' — the same cards in a row beneath the article, for the two
 *               templates that are deliberately wide. Photo Essay is
 *               edge-to-edge and Real Wedding is full-bleed; carving 300px out
 *               of either to run a column of links defeats the layout the author
 *               chose. The cards are the same and the reader still gets each.
 *
 * `cards`: which cards to render. Cinematic Real Wedding already ends with an
 * engagement bar carrying share and the author profile, so it takes the rail
 * without those two rather than showing the reader each of them twice.
 */
const ALL_CARDS = ['contents', 'cta', 'related', 'share', 'author', 'quote'];

export default function ArticleRail({
    toc, related, post, shareUrl, className = '', layout = 'column', cards = ALL_CARDS,
}) {
    const stacked = layout === 'stacked';
    const show = (name) => cards.includes(name);

    return (
        <aside className={`article-rail ${className}`} aria-label="Article sidebar">
            {/*
              Sticky is on an inner element, not the aside: the aside is a grid
              item stretched to the article's full height, and `position: sticky`
              on something that tall has nothing left to travel in — it never
              moves. The inner box is only as tall as its cards, so it can.
            */}
            <div className={stacked
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>*]:self-start'
                : 'space-y-4 lg:sticky lg:top-24'}>
                {show('contents') && <ContentsCard toc={toc} />}
                {show('cta') && <CtaCard />}
                {show('related') && <RelatedCard posts={related} />}
                {show('share') && <ShareCard url={shareUrl} title={post?.title} />}
                {show('author') && <AuthorCard author={post?.author} />}
                {show('quote') && <QuoteCard post={post} />}
            </div>
        </aside>
    );
}
