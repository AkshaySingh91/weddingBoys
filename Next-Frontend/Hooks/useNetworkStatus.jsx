'use client';

import { useEffect, useState } from 'react';

// Collapse connection + hardware signals into a single tier the whole app can
// key off. `saveData` (Data Saver) always wins → 'low'.
function computeTier(conn, deviceMemory) {
    if (!conn) return 'high'; // API unsupported (Safari/Firefox) → assume capable
    if (conn.saveData) return 'low';

    const et = conn.effectiveType || '4g';
    if (et === 'slow-2g' || et === '2g') return 'low';
    if (et === '3g') return 'medium';
    // 4g+ but a low-RAM device → step down so the main thread survives.
    if (deviceMemory && deviceMemory <= 2) return 'medium';
    return 'high';
}

// Per-tier delivery budget consumed by images, video and the canvas sequence.
const TIER_PROFILE = {
    high: { imageQuality: 82, maxVideoHeight: 1080, frameEveryNth: 1, canvasScale: 1 },
    medium: { imageQuality: 68, maxVideoHeight: 720, frameEveryNth: 2, canvasScale: 0.75 },
    low: { imageQuality: 55, maxVideoHeight: 480, frameEveryNth: 3, canvasScale: 0.5 },
};

export default function useNetworkStatus() {
    // SSR-safe default; real value resolves after mount.
    const [tier, setTier] = useState('high');
    const [online, setOnline] = useState(true);

    useEffect(() => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const deviceMemory = navigator.deviceMemory;

        const update = () => setTier(computeTier(conn, deviceMemory));
        const setOn = () => setOnline(navigator.onLine);

        update();
        setOn();

        conn?.addEventListener?.('change', update);
        window.addEventListener('online', setOn);
        window.addEventListener('offline', setOn);
        return () => {
            conn?.removeEventListener?.('change', update);
            window.removeEventListener('online', setOn);
            window.removeEventListener('offline', setOn);
        };
    }, []);

    return { tier, online, ...TIER_PROFILE[tier] };
}
