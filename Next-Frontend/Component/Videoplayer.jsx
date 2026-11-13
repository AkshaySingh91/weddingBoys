'use client';

/**
 * Videoplayer — the film player used in the lightbox, on story pages and in
 * admin. Same API as before: <Videoplayer src poster? autoPlay? title? />.
 *
 * Rebuilt (the old one rewrote Cloudinary quality URLs that no longer exist,
 * re-rendered on every timeupdate and animated the progress bar's width):
 *   - glass control bar that auto-hides after 2.5s idle, shows on move/tap
 *   - progress + buffered drawn with transform: scaleX from a rAF loop that
 *     runs only while playing — no React state per frame
 *   - scrubbing with pointer events (mouse, touch, pen), keyboard on the frame:
 *     Space/K play, J/L or ←/→ ±10s, M mute, F fullscreen
 *   - poster + spinner until the film can play; PiP and fullscreen where supported
 *   - autoPlay tries with sound (the viewer just pressed play) and falls back to
 *     muted if the browser refuses
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { MdPictureInPictureAlt } from 'react-icons/md';

const fmt = (s) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const BTN = 'grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-white transition-colors duration-micro ease-standard hover:bg-white/15 focus-ring';

export default function Videoplayer({ src, poster, autoPlay = false, title, className = '', onEnded }) {
    const wrapRef = useRef(null);
    const videoRef = useRef(null);
    const barRef = useRef(null);
    const bufRef = useRef(null);
    const timeRef = useRef(null);
    const hideTimer = useRef(0);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [ready, setReady] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [duration, setDuration] = useState(0);
    const [chrome, setChrome] = useState(true);
    const [full, setFull] = useState(false);

    // Draw progress, buffered and time from the element itself (no re-render).
    const draw = useCallback(() => {
        const v = videoRef.current; if (!v) return;
        const d = v.duration || 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${d ? v.currentTime / d : 0})`;
        if (bufRef.current && v.buffered.length) bufRef.current.style.transform = `scaleX(${d ? v.buffered.end(v.buffered.length - 1) / d : 0})`;
        if (timeRef.current) timeRef.current.textContent = `${fmt(v.currentTime)} / ${fmt(d)}`;
    }, []);
    useEffect(() => {
        if (!playing) return undefined;
        let id = 0;
        const loop = () => { draw(); id = requestAnimationFrame(loop); };
        id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [playing, draw]);

    // Controls auto-hide while playing.
    const poke = useCallback(() => {
        setChrome(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setChrome(false), 2500);
    }, []);
    useEffect(() => () => clearTimeout(hideTimer.current), []);

    const toggle = useCallback(() => {
        const v = videoRef.current; if (!v) return;
        if (v.paused) v.play().catch(() => {}); else v.pause();
        poke();
    }, [poke]);
    const seekBy = (s) => { const v = videoRef.current; if (v) { v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + s)); draw(); poke(); } };
    const toggleMute = () => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); poke(); } };
    const toggleFull = () => {
        const el = wrapRef.current; const v = videoRef.current;
        if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
        else if (el?.requestFullscreen) el.requestFullscreen();
        else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS: native fullscreen on the video
    };
    const pip = () => { const v = videoRef.current; if (!v) return; if (document.pictureInPictureElement) document.exitPictureInPicture(); else v.requestPictureInPicture?.().catch(() => {}); };

    useEffect(() => {
        const onFs = () => setFull(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
        document.addEventListener('fullscreenchange', onFs);
        document.addEventListener('webkitfullscreenchange', onFs);
        return () => { document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('webkitfullscreenchange', onFs); };
    }, []);

    // Autoplay with sound, falling back to muted.
    useEffect(() => {
        const v = videoRef.current;
        if (!autoPlay || !v) return;
        v.muted = false;
        v.play().catch(() => { v.muted = true; setMuted(true); v.play().catch(() => {}); });
    }, [autoPlay, src]);

    // Scrubbing
    const seekTo = (clientX) => {
        const v = videoRef.current; const track = barRef.current?.parentElement;
        if (!v || !track || !v.duration) return;
        const { left, width } = track.getBoundingClientRect();
        v.currentTime = Math.max(0, Math.min(1, (clientX - left) / width)) * v.duration;
        draw();
    };
    const onScrubDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seekTo(e.clientX); poke();
    };
    const onScrubMove = (e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e.clientX); };

    const onKey = (e) => {
        const k = e.key.toLowerCase();
        if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
        else if (k === 'arrowright' || k === 'l') { e.preventDefault(); seekBy(10); }
        else if (k === 'arrowleft' || k === 'j') { e.preventDefault(); seekBy(-10); }
        else if (k === 'm') toggleMute();
        else if (k === 'f') toggleFull();
    };

    const showChrome = chrome || !playing;
    const pipOk = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;

    return (
        <div ref={wrapRef} tabIndex={0} onKeyDown={onKey} onPointerMove={poke} aria-label={title ? `${title}, video player` : 'Video player'}
            className={`group/player relative aspect-video w-full overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-accent ${showChrome ? '' : 'cursor-none'} ${className}`}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                playsInline
                preload={autoPlay ? 'auto' : 'metadata'}
                className="h-full w-full object-contain"
                onClick={toggle}
                onDoubleClick={toggleFull}
                onPlay={() => { setPlaying(true); poke(); }}
                onPause={() => { setPlaying(false); setChrome(true); draw(); }}
                onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); draw(); }}
                onCanPlay={() => { setReady(true); setWaiting(false); }}
                onWaiting={() => setWaiting(true)}
                onPlaying={() => setWaiting(false)}
                onProgress={draw}
                onSeeked={draw}
                onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
                onEnded={onEnded}
            />

            {/* Big play (paused, not yet started) / spinner (buffering). */}
            {(!ready || waiting) && autoPlay ? (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
                    <span className="h-12 w-12 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                </span>
            ) : !playing && (
                <button type="button" onClick={toggle} aria-label="Play"
                    className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full
                               bg-white/85 text-ink shadow-lg backdrop-blur transition-transform duration-micro ease-standard hover:scale-105 focus-ring">
                    <FiPlay className="ml-1 h-6 w-6" />
                </button>
            )}

            {/* Control bar */}
            <div className={`absolute inset-x-2 bottom-2 transition-[opacity,transform] duration-ui ease-standard sm:inset-x-4 sm:bottom-4
                             ${showChrome ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}>
                <div className="flex items-center gap-1 rounded-[22px] bg-black/45 p-1 pr-2 ring-1 ring-white/15 backdrop-blur-xl sm:gap-2">
                    <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className={BTN}>
                        {playing ? <FiPause className="h-5 w-5" /> : <FiPlay className="ml-0.5 h-5 w-5" />}
                    </button>
                    <button type="button" onClick={() => seekBy(-10)} aria-label="Back 10 seconds" className={`${BTN} hidden sm:grid`}><FiRotateCcw className="h-[18px] w-[18px]" /></button>
                    <button type="button" onClick={() => seekBy(10)} aria-label="Forward 10 seconds" className={`${BTN} hidden sm:grid`}><FiRotateCw className="h-[18px] w-[18px]" /></button>

                    {/* Pointer target only; keyboard seeking is J/L/arrows on the frame. */}
                    <div aria-hidden="true"
                        onPointerDown={onScrubDown} onPointerMove={onScrubMove}
                        className="group/seek relative mx-1 flex h-11 flex-1 cursor-pointer touch-none items-center">
                        <span className="relative h-1 w-full overflow-hidden rounded-full bg-white/20 transition-[height] duration-micro group-hover/seek:h-1.5">
                            <span ref={bufRef} className="absolute inset-0 origin-left scale-x-0 bg-white/30" />
                            <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-accent" />
                        </span>
                    </div>

                    <span ref={timeRef} className="shrink-0 text-[12px] tabular-nums text-white/85">0:00 / {fmt(duration)}</span>
                    <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className={BTN}>
                        {muted ? <FiVolumeX className="h-[18px] w-[18px]" /> : <FiVolume2 className="h-[18px] w-[18px]" />}
                    </button>
                    {pipOk && (
                        <button type="button" onClick={pip} aria-label="Picture in picture" className={`${BTN} hidden sm:grid`}><MdPictureInPictureAlt className="h-[18px] w-[18px]" /></button>
                    )}
                    <button type="button" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} className={BTN}>
                        {full ? <FiMinimize className="h-[18px] w-[18px]" /> : <FiMaximize className="h-[18px] w-[18px]" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
