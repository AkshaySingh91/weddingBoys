/**
 * CalloutBlock — public render of callout variants.
 *
 * `protip` exists because authors kept building it by hand: a container, a grid
 * inside it, an icon in the narrow column and the copy in the wide one. That is
 * four nested boxes to express one idea, and it broke — the icon column
 * collapsed, the copy overlapped, and every instance was spaced differently
 * because each was rebuilt from scratch. As a variant it is one node.
 */
import { Info, Trophy, Quotes, Lightbulb, Warning } from '@phosphor-icons/react';

const VARIANTS = {
  note: {
    icon: Info,
    cls: 'rounded-r-xl border-l-4 border-amber-500/70 bg-amber-50/40',
    iconCls: 'text-amber-600',
    label: 'Note',
  },
  vendor: {
    icon: Trophy,
    cls: 'rounded-r-xl border-l-4 border-studio-terracotta bg-studio-terracottaLight',
    iconCls: 'text-studio-terracotta',
    label: 'Vendor Credit',
  },
  testimonial: {
    icon: Quotes,
    cls: 'rounded-r-xl border-l-4 border-studio-ink/30 bg-stone-50',
    iconCls: 'text-studio-inkMuted',
    label: 'Testimonial',
  },
  /*
    A full panel with the icon set beside the copy, not a left bar with a label
    stacked above it. This is the shape authors kept building by hand out of a
    container and a two-column grid, and it is the shape the reference uses.
  */
  protip: {
    icon: Lightbulb,
    cls: 'rounded-2xl border border-studio-coral/30 bg-studio-blush',
    iconCls: 'text-studio-coral',
    label: 'Pro Tip',
    aside: true,
  },
  warning: {
    icon: Warning,
    cls: 'rounded-2xl border border-red-300/70 bg-red-50/50',
    iconCls: 'text-red-600',
    label: 'Watch Out',
    aside: true,
  },
};

export default function CalloutBlock({ node, children }) {
  const variant = node.attrs?.variant || 'note';
  const cfg = VARIANTS[variant] || VARIANTS.note;
  const Icon = cfg.icon;

  /*
    Two arrangements. The margin-note variants keep the icon and label on a line
    above the copy; the panel variants set a circled icon in its own column
    beside it, so the label and the first line of copy start together.
  */
  if (cfg.aside) {
    return (
      <aside className={`callout p-5 ${cfg.cls}`} data-variant={variant} role="note">
        <div className="flex gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
            <Icon size={18} weight="bold" className={cfg.iconCls} />
          </span>
          <div className="min-w-0 flex-1">
            <span className={`mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] ${cfg.iconCls}`}>
              {cfg.label}
            </span>
            <div className="font-sans text-[15px] leading-relaxed text-studio-ink/90">
              {children}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`callout p-5 ${cfg.cls}`} data-variant={variant} role="note">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} weight="bold" className={cfg.iconCls} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-studio-inkMuted">
          {cfg.label}
        </span>
      </div>
      <div className={`text-[15px] leading-relaxed text-studio-ink/90 ${variant === 'testimonial' ? 'font-lora italic' : 'font-sans'}`}>
        {children}
      </div>
    </aside>
  );
}
