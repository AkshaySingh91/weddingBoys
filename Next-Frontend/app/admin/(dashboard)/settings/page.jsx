'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Buildings,
  Tag,
  ShieldWarning,
  HardDrives,
  ShieldCheck,
  Receipt,
  Bell,
  Question,
  MagnifyingGlass,
  ArrowSquareOut,
  Sparkle,
  CircleNotch,
} from '@phosphor-icons/react';
import TagsSettingsTab from './_components/TagsSettingsTab.jsx';
import StudioContact from '../studio-setting/_components/StudioContact.jsx';
import AdminInviteCode from '../studio-setting/_components/AdminInviteCode.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';

const SETTINGS_SECTIONS = [
  {
    id: 'studio',
    label: 'Company & Studio Info',
    icon: Buildings,
    description: 'Manage studio name, address, contact emails and invite codes.',
  },
  {
    id: 'tags',
    label: 'Portfolio Tags',
    icon: Tag,
    description: 'Ceremonies, film types and every tag a film or photo can carry.',
  },
  {
    id: 'bts',
    label: 'BTS Crew Roles',
    icon: ShieldWarning,
    description: 'Configure behind-the-scenes production and filmmaking roles.',
  },
  {
    id: 'storage',
    label: 'Cloudflare Storage & R2',
    icon: HardDrives,
    description: 'Cloud storage bucket connection status and transcode pipeline.',
  },
  {
    id: 'security',
    label: 'Security & Access',
    icon: ShieldCheck,
    description: 'Configure two-factor authentication, active sessions, and credentials.',
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: Receipt,
    badge: 'SOON',
    description: 'Track and monitor system configuration changes, administrator actions, and workforce security logs for compliance audit requirements.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 'SOON',
    description: 'Automated broadcast alerts, client enquiry webhooks, and media transcode completion notices.',
  },
  {
    id: 'support',
    label: 'Support & Help',
    icon: Question,
    badge: 'SOON',
    description: 'Studio knowledge base, API documentation, and technical support assistance.',
  },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Ceremonies are a group in Portfolio Tags now; old links to ?tab=ceremonies land there.
  // The URL is the tab state (no copy to keep in sync).
  const tabAlias = (t) => (t === 'ceremonies' ? 'tags' : t);
  const activeTab = tabAlias(searchParams.get('tab')) || 'tags';
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectTab = (tabId) => {
    router.replace(`/admin/settings?tab=${tabId}`, { scroll: false });
  };

  const currentSection = SETTINGS_SECTIONS.find((s) => s.id === activeTab) || SETTINGS_SECTIONS[0];

  const filteredNavItems = SETTINGS_SECTIONS.filter(
    (s) =>
      !searchQuery.trim() ||
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight font-sans">
            Settings
          </h1>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Admin / Settings
          </p>
        </div>

        <div className="relative min-w-[14rem] sm:min-w-[18rem]">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search console..."
            className="h-9 w-full rounded-xl border border-[#E8DDD1] bg-white pl-8 pr-3 text-xs text-stone-800 outline-none transition-colors focus:border-[#A3603A] focus:ring-2 focus:ring-[#A3603A]/15 shadow-sm"
          />
        </div>
      </div>

      {/* Main Settings 2-Column Shell */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Card */}
        <div className="md:col-span-4 lg:col-span-3 rounded-2xl border border-[#E8DDD1] bg-white p-2 sm:p-2.5 shadow-sm space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group',
                  isActive
                    ? 'bg-[#FFF7EE] text-[#A3603A] font-semibold border-l-4 border-[#A3603A] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={16}
                    weight={isActive ? 'duotone' : 'regular'}
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-[#A3603A]' : 'text-stone-400 group-hover:text-stone-600'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 ml-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Main Content Pane */}
        <div className="md:col-span-8 lg:col-span-9 rounded-2xl border border-[#E8DDD1] bg-white p-5 sm:p-7 shadow-sm min-h-[520px]">
          {/* Tab 2: Studio & Company Info */}
          {activeTab === 'studio' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[#E8DDD1]">
                <h2 className="text-lg font-bold text-stone-900 tracking-tight font-serif flex items-center gap-2">
                  <Buildings size={20} className="text-[#A3603A]" weight="duotone" />
                  Studio & Company Info
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Official studio brand assets, contact channels, and team invitation codes.
                </p>
              </div>

              <StudioContact />
              <AdminInviteCode />
            </div>
          )}

          {/* Portfolio Tags: the tag system, ceremonies included */}
          {activeTab === 'tags' && <TagsSettingsTab />}

          {/* Tab 4: BTS Crew Roles */}
          {activeTab === 'bts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 tracking-tight font-serif flex items-center gap-2">
                    <ShieldWarning size={20} className="text-[#A3603A]" weight="duotone" />
                    Behind The Scenes (BTS) Roles
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Production roles and crew designations credited across wedding showcases.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowSquareOut}
                  onClick={() => router.push('/admin/website-setting/bts-schema-manager')}
                  className="text-xs"
                >
                  Open BTS Manager
                </Button>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-6 text-center space-y-3">
                <ShieldWarning size={32} className="text-stone-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-stone-800">
                    Film & Photography Crew Schema
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Define standardized crew roles: Lead Cinematographer, Aerial Pilot, Colorist, Director, and Candid Specialists.
                  </p>
                </div>
                <Button
                  variant="terracotta"
                  size="sm"
                  onClick={() => router.push('/admin/website-setting/bts-schema-manager')}
                  className="mt-2 text-xs"
                >
                  Configure BTS Schema
                </Button>
              </div>
            </div>
          )}

          {/* Tab 5: Storage & Cloudflare R2 */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 tracking-tight font-serif flex items-center gap-2">
                    <HardDrives size={20} className="text-[#A3603A]" weight="duotone" />
                    Cloud Storage & Cloudflare R2
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Storage pipeline connection, high-speed direct uploads, and CDN distribution.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowSquareOut}
                  onClick={() => router.push('/admin/media')}
                  className="text-xs"
                >
                  Open Media Library
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                    Storage Bucket
                  </p>
                  <p className="text-sm font-bold text-emerald-950 mt-1">Cloudflare R2</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Active & Connected</p>
                </div>
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
                  <p className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">
                    Video Transcoding
                  </p>
                  <p className="text-sm font-bold text-sky-950 mt-1">Cloudflare Stream</p>
                  <p className="text-[11px] text-sky-700 mt-0.5">ABR Playback Ready</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                    Upload Acceleration
                  </p>
                  <p className="text-sm font-bold text-amber-950 mt-1">Direct S3 Multi-Part</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Concurrent Chunking</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Security & Access */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD1]">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 tracking-tight font-serif flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[#A3603A]" weight="duotone" />
                    Security & Access Governance
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Studio authentication safeguards, active user sessions, and MFA protection.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowSquareOut}
                  onClick={() => router.push('/admin/security')}
                  className="text-xs"
                >
                  Manage Security
                </Button>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-6 text-center space-y-3">
                <ShieldCheck size={32} className="text-stone-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-stone-800">
                    Enterprise Studio Security
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Manage team password policies, multi-factor authentication (MFA) devices, and revoke active administrative sessions.
                  </p>
                </div>
                <Button
                  variant="terracotta"
                  size="sm"
                  onClick={() => router.push('/admin/security')}
                  className="mt-2 text-xs"
                >
                  Open Security Center
                </Button>
              </div>
            </div>
          )}

          {/* Coming Soon Sections (Audit, Notifications, Support) - Matching Inspiration Screenshot */}
          {['audit', 'notifications', 'support'].includes(activeTab) && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
              <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                {activeTab === 'audit' && <Receipt size={36} weight="duotone" />}
                {activeTab === 'notifications' && <Bell size={36} weight="duotone" />}
                {activeTab === 'support' && <Question size={36} weight="duotone" />}
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight font-sans">
                    {currentSection.label}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Coming Soon
                  </span>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  {currentSection.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500 font-sans">
          <CircleNotch size={26} className="animate-spin text-[#A3603A]" />
          <p className="text-xs font-medium">Loading settings hub…</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
