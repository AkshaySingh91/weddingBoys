'use client';

import { useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fireMessage } from '@/Utils/fireMessage.js';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import {
  MapPin,
  Heart,
  Trash,
  SidebarSimple,
  CircleNotch,
  CalendarBlank,
} from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function MapView() {
  const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(true);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMapClients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/map-clients`);
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      setClients(data.clients || []);
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapClients();
  }, []);

  const deleteMapClient = async () => {
    if (!deleteConfirmId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${api_url}/api/admin/map-clients`, {
        method: 'DELETE',
        body: JSON.stringify({ clientId: deleteConfirmId }),
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
      });
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      setClients((prev) => prev.filter((c) => c.clientId !== deleteConfirmId));
      fireMessage('Map destination pin deleted.', 'success');
      setDeleteConfirmId(null);
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const heartIcon = new L.DivIcon({
    html: `<div class="p-1.5 rounded-full bg-[#A3603A] text-white shadow-lg border-2 border-white flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40Z"></path>
            </svg>
          </div>`,
    className: 'custom-map-heart-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DCD3] pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-serif text-[#1C1917]">
            <MapPin size={20} weight="fill" className="text-[#A3603A]" />
            Heritage Destination Map
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Interactive map coordinates of destination weddings across Udaipur, Jaipur, Varanasi, Goa, and beyond.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={SidebarSimple}
          onClick={() => setIsMapSidebarOpen((prev) => !prev)}
        >
          {isMapSidebarOpen ? 'Hide Destination List' : 'Show Destinations'}
        </Button>
      </div>

      {/* Map Container View */}
      <div className="relative h-[550px] w-full overflow-hidden rounded-2xl border border-[#E5DCD3] bg-stone-100 shadow-sm">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <CircleNotch size={24} className="animate-spin text-[#A3603A]" />
          </div>
        ) : (
          <>
            <MapContainer
              center={[22.5, 78.9]}
              zoom={5}
              minZoom={3}
              maxZoom={10}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

              {clients.map((c) => {
                const lat = Number.parseFloat(c.coordinate?.latitude);
                const lng = Number.parseFloat(c.coordinate?.longitute);
                if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

                return (
                  <Marker key={c.clientId} position={[lat, lng]} riseOnHover icon={heartIcon}>
                    <Popup closeOnClick={false} className="custom-studio-popup">
                      <div className="text-center p-1 font-sans">
                        <Link href={`/films/${c.video?._id}`} className="block overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="w-44 h-28 object-cover rounded-lg border border-stone-200"
                            src={c.url}
                            alt="Map destination"
                          />
                        </Link>
                        <div className="mt-2 text-center">
                          <p className="text-xs font-semibold uppercase text-stone-900">
                            {c.clientName?.Bride} & {c.clientName?.Groom}
                          </p>
                          <p className="text-[11px] text-[#A3603A] font-medium mt-0.5">
                            {c.photo?.photoLocation?.city || c.video?.videoLocation?.city || 'India'}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Slide-out Destination Drawer */}
            {isMapSidebarOpen && (
              <div className="absolute top-3 right-3 bottom-3 z-[1000] w-80 max-w-[calc(100%-24px)] rounded-2xl border border-[#E5DCD3] bg-white/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden">
                <div className="p-3.5 border-b border-[#E5DCD3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart size={16} weight="fill" className="text-[#A3603A]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                      Pinned Shoots ({clients.length})
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-[#E5DCD3]/60 p-2 scrollbar-thin">
                  {clients.length === 0 ? (
                    <p className="p-6 text-center text-xs text-stone-400">No destination shoots pinned.</p>
                  ) : (
                    clients.map((c) => (
                      <div key={c.clientId} className="p-2 flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#E5DCD3] bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.url} alt="Client" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1C1917] truncate">
                              {c.clientName?.Bride} & {c.clientName?.Groom}
                            </p>
                            <p className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                              <MapPin size={10} className="text-[#A3603A]" />
                              {c.photo?.photoLocation?.city || c.video?.videoLocation?.city || 'Destination'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(c.clientId)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                          title="Remove map pin"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Destination Pin?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this couple shoot pin from the homepage heritage map?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteMapClient} loading={isDeleting}>
              Remove Pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
