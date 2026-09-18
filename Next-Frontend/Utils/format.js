/**
 * Shared formatters for media figures.
 *
 * Two byte formatters existed before this — one in the media library page and
 * one in Uploader.jsx — which disagreed on precision and on what to show for
 * zero. Anything rendering a size should import from here.
 */

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 481401 → "470 KB" · 13902144 → "13.3 MB" */
export function formatBytes(bytes, { placeholder = '—' } = {}) {
    if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return placeholder;
    const n = Number(bytes);
    if (n === 0) return '0 B';

    let value = Math.abs(n);
    let unit = 0;
    while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
        value /= 1024;
        unit += 1;
    }
    // One decimal below 10 so "1.4 MB" and "9.8 MB" keep their resolution,
    // none above it where the extra digit is noise.
    const decimals = unit === 0 ? 0 : value < 10 ? 1 : 0;
    return `${n < 0 ? '-' : ''}${value.toFixed(decimals)} ${BYTE_UNITS[unit]}`;
}

/** Bytes per second → "4.2 MB/s". */
export function formatSpeed(bytesPerSecond) {
    if (!bytesPerSecond || bytesPerSecond <= 0) return '—';
    return `${formatBytes(bytesPerSecond)}/s`;
}

/** Seconds remaining → "18s" · "4m 05s" · "1h 12m". */
export function formatEta(seconds) {
    if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '—';
    const s = Math.round(seconds);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
    return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
}

/** Seconds of footage → "1:29". */
export function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return null;
    const total = Math.round(Number(seconds));
    if (!Number.isFinite(total)) return null;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}

/** 1920x1080 → "1920 × 1080". Returns null when either side is missing. */
export const formatDimensions = (width, height) => (width && height ? `${width} × ${height}` : null);
