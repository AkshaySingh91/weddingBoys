/**
 * AtAGlanceBlock — auto-generated "At a Glance" stats strip from wedding metadata.
 * Shows venue, season, budget, style, mood in a visual grid.
 */
import {
  MapPin,
  Sun,
  CurrencyInr,
  Palette,
  Heart,
} from '@phosphor-icons/react';

const STAT_CONFIG = [
  { key: 'venue',  label: 'Venue',  icon: MapPin },
  { key: 'season', label: 'Season', icon: Sun },
  { key: 'budget', label: 'Budget', icon: CurrencyInr },
  { key: 'style',  label: 'Style',  icon: Palette },
  { key: 'mood',   label: 'Mood',   icon: Heart },
];

export default function AtAGlanceBlock({ post }) {
  // Pull stats from the post's wedding metadata
  const stats = STAT_CONFIG
    .map(cfg => ({ ...cfg, value: post?.[cfg.key] }))
    .filter(s => s.value);

  if (stats.length === 0) return null;

  return (
    <section className="my-10 overflow-hidden rounded-2xl border border-studio-border bg-studio-canvas/60">
      <div className="border-b border-studio-border/60 px-6 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-studio-inkMuted">
          At a Glance
        </h3>
      </div>
      <div className={`grid divide-x divide-studio-border/40 ${
        stats.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' :
        stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      }`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.key} className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
              <Icon size={20} weight="duotone" className="text-studio-terracotta" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-studio-inkMuted">
                {stat.label}
              </span>
              <span className="text-sm font-semibold capitalize text-studio-ink">
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
