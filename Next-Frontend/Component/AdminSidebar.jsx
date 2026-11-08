'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour,
  PhoneCall,
  Files,
  BookOpenText,
  Sparkle,
  FilmSlate,
  Rows,
  UsersThree,
  Camera,
  UserCheck,
  Tag,
  ShieldWarning,
  Images,
  AddressBook,
  UserGear,
  ShieldCheck,
  UserCircle,
  SidebarSimple,
  CaretDown,
  ArrowSquareOut,
  X,
  ChatCircleDots,
  ChartLineUp,
  PenNib,
  CalendarHeart,
  Gear,
  CurrencyInr,
} from '@phosphor-icons/react';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import { useAuth } from '@/Context/AdminAuthContext.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { TooltipProvider, QuickTooltip } from '@/app/admin/components/ui/Tooltip.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/app/admin/components/ui/Dropdown.jsx';
import { cn } from '@/lib/utils.js';

export default function AdminSidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  setMobileOpen,
}) {
  const [openSubmenus, setOpenSubmenus] = useState({});

  const { studioName, studioLogo } = useStudioDetails();
  const { isSuperAdmin } = useAuth() || {};
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (setMobileOpen) setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const toggleSubmenu = (sectionId) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const isActiveRoute = (path) => {
    if (path === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/dashboard';
    }
    if (path === '/admin/blogs') {
      return pathname === '/admin/blogs' || pathname.startsWith('/admin/blogs/edit');
    }
    if (path === '/admin/blogs/create') {
      return pathname === '/admin/blogs/create';
    }
    if (path === '/admin/blogs/comments') {
      return pathname === '/admin/blogs/comments';
    }
    if (path === '/admin/blogs/analytics') {
      return pathname === '/admin/blogs/analytics';
    }
    // /admin/content/films has its own entry ("Films Page").
    if (path === '/admin/content') {
      return pathname.startsWith('/admin/content') && !pathname.startsWith('/admin/content/films');
    }
    return pathname === path || (path !== '/admin' && pathname.startsWith(path));
  };

  const navigationSections = [
    {
      group: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/admin/dashboard',
          icon: SquaresFour,
        },
        {
          id: 'enquiries',
          label: 'Client Enquiries',
          path: '/admin/total-Enquires',
          icon: PhoneCall,
          badge: 'Live',
          badgeVariant: 'success',
        },
      ],
    },
    {
      group: 'Blog Management',
      items: [
        {
          id: 'blog-all',
          label: 'All Stories',
          path: '/admin/blogs',
          icon: BookOpenText,
        },
        {
          id: 'blog-create',
          label: 'Write New Story',
          path: '/admin/blogs/create',
          icon: PenNib,
        },
        {
          id: 'blog-comments',
          label: 'Reader Comments',
          path: '/admin/blogs/comments',
          icon: ChatCircleDots,
        },
        {
          id: 'blog-analytics',
          label: 'Editorial Analytics',
          path: '/admin/blogs/analytics',
          icon: ChartLineUp,
        },
      ],
    },
    // Grouped by what a screen actually changes. Client work is the studio's
    // product, not a website setting — it used to sit under "Website Config",
    // which is why it read as configuration rather than content.
    {
      group: 'Client Work',
      items: [
        {
          id: 'clients',
          label: 'All Weddings',
          path: '/admin/clients',
          icon: UserCheck,
        },
        {
          id: 'client-new',
          label: 'Add a Wedding',
          path: '/admin/clients/new',
          icon: Camera,
        },
      ],
    },
    {
      group: 'Site Presentation',
      items: [
        {
          id: 'website-home',
          label: 'Home Experience',
          path: '/admin/website-setting/home',
          icon: Sparkle,
        },
        {
          id: 'website-films',
          label: 'Films Page',
          path: '/admin/content/films',
          icon: FilmSlate,
        },
        {
          id: 'website-varanasi',
          label: 'Varanasi Motion',
          path: '/admin/varanasi-sequences',
          icon: FilmSlate,
        },
        {
          id: 'website-rows',
          label: 'Rows',
          path: '/admin/collections',
          icon: Rows,
        },
        {
          id: 'website-teams',
          label: 'Team Page',
          path: '/admin/website-setting/teams',
          icon: UsersThree,
        },
        {
          id: 'pricing',
          label: 'Pricing',
          path: '/admin/pricing',
          icon: CurrencyInr,
        },
        {
          id: 'content',
          label: 'Page Content CMS',
          path: '/admin/content',
          icon: Files,
        },
      ],
    },
    {
      group: 'Asset Studio',
      items: [
        {
          id: 'media',
          label: 'Media Library',
          path: '/admin/media',
          icon: Images,
          badge: 'R2',
          badgeVariant: 'gold',
        },
      ],
    },
    {
      group: 'Studio Governance',
      items: [
        {
          id: 'settings',
          label: 'Studio Settings',
          path: '/admin/settings',
          icon: Gear,
        },
        ...(isSuperAdmin
          ? [
              {
                id: 'users',
                label: 'Team & Access',
                path: '/admin/users',
                icon: UserGear,
                badge: 'Admin',
                badgeVariant: 'terracotta',
              },
            ]
          : []),
        {
          id: 'security',
          label: 'Security & 2FA',
          path: '/admin/security',
          icon: ShieldCheck,
        },
        {
          id: 'profile',
          label: 'My Profile',
          path: '/admin/profile',
          icon: UserCircle,
        },
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out font-sans',
          'bg-white border-r border-edge-subtle shadow-sm flex flex-col',
          'lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          mobileOpen ? 'w-64 translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Studio Branding & Header */}
        <div
          className={cn(
            'p-4 border-b border-edge-subtle flex items-center transition-all duration-200',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-edge-subtle bg-white p-1 shrink-0 flex items-center justify-center">
              {studioLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="w-full h-full object-contain"
                  src={studioLogo}
                  alt="Studio Logo"
                />
              ) : (
                <span className="font-sans font-bold text-xs text-accent-ink">WB</span>
              )}
            </div>

            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <h2 className="text-sm font-semibold text-ink truncate tracking-tight">
                  {studioName || 'The Wedding Vachan'}
                </h2>
                <p className="text-[11px] font-medium text-accent-ink tracking-wide uppercase mt-0.5">
                  Studio CRM
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button inside sidebar */}
          {!collapsed && onToggleCollapse && (
            <button
              id="admin-sidebar-collapse-btn"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-ground-sunk transition-colors cursor-pointer"
              title="Collapse sidebar to icon rail"
              aria-label="Collapse sidebar"
            >
              <SidebarSimple size={18} weight="regular" />
            </button>
          )}
        </div>

        {/* Collapsed Mode Rail Expander (Icon Only Header) */}
        {collapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center p-2.5 border-b border-edge-subtle">
            <button
              id="admin-sidebar-expand-btn"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-ground-sunk transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <SidebarSimple size={18} weight="regular" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-2.5 py-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-transparent">
          {navigationSections.map((section) => (
            <div key={section.group} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted font-sans">
                  {section.group}
                </p>
              )}

              <div className="space-y-1 pt-0.5">
                {section.items.map((item) => {
                  const active = isActiveRoute(item.path);
                  const Icon = item.icon;

                  if (item.hasSubmenu) {
                    const isExpanded = openSubmenus[item.id];
                    const hasActiveSub = item.submenu?.some((sub) => isActiveRoute(sub.path));

                    // In Collapsed Rail mode, render submenu as a Radix Dropdown on hover/click
                    if (collapsed) {
                      return (
                        <DropdownMenu key={item.id}>
                          <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                  'w-full flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer',
                                  hasActiveSub
                                    ? 'bg-accent-wash text-accent-ink shadow-sm'
                                    : 'text-ink-secondary hover:bg-ground hover:text-ink'
                                )}
                            >
                              <Icon size={18} weight={hasActiveSub ? 'bold' : 'regular'} />
                              <span className="sr-only">{item.label}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-56 p-1.5">
                            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {item.submenu?.map((sub) => (
                              <DropdownMenuItem key={sub.path} asChild>
                                <Link
                                  href={sub.path}
                                    className={cn(
                                      'w-full flex items-center gap-2 cursor-pointer text-xs font-medium',
                                      isActiveRoute(sub.path) ? 'text-accent-ink font-semibold' : ''
                                    )}
                                >
                                  <sub.icon size={15} />
                                  <span>{sub.label}</span>
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    // Expanded sidebar menu with collapsible accordion
                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          onClick={() => toggleSubmenu(item.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
                            hasActiveSub
                              ? 'text-accent-ink font-semibold bg-accent-wash'
                              : 'text-ink-secondary hover:bg-ground hover:text-ink'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              size={18}
                              weight={hasActiveSub ? 'bold' : 'regular'}
                              className={hasActiveSub ? 'text-accent-ink' : 'text-ink-secondary'}
                            />
                            <span>{item.label}</span>
                          </div>
                          <CaretDown
                            size={14}
                            className={cn(
                              'text-ink-muted transition-transform duration-200',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>

                        {isExpanded && (
                          <div className="pl-6 pr-1 space-y-0.5 border-l border-edge-subtle ml-5 my-1">
                            {item.submenu?.map((sub) => {
                              const subActive = isActiveRoute(sub.path);
                              const SubIcon = sub.icon;
                              return (
                                <Link
                                  key={sub.path}
                                  href={sub.path}
                                  className={cn(
                                    'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                                    subActive
                                      ? 'bg-accent-wash text-accent-ink font-medium shadow-sm'
                                      : 'text-ink-muted hover:text-ink hover:bg-ground'
                                  )}
                                >
                                  <SubIcon
                                    size={14}
                                    weight={subActive ? 'bold' : 'regular'}
                                    className={subActive ? 'text-accent-ink' : 'text-ink-muted'}
                                  />
                                  <span className="truncate">{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Standard single item
                  if (collapsed) {
                    return (
                      <QuickTooltip key={item.id} content={item.label} side="right">
                        <Link
                          href={item.path}
                          className={cn(
                            'w-full flex items-center justify-center p-2.5 rounded-xl transition-all relative',
                            active
                              ? 'bg-accent-wash text-accent-ink'
                              : 'text-ink-secondary hover:bg-ground hover:text-ink'
                          )}
                        >
                          <Icon size={18} weight={active ? 'bold' : 'regular'} />
                          {item.badge && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-white" />
                          )}
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      </QuickTooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                        active
                          ? 'bg-accent-wash text-accent-ink font-semibold'
                          : 'text-ink-secondary hover:bg-ground hover:text-ink'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={18}
                          weight={active ? 'bold' : 'regular'}
                          className={cn(
                            'transition-colors shrink-0',
                            active ? 'text-accent-ink' : 'text-ink-muted group-hover:text-ink'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'neutral'}
                          size="sm"
                          className={active ? 'bg-accent-tint text-accent-ink border-accent/25' : ''}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info & live preview */}
        <div className="p-3 border-t border-edge-subtle space-y-2">
          {!collapsed ? (
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-xl bg-white border border-edge-subtle text-ink-secondary hover:text-ink hover:border-edge-strong transition-all text-xs font-medium group"
            >
              <span className="truncate">Live Website</span>
              <ArrowSquareOut size={14} className="text-ink-muted group-hover:text-ink" />
            </Link>
          ) : (
            <QuickTooltip content="Open Live Website" side="right">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center p-2 rounded-xl text-ink-secondary hover:text-ink hover:bg-ground transition-all"
              >
                <ArrowSquareOut size={18} />
              </Link>
            </QuickTooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
