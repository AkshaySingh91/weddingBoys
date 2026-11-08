import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, SquaresFour } from '@phosphor-icons/react/dist/ssr';

const coverOf = (post) =>
    post?.coverImage?.cdnUrl || post?.coverImage?.publicUrl || post?.coverImage?.url || null;

function Thumb({ post, className = '' }) {
    const src = coverOf(post);
    if (!src) return null;
    return (
        <div className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-studio-canvas ${className}`}>
            <Image
                src={src}
                alt={post.title}
                fill
                unoptimized
                sizes="64px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
        </div>
    );
}

/**
 * The article footer bar: previous story, a way back to the index, next story.
 *
 * One bar rather than two cards. As two cards the pair read as more articles to
 * choose from — a third and fourth thumbnail directly above the related list,
 * which already offers three. As a single bar it reads as what it is: the
 * navigation off the end of this article.
 */
export default function NextPrevStories({ previous, next }) {
    if (!previous && !next) return null;

    return (
        <nav
            aria-label="Adjacent stories"
            className="mt-16 overflow-hidden rounded-2xl border border-studio-border bg-white"
        >
            <div className="grid grid-cols-1 divide-y divide-studio-border md:grid-cols-[1fr_auto_1fr] md:divide-x md:divide-y-0">
                {/* Previous */}
                {previous ? (
                    <Link href={`/blogs/${previous.slug}`} className="group flex items-center gap-3 p-4 transition-colors hover:bg-studio-canvas">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-studio-border text-studio-inkMuted transition-colors group-hover:border-studio-coral group-hover:text-studio-coral">
                            <ArrowLeft size={15} />
                        </span>
                        <Thumb post={previous} />
                        <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-studio-inkMuted">
                                ← Previous story
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[13px] font-semibold leading-snug text-studio-ink transition-colors group-hover:text-studio-coral">
                                {previous.title}
                            </span>
                        </span>
                    </Link>
                ) : (
                    <span className="hidden md:block" />
                )}

                {/* Back to the index */}
                <Link
                    href="/blogs"
                    className="group flex flex-col items-center justify-center gap-1 px-8 py-5 text-center transition-colors hover:bg-studio-canvas"
                >
                    <SquaresFour size={18} className="text-studio-coral" />
                    <span className="font-display text-sm font-bold text-studio-ink transition-colors group-hover:text-studio-coral">
                        More Stories from The Journal
                    </span>
                    <span className="text-[11px] text-studio-inkMuted">
                        Real love stories. Practical guides. Cinematic inspiration.
                    </span>
                </Link>

                {/* Next */}
                {next ? (
                    <Link href={`/blogs/${next.slug}`} className="group flex items-center justify-end gap-3 p-4 text-right transition-colors hover:bg-studio-canvas">
                        <span className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-studio-inkMuted">
                                Next story →
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[13px] font-semibold leading-snug text-studio-ink transition-colors group-hover:text-studio-coral">
                                {next.title}
                            </span>
                        </span>
                        <Thumb post={next} />
                    </Link>
                ) : (
                    <span className="hidden md:block" />
                )}
            </div>
        </nav>
    );
}
