'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Files, CaretRight, Plus, CircleNotch } from '@phosphor-icons/react';
import { apiJson } from '@/lib/apiClient.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { DEFAULT_PAGES } from './_components/config.js';

export default function ContentPagesList() {
  const [pages, setPages] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiJson('/api/admin/content');
        if (cancelled) return;
        // Merge managed defaults with whatever already exists in the DB.
        const byKey = new Map(DEFAULT_PAGES.map((p) => [p.pageKey, { ...p, blockCount: 0, status: '—' }]));
        for (const p of data.pages || []) byKey.set(p.pageKey, { ...byKey.get(p.pageKey), ...p });
        setPages([...byKey.values()]);
      } catch (err) {
        if (!cancelled) {
          setPages(DEFAULT_PAGES);
          fireMessage(err.message, 'error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    const key = newKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    if (!key) return;
    setCreating(true);
    try {
      // GET auto-creates an empty page document.
      await apiJson(`/api/admin/content/${key}`);
      setPages((prev) =>
        prev.some((p) => p.pageKey === key)
          ? prev
          : [...prev, { pageKey: key, title: key, blockCount: 0, status: 'Published' }]
      );
      setNewKey('');
      fireMessage('Page created successfully', 'success');
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-4xl">
      <PageHeader
        title="Page Content Management (CMS)"
        subtitle="Compose and manage modular block content for marketing pages. Assets are linked directly with Cloudflare R2 Media Library."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Content CMS' },
        ]}
      />

      {/* Pages List */}
      {pages === null ? (
        <div className="flex items-center justify-center gap-2 p-12 text-stone-400">
          <CircleNotch size={20} className="animate-spin text-red-500" />
          <span className="text-xs">Loading CMS pages…</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pages.map((p) => (
            <Link
              key={p.pageKey}
              href={`/admin/content/${p.pageKey}`}
              className="flex items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-sm hover:border-red-200 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                <Files size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-sans font-semibold capitalize text-[#2F2F2F] text-sm">
                    {p.title || p.pageKey}
                  </p>
                  {p.status && p.status !== '—' && (
                    <Badge variant={p.status === 'Published' ? 'success' : 'neutral'} size="sm">
                      {p.status}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-stone-500 font-sans mt-0.5 tabular-nums">
                  /{p.pageKey}
                  {typeof p.blockCount === 'number' && ` · ${p.blockCount} block${p.blockCount === 1 ? '' : 's'}`}
                </p>
              </div>

              <CaretRight size={16} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      )}

      {/* Create New Page Form */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Create New Custom Page
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            Add a unique URL slug for guidelines, destination showcases, or legal policies.
          </p>
        </div>

        <form onSubmit={create} className="flex gap-2.5">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="new-page-key (e.g. pre-wedding-guidelines)"
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-[#2F2F2F] placeholder:text-stone-400 outline-none focus:border-red-400 focus:bg-white transition-all font-sans"
          />
          <Button
            type="submit"
            variant="terracotta"
            size="sm"
            loading={creating}
            disabled={creating || !newKey.trim()}
            icon={Plus}
          >
            Create Page
          </Button>
        </form>
      </div>
    </div>
  );
}
