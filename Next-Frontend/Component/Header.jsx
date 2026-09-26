'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarSimple,
  Bell,
  ArrowSquareOut,
  SignOut,
  User,
  ShieldCheck,
  List,
  CaretRight,
} from '@phosphor-icons/react';
import { useAuth } from '@/Context/AdminAuthContext.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/admin/components/ui/Dropdown.jsx';

/**
 * Screen names, matched longest-prefix-first.
 *
 * The previous table was exact-match with a `startsWith('/admin/website-setting')`
 * fallback, so any dynamic route missed and rendered the literal "Website
 * Settings" — which is what a wedding's own page used to show. Ordering by
 * descending path length means `/admin/clients/new` wins over `/admin/clients`,
 * and a dynamic child inherits its parent's name instead of a generic one.
 */
const ROUTE_TITLES = {
  '/admin/dashboard': 'Studio Dashboard',
  '/dashboard': 'Studio Dashboard',
  '/admin/total-Enquires': 'Client Enquiries',
  '/admin/content': 'Page Content CMS',
  '/admin/blogs/create': 'Write New Story',
  '/admin/blogs/comments': 'Reader Comments',
  '/admin/blogs/analytics': 'Editorial Analytics',
  '/admin/blogs/edit': 'Edit Story',
  '/admin/blogs': 'Articles & Blogs',
  '/admin/media': 'Media Library',
  '/admin/website-setting/home': 'Home Experience',
  '/admin/website-setting/films': 'Films Page',
  '/admin/collections': 'Rows',
  '/admin/website-setting/teams': 'Team Page',
  '/admin/website-setting/add-tags': 'Portfolio Tags',
  '/admin/website-setting/bts-schema-manager': 'BTS Roles',
  '/admin/clients/new': 'Add a Wedding',
  '/admin/clients': 'All Weddings',
  '/admin/studio-setting': 'Studio Contact & Info',
  '/admin/users': 'Team & Access',
  '/admin/security': 'Security & 2FA',
  '/admin/profile': 'My Profile',
};

const ROUTE_ENTRIES = Object.entries(ROUTE_TITLES).sort((a, b) => b[0].length - a[0].length);

export const titleForPath = (pathname = '') =>
  ROUTE_ENTRIES.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] || 'Studio Workspace';

export default function Header({
  collapsed = false,
  onToggleCollapse,
  onToggleMobile,
}) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth() || {};

  const currentTitle = titleForPath(pathname);

  // Compute user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'WB';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-2.5 transition-all shadow-sm font-sans">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile / Desktop Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile menu trigger */}
          {onToggleMobile && (
            <button
              onClick={onToggleMobile}
              className="lg:hidden p-2 rounded-lg text-stone-700 hover:text-[#2F2F2F] hover:bg-stone-100 transition-colors border border-stone-200 cursor-pointer"
              aria-label="Open navigation"
            >
              <List size={18} />
            </button>
          )}

          {/* Desktop collapse toggle */}
          {onToggleCollapse && (
            <button
              id="admin-header-collapse-btn"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-lg text-stone-600 hover:text-[#2F2F2F] hover:bg-stone-100 transition-colors border border-stone-200 cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar to icon rail'}
              aria-label="Toggle sidebar"
            >
              <SidebarSimple size={18} weight={collapsed ? 'fill' : 'regular'} />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-sans min-w-0">
            <span className="hidden sm:inline font-semibold text-stone-500 uppercase tracking-wider text-[11px]">
              Wedding Boys
            </span>
            <CaretRight size={12} className="hidden sm:inline text-stone-400 shrink-0" />
            <span className="font-semibold text-[#2F2F2F] text-sm truncate tracking-tight">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Right: Actions, Previews & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* View Live Site Link */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 transition-all cursor-pointer"
          >
            <span>Live Site</span>
            <ArrowSquareOut size={14} className="text-stone-500" />
          </Link>

          {/* Quick Enquiries Bell */}
          <Link
            href="/admin/total-Enquires"
            className="relative p-2 rounded-lg text-stone-600 hover:text-[#2F2F2F] hover:bg-stone-100 transition-colors cursor-pointer"
            title="View Client Enquiries"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </Link>

          {/* User Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-stone-100 transition-all focus:outline-none cursor-pointer border border-transparent hover:border-stone-200"
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold flex items-center justify-center text-xs shadow-sm shadow-red-900/10">
                  {initials}
                </div>

                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-[#2F2F2F] truncate max-w-[120px]">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {role || 'SuperAdmin'}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 p-1.5">
              <DropdownMenuLabel className="p-2">
                <p className="text-xs font-semibold text-[#2F2F2F] truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-stone-500 font-normal truncate mt-0.5">
                  {user?.email || 'admin@theweddingboys.in'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge variant="gold" size="sm">
                    {role || 'SuperAdmin'}
                  </Badge>
                  {user?.mfaEnabled && (
                    <Badge variant="success" size="sm" dot>
                      2FA Active
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="w-full flex items-center gap-2 cursor-pointer">
                  <User size={15} className="text-stone-500" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/admin/security" className="w-full flex items-center gap-2 cursor-pointer">
                  <ShieldCheck size={15} className="text-stone-500" />
                  <span>Security & 2FA</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={logout}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 focus:bg-rose-50/80 focus:text-rose-700 cursor-pointer"
              >
                <SignOut size={15} className="text-rose-500" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
