'use client';

import dynamic from 'next/dynamic';

// Leaflet + react-leaflet reference `window` on load, so the actual map is
// loaded client-only. This wrapper keeps the page import (`./_components/Map`)
// unchanged while guaranteeing no SSR evaluation of the mapping libraries.
const MapView = dynamic(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center text-ink-muted">
            Loading map…
        </div>
    ),
});

export default function Map() {
    return <MapView />;
}
