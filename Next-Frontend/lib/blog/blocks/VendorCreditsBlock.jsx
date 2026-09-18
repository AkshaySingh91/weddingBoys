/**
 * VendorCreditsBlock — renders vendor credits as a styled grid with follow-links.
 * Each credit shows role, name, and links (URL + Instagram).
 */
import { LinkSimple, InstagramLogo } from '@phosphor-icons/react';

export default function VendorCreditsBlock({ node, post }) {
  const credits = (node?.attrs?.credits && node.attrs.credits.length > 0)
    ? node.attrs.credits
    : (post?.vendorCredits || []);

  if (credits.length === 0) return null;

  return (
    <section className="my-10 rounded-2xl border border-studio-border bg-studio-canvas/40 p-6">
      <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-studio-inkMuted">
        Vendor Credits
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {credits.map((credit, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-xl bg-white/60 p-4 transition-colors hover:bg-white"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-studio-terracottaLight">
              <span className="text-sm font-bold text-studio-terracotta">
                {(credit.role || credit.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {credit.role && (
                <span className="block text-[11px] font-medium uppercase tracking-wider text-studio-inkMuted">
                  {credit.role}
                </span>
              )}
              <span className="block truncate text-sm font-semibold text-studio-ink">
                {credit.name}
              </span>
              <div className="mt-1 flex items-center gap-3">
                {credit.url && (
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-xs text-studio-terracotta hover:underline"
                  >
                    <LinkSimple size={12} weight="bold" />
                    Website
                  </a>
                )}
                {credit.instagram && (
                  <a
                    href={credit.instagram.startsWith('http') ? credit.instagram : `https://instagram.com/${credit.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-xs text-studio-terracotta hover:underline"
                  >
                    <InstagramLogo size={12} weight="bold" />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
