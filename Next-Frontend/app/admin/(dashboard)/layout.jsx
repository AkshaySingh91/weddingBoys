'use client';

import { useState, useEffect } from 'react';
import AdminAuthProvider from '@/Context/AdminAuthContext.jsx';
import AdminSidebar from '@/Component/AdminSidebar.jsx';
import Header from '@/Component/Header.jsx';
import QueryProvider from '@/Component/providers/QueryProvider.jsx';
import { cn } from '@/lib/utils.js';

export default function AdminDashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Synchronize collapse preference with localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wb_admin_sidebar_collapsed');
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollapsed(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('wb_admin_sidebar_collapsed', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <QueryProvider>
      <AdminAuthProvider>
        <div className="min-h-screen bg-[#FFF7EE] font-sans antialiased text-[#2F2F2F] selection:bg-[#FF5353]/20 selection:text-[#5E2B17]">
          {/* Collapsible / Responsive Luxury Sidebar */}
          <AdminSidebar
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            mobileOpen={mobileMenuOpen}
            setMobileOpen={setMobileMenuOpen}
          />

          {/* Main Content Area - dynamically adjusted for fixed sidebar width */}
          <div
            className={cn(
              'flex flex-col min-w-0 min-h-screen transition-[padding] duration-300 ease-in-out',
              collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
            )}
          >
            <Header
              collapsed={collapsed}
              onToggleCollapse={handleToggleCollapse}
              onToggleMobile={() => setMobileMenuOpen(true)}
            />

            <main className="flex-grow p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            </main>

            {/* Subtle Studio Admin Footer */}
            <footer className="py-4 px-6 border-t border-stone-200 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
              <p className="font-medium text-stone-700">
                The Wedding Boys Workspace • Studio Platform
              </p>
              <p className="text-[11px] text-stone-500 font-mono">Enterprise Studio v2.0</p>
            </footer>
          </div>
        </div>
      </AdminAuthProvider>
    </QueryProvider>
  );
}
