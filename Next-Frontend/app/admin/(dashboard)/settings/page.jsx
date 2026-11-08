'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Buildings, Tag, UsersThree, CircleNotch, ArrowRight } from '@phosphor-icons/react';
import TagsSettingsTab from './_components/TagsSettingsTab.jsx';
import StudioContact from '../studio-setting/_components/StudioContact.jsx';
import AdminInviteCode from '../studio-setting/_components/AdminInviteCode.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { cn } from '@/lib/utils.js';

/*
  Three sections, each a real editor. Removed 2026-11-09 (Impeccable distill):
  - Audit Logs, Notifications, Support & Help — "Coming Soon" placeholders.
  - Cloudflare Storage & R2 — hard-coded "Active & Connected" cards that never
    checked anything; the Media Library is the real entry point.
  - Security & Access — only linked to /admin/security, which is in the sidebar.
  Old ?tab= links to removed sections fall back to Studio details.
*/
const SECTIONS = [
  {
    id: 'studio',
    label: 'Studio details',
    hint: 'Name, logo, contact numbers, socials and team invites',
    icon: Buildings,
  },
  {
    id: 'tags',
    label: 'Portfolio tags',
    hint: 'Ceremonies, film types and the tags work is filed under',
    icon: Tag,
  },
  {
    id: 'bts',
    label: 'Crew roles',
    hint: 'Roles that can be credited on a wedding',
    icon: UsersThree,
  },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Ceremonies are a group in Portfolio Tags now; old links to ?tab=ceremonies land there.
  const requested = searchParams.get('tab') === 'ceremonies' ? 'tags' : searchParams.get('tab');
  const active = SECTIONS.find((s) => s.id === requested) || SECTIONS[0];

  const selectTab = (id) => router.replace(`/admin/settings?tab=${id}`, { scroll: false });

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16 font-sans">
      <PageHeader title="Settings" subtitle="How the studio appears on the site, and the lists your work is organised by." />

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        <nav
          aria-label="Settings sections"
          className="space-y-1 rounded-xl border border-edge-subtle bg-ground-raised p-2 shadow-panel md:sticky md:top-24 md:col-span-4 lg:col-span-3"
        >
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectTab(s.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors duration-micro',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive ? 'bg-accent-wash' : 'hover:bg-ground'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-accent text-ink-onAccent' : 'bg-ground-sunk text-ink-secondary group-hover:text-ink'
                  )}
                >
                  <Icon size={16} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-sm font-semibold', isActive ? 'text-accent-ink' : 'text-ink')}>{s.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <section
          aria-labelledby="settings-section-title"
          className="min-h-[480px] rounded-xl border border-edge-subtle bg-ground-raised p-5 shadow-panel sm:p-7 md:col-span-8 lg:col-span-9"
        >
          <header className="mb-6 flex items-start gap-3 border-b border-edge-subtle pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
              <active.icon size={20} weight="duotone" aria-hidden="true" />
            </span>
            <div>
              <h2 id="settings-section-title" className="text-lg font-semibold tracking-tight text-ink">{active.label}</h2>
              <p className="mt-0.5 text-[13px] text-ink-muted">{active.hint}</p>
            </div>
          </header>

          {active.id === 'studio' && (
            <div className="space-y-6">
              <StudioContact />
              <AdminInviteCode />
            </div>
          )}

          {active.id === 'tags' && <TagsSettingsTab />}

          {active.id === 'bts' && (
            <div className="flex flex-col items-start gap-4 rounded-xl bg-ground p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">Crew roles are edited on their own page</p>
                <p className="max-w-prose text-[13px] text-ink-muted">
                  Lead cinematographer, drone pilot, colourist and the other roles you credit on a wedding story.
                </p>
              </div>
              <Button
                variant="primary"
                iconRight={ArrowRight}
                onClick={() => router.push('/admin/website-setting/bts-schema-manager')}
              >
                Edit crew roles
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-ink-muted">
          <CircleNotch size={24} className="animate-spin" aria-label="Loading settings" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
