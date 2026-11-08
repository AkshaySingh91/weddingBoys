'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const CATEGORIES = [
    { label: 'All stories', href: '/blogs' },
    { label: 'Real weddings', href: '/blogs?category=Real+Weddings', category: 'Real Weddings' },
    { label: 'Planning guides', href: '/blogs?category=Planning+Guides', category: 'Planning Guides' },
    { label: 'Cinematography', href: '/blogs?category=Cinematography', category: 'Cinematography' },
    { label: 'Photo essays', href: '/blogs?category=Photo+Essays', category: 'Photo Essays' },
];

export default function JournalNavbar() {
    const pathname = usePathname();
    const category = useSearchParams().get('category');
    return (
        <nav aria-label="Journal categories" className="border-b border-gold/25 bg-ground-sunk">
            <div className="mx-auto flex max-w-wide items-center gap-4 overflow-x-auto px-5 sm:px-8 lg:px-12">
                <Link href="/blogs" className="shrink-0 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-ink">Journal</Link>
                <span aria-hidden="true" className="h-4 w-px shrink-0 bg-gold/50" />
                {CATEGORIES.map((item) => {
                    const active = pathname === '/blogs' && (item.category ? category === item.category : !category);
                    return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
                        className={`inline-flex min-h-12 shrink-0 items-center border-b-2 px-1 text-[12px] font-medium transition-colors
                            ${active ? 'border-accent text-accent-ink' : 'border-transparent text-ink-secondary hover:border-gold hover:text-ink'}`}>
                        {item.label}
                    </Link>;
                })}
            </div>
        </nav>
    );
}
