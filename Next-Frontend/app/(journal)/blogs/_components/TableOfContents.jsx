'use client';

import { useEffect, useState } from 'react';

// Sticky TOC with active-anchor scroll spying via IntersectionObserver.
export default function TableOfContents({ toc }) {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        if (!toc?.length) return;
        const headings = toc
            .map((h) => document.getElementById(h.id))
            .filter(Boolean);
        if (!headings.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: '0px 0px -70% 0px', threshold: 0.1 },
        );
        headings.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, [toc]);

    const handleClick = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            window.history.replaceState(null, '', `#${id}`);
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!toc?.length) return null;

    return (
        <nav aria-label="Table of contents" className="text-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">On this page</p>
            <ul className="space-y-2 border-l border-gray-200">
                {toc.map((h) => (
                    <li key={h.id} style={{ paddingLeft: (h.level - 2) * 12 + 12 }}>
                        <a
                            href={`#${h.id}`}
                            onClick={(e) => handleClick(e, h.id)}
                            className={`-ml-px block border-l-2 pl-3 transition-colors ${activeId === h.id ? 'border-accent font-medium text-accent' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
