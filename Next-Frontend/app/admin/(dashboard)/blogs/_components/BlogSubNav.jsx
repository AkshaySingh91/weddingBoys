'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpenText,
  PenNib,
  ChatCircleDots,
  ChartLineUp,
  Sparkle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

export default function BlogSubNav({ className = '' }) {
  const pathname = usePathname();

  const navItems = [
    {
      id: 'all',
      label: 'All Stories',
      href: '/admin/blogs',
      icon: BookOpenText,
      active: pathname === '/admin/blogs' || pathname.startsWith('/admin/blogs/edit'),
    },
    {
      id: 'create',
      label: 'Write Story',
      href: '/admin/blogs/create',
      icon: PenNib,
      active: pathname === '/admin/blogs/create',
    },
    {
      id: 'comments',
      label: 'Reader Comments',
      href: '/admin/blogs/comments',
      icon: ChatCircleDots,
      active: pathname === '/admin/blogs/comments',
    },
    {
      id: 'analytics',
      label: 'Editorial Analytics',
      href: '/admin/blogs/analytics',
      icon: ChartLineUp,
      active: pathname === '/admin/blogs/analytics',
    },
  ];

  return (
    <div className={cn('flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-2xl border border-stone-200/80 w-fit overflow-x-auto max-w-full font-sans mb-6', className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
              item.active
                ? 'bg-[#1C1917] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#1C1917] hover:bg-white/60'
            )}
          >
            <Icon size={14} weight={item.active ? 'fill' : 'regular'} className={item.active ? 'text-[#C29555]' : ''} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
