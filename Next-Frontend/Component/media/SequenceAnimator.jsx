'use client';

import { useEffect, useRef, useState } from 'react';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';

// Scroll-driven canvas frame sequence (Apple-style), built to survive weak
// phones. It adapts three ways to the network/hardware tier:
//   1. frame-skip   — 3G/low-RAM devices fetch every 2nd/3rd frame
//   2. canvas scale — backing store downscaled so each paint is cheaper
//   3. chunked load — bounded concurrency, never a burst of 100 requests
// A blur placeholder covers the canvas until the first frame is painted, and a
// prefers-reduced-motion / offline user just gets a static first frame.
//
// Props:
//   buildFrameUrl(index) → URL   (lets the caller thread CDN width/quality in)
//   frameCount, width, height, blurDataURL, scrollLength ('300vh')
export default function SequenceAnimator({
    buildFrameUrl,
    frameCount,
    width = 1920,
    height = 1080,
    blurDataURL,
    scrollLength = '300vh',
    className = '',
}) {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const framesRef = useRef(new Map());      // index → HTMLImageElement (only loaded ones)
    const loadedIdxRef = useRef([]);          // sorted list of loaded indices
    const rafRef = useRef(0);
    const drawPendingRef = useRef(false);

    const { frameEveryNth, canvasScale, tier } = useNetworkStatus();
    const [loadedCount, setLoadedCount] = useState(0);
    const [firstPainted, setFirstPainted] = useState(false);

    // Which frames this tier actually downloads (always include the last).
    const planIndices = () => {
        const idx = [];
        for (let i = 0; i < frameCount; i += frameEveryNth) idx.push(i);
        if (idx[idx.length - 1] !== frameCount - 1) idx.push(frameCount - 1);
        return idx;
    };

    // Nearest already-loaded frame to `target` (binary-ish search on sorted list).
    const nearestLoaded = (target) => {
        const list = loadedIdxRef.current;
        if (list.length === 0) return null;
        let best = list[0];
        let bestDist = Math.abs(target - best);
        for (let i = 1; i < list.length; i += 1) {
            const d = Math.abs(target - list[i]);
            if (d < bestDist) { best = list[i]; bestDist = d; }
            else if (list[i] > target && d > bestDist) break; // list sorted → past the minimum
        }
        return framesRef.current.get(best);
    };

    const draw = (progress) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const target = Math.min(frameCount - 1, Math.max(0, Math.round(progress * (frameCount - 1))));
        const img = nearestLoaded(target);
        if (!img) return;

        // object-fit: cover into the canvas backing store.
        const cw = canvas.width;
        const ch = canvas.height;
        const scale = Math.max(cw / img.width, ch / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const scrollProgress = () => {
        const el = wrapRef.current;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) return 0;
        return Math.min(1, Math.max(0, -rect.top / total));
    };

    // ---- Size the canvas backing store (downscaled on weak devices) ----
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : 1);
        canvas.width = Math.round(width * canvasScale * dpr);
        canvas.height = Math.round(height * canvasScale * dpr);
        // Repaint at the current scroll position after a resize.
        draw(scrollProgress());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasScale, tier, width, height]);

    // ---- Chunked, concurrency-limited preloader ----
    useEffect(() => {
        if (!frameCount || typeof buildFrameUrl !== 'function') return;

        let cancelled = false;
        const indices = planIndices();
        const concurrency = tier === 'high' ? 8 : tier === 'medium' ? 4 : 2;
        let cursor = 0;

        const loadOne = (index) => new Promise((resolve) => {
            const img = new window.Image();
            img.decoding = 'async';
            img.onload = () => {
                if (cancelled) return resolve();
                framesRef.current.set(index, img);
                const list = loadedIdxRef.current;
                // keep sorted insert
                let lo = 0; let hi = list.length;
                while (lo < hi) { const mid = (lo + hi) >> 1; if (list[mid] < index) lo = mid + 1; else hi = mid; }
                list.splice(lo, 0, index);
                setLoadedCount((c) => c + 1);
                // Paint the very first available frame ASAP (async callback, so
                // updating firstPainted here is safe — not a synchronous effect).
                if (list.length === 1) {
                    draw(scrollProgress());
                    setFirstPainted(true);
                }
                resolve();
            };
            img.onerror = () => resolve();
            img.src = buildFrameUrl(index);
        });

        const worker = async () => {
            while (!cancelled && cursor < indices.length) {
                const myIndex = indices[cursor];
                cursor += 1;
                await loadOne(myIndex);
            }
        };

        // Load the first frame immediately, then fan out workers.
        loadOne(indices[0]).then(() => {
            for (let i = 0; i < concurrency; i += 1) worker();
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [frameCount, frameEveryNth, tier]);

    // ---- Scroll → rAF-throttled draw ----
    useEffect(() => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

        const onScroll = () => {
            if (reduce || drawPendingRef.current) return;
            drawPendingRef.current = true;
            rafRef.current = requestAnimationFrame(() => {
                drawPendingRef.current = false;
                draw(scrollProgress());
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        draw(scrollProgress());
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const plannedTotal = planIndices().length;
    const pct = plannedTotal ? Math.round((loadedCount / plannedTotal) * 100) : 0;

    return (
        <div ref={wrapRef} className={`relative ${className}`} style={{ height: scrollLength }}>
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-black">
                {/* Blur placeholder until the first frame paints */}
                {!firstPainted && blurDataURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blurDataURL} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl" />
                )}
                <canvas
                    ref={canvasRef}
                    className="h-full w-full object-cover"
                    style={{ aspectRatio: `${width} / ${height}` }}
                />
                {/* Lightweight loading readout while frames stream in */}
                {!firstPainted && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
                        Loading experience… {pct}%
                    </div>
                )}
            </div>
        </div>
    );
}
