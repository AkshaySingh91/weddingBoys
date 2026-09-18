'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FilmSlate,
  MagnifyingGlass,
  X,
  Plus,
  MapPin,
  Check,
  VideoCamera,
  Camera,
} from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function ClientShowcasePickerModal({ isOpen, onClose, onSelectClient }) {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = encodeURIComponent(query.trim());
        const res = await fetch(`${api_url}/api/admin/embed/clients?query=${q}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!ignore) {
          if (res.ok && data.clients) {
            setClients(data.clients);
          } else {
            setError(data.error || 'Failed to fetch client showcases');
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const timer = setTimeout(fetchClients, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#E5DCD3] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8C532B]/10 text-[#8C532B]">
              <FilmSlate size={20} weight="bold" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-stone-900">
                Link Client Showcase &amp; Film
              </h2>
              <span className="text-[11px] font-medium text-stone-500">
                Embed an interactive studio client portfolio card into the article
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="border-b border-stone-100 p-4">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search couples by bride, groom, venue, or tag..."
              className="w-full rounded-xl border border-[#E5DCD3] bg-stone-50/70 py-2.5 pl-10 pr-4 text-xs text-stone-900 focus:border-[#8C532B] focus:bg-white focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="max-h-[420px] overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">
              Searching studio client portfolio...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-500">
              {error}
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No client showcases found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {clients.map((c) => {
                const poster = c.videos?.[0]?.poster || c.photos?.[0]?.url || null;
                const venue = c.videos?.[0]?.venue || c.photos?.[0]?.venue || '';

                return (
                  <div
                    key={c.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/40 p-3.5 transition-all hover:border-[#8C532B] hover:bg-white hover:shadow-md"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-stone-200">
                      {poster ? (
                        <Image
                          src={poster}
                          alt={c.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 300px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                          No Poster
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex gap-1.5">
                        {c.videos?.length > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            <VideoCamera size={11} /> {c.videos.length}
                          </span>
                        )}
                        {c.photos?.length > 0 && (
                          <span className="flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            <Camera size={11} /> {c.photos.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-sm font-bold text-stone-900 line-clamp-1">
                          {c.title}
                        </h3>
                        {venue && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#8C532B] line-clamp-1">
                            <MapPin size={12} weight="bold" />
                            <span>{venue}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                          Client Portfolio
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectClient(c);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#8C532B] px-3 py-1 text-xs font-semibold text-white hover:bg-[#724222] transition-colors cursor-pointer shadow-sm"
                        >
                          <Plus size={12} weight="bold" />
                          Embed Card
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-6 py-3 text-xs text-stone-400">
          <span>Cross-links seamlessly to client video stream and photo galleries.</span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
