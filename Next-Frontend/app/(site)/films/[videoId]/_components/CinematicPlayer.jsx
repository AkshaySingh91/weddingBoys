'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './cinematicPlayer.css';

// ── Time Formatter (YouTube Style) ───────────────────────────────────────────
function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const totalSecs = Math.floor(seconds);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function CinematicPlayer({
    src,
    poster,
    title = 'Wedding Film',
    watermarkSrc = '/companyLogo.png',
    dominantColor = '#24140e',
    onPlay,
    onEnded,
    onNext,
    nextTitle,
    isTheater = true,
    onToggleTheater,
}) {
    // ─── Refs ────────────────────────────────────────────────────────────────
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const ambientVideoRef = useRef(null);
    const progressRef = useRef(null);
    const hideTimerRef = useRef(null);
    const bezelTimerRef = useRef(null);
    const clickTimerRef = useRef(null);
    const isSeekingRef = useRef(false);

    // ─── State ───────────────────────────────────────────────────────────────
    const [hasStarted, setHasStarted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);

    // Volume state (persisted)
    const [volume, setVolume] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cp_volume');
            return saved !== null ? parseFloat(saved) : 1;
        }
        return 1;
    });
    const [isMuted, setIsMuted] = useState(false);

    // Chrome state
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [quality, setQuality] = useState('1080p HD');
    const [isAmbient, setIsAmbient] = useState(true);
    const [isAutoplay, setIsAutoplay] = useState(true);

    // Scrubber hover state
    const [hoverPos, setHoverPos] = useState(null); // percentage 0..100
    const [hoverTime, setHoverTime] = useState('0:00');
    const [hoverPixel, setHoverPixel] = useState(0);

    // YouTube Center Bezel Animation ({ type: 'play' | 'pause' | 'rewind' | 'forward' | 'volume', value?: any, id: number })
    const [bezel, setBezel] = useState(null);

    // Settings menu mode: null | 'main' | 'speed' | 'quality'
    const [settingsMenu, setSettingsMenu] = useState(null);

    // ─── Trigger YouTube Bezel Animation ─────────────────────────────────────
    const triggerBezel = useCallback((type, value = null) => {
        setBezel({ type, value, id: Date.now() });
        if (bezelTimerRef.current) clearTimeout(bezelTimerRef.current);
        bezelTimerRef.current = setTimeout(() => {
            setBezel(null);
        }, 500);
    }, []);

    // ─── Controls Auto-Hide ──────────────────────────────────────────────────
    const resetHideTimer = useCallback(() => {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        if (isPlaying && !settingsMenu) {
            hideTimerRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 2500);
        }
    }, [isPlaying, settingsMenu]);

    const handleMouseMove = useCallback(() => {
        resetHideTimer();
    }, [resetHideTimer]);

    const handleMouseLeave = useCallback(() => {
        if (isPlaying && !settingsMenu) {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 600);
        }
    }, [isPlaying, settingsMenu]);

    // When paused, controls should always stay visible
    useEffect(() => {
        if (!isPlaying) {
            setControlsVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        } else {
            resetHideTimer();
        }
    }, [isPlaying, resetHideTimer]);

    // ─── Volume Persistence ──────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cp_volume', volume.toString());
        }
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // ─── Playback Speed Sync ─────────────────────────────────────────────────
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
        if (ambientVideoRef.current) {
            ambientVideoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // ─── Fullscreen Event Listener ───────────────────────────────────────────
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // ─── Sync Ambient Background Video ───────────────────────────────────────
    const syncAmbient = useCallback(() => {
        const video = videoRef.current;
        const ambient = ambientVideoRef.current;
        if (!video || !ambient || !isAmbient) return;

        if (Math.abs(ambient.currentTime - video.currentTime) > 0.3) {
            ambient.currentTime = video.currentTime;
        }
        if (video.paused && !ambient.paused) {
            ambient.pause();
        } else if (!video.paused && ambient.paused) {
            ambient.play().catch(() => { });
        }
    }, [isAmbient]);

    // ─── Video Events ────────────────────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => {
            if (!isSeekingRef.current) {
                setCurrentTime(video.currentTime);
            }
            syncAmbient();
        };

        const onDurationChange = () => {
            if (video.duration && !isNaN(video.duration)) {
                setDuration(video.duration);
            }
        };

        const onProgress = () => {
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
        };

        const onPlayEvent = () => {
            setIsPlaying(true);
            setIsBuffering(false);
            if (ambientVideoRef.current && isAmbient) {
                ambientVideoRef.current.play().catch(() => { });
            }
        };

        const onPauseEvent = () => {
            setIsPlaying(false);
            if (ambientVideoRef.current) {
                ambientVideoRef.current.pause();
            }
        };

        const onEndedEvent = () => {
            setIsPlaying(false);
            if (ambientVideoRef.current) {
                ambientVideoRef.current.pause();
            }
            onEnded?.();
            if (isAutoplay && onNext) {
                onNext();
            }
        };

        const onWaiting = () => setIsBuffering(true);
        const onPlaying = () => setIsBuffering(false);
        const onCanPlay = () => setIsBuffering(false);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('loadedmetadata', onDurationChange);
        video.addEventListener('progress', onProgress);
        video.addEventListener('play', onPlayEvent);
        video.addEventListener('pause', onPauseEvent);
        video.addEventListener('ended', onEndedEvent);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);
        video.addEventListener('canplay', onCanPlay);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('loadedmetadata', onDurationChange);
            video.removeEventListener('progress', onProgress);
            video.removeEventListener('play', onPlayEvent);
            video.removeEventListener('pause', onPauseEvent);
            video.removeEventListener('ended', onEndedEvent);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('canplay', onCanPlay);
        };
    }, [isAmbient, isAutoplay, onEnded, onNext, syncAmbient]);

    // ─── Play / Pause Actions ────────────────────────────────────────────────
    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().then(() => {
                setIsPlaying(true);
                triggerBezel('play');
            }).catch(() => { });
        } else {
            video.pause();
            setIsPlaying(false);
            triggerBezel('pause');
        }
        resetHideTimer();
    }, [resetHideTimer, triggerBezel]);

    const handleStartPlayback = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setHasStarted(true);
        video.play().then(() => {
            setIsPlaying(true);
            onPlay?.();
            triggerBezel('play');
        }).catch((err) => {
            console.warn('Playback error:', err);
        });
        resetHideTimer();
    }, [onPlay, resetHideTimer, triggerBezel]);

    // ─── Seeking ─────────────────────────────────────────────────────────────
    const seekRelative = useCallback((deltaSeconds) => {
        const video = videoRef.current;
        if (!video) return;
        const target = Math.max(0, Math.min(video.duration || 0, video.currentTime + deltaSeconds));
        video.currentTime = target;
        setCurrentTime(target);
        if (deltaSeconds > 0) {
            triggerBezel('forward', Math.abs(deltaSeconds));
        } else {
            triggerBezel('rewind', Math.abs(deltaSeconds));
        }
        syncAmbient();
        resetHideTimer();
    }, [resetHideTimer, syncAmbient, triggerBezel]);

    // ─── Volume Controls ─────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            triggerBezel('volume', next ? 0 : Math.round(volume * 100));
            return next;
        });
        resetHideTimer();
    }, [resetHideTimer, triggerBezel, volume]);

    const changeVolume = useCallback((newVol) => {
        const clamped = Math.max(0, Math.min(1, newVol));
        setVolume(clamped);
        if (clamped > 0 && isMuted) {
            setIsMuted(false);
        }
        if (clamped === 0) {
            setIsMuted(true);
        }
        triggerBezel('volume', Math.round(clamped * 100));
        resetHideTimer();
    }, [isMuted, resetHideTimer, triggerBezel]);

    // ─── Fullscreen & Miniplayer ─────────────────────────────────────────────
    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            (container.requestFullscreen || container.webkitRequestFullscreen)?.call(container);
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
        }
        resetHideTimer();
    }, [resetHideTimer]);

    const togglePiP = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.warn('PiP error:', err);
        }
        resetHideTimer();
    }, [resetHideTimer]);

    // ─── Global Keyboard Shortcuts (YouTube Standard) ────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Never capture when typing in inputs/textareas
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
                return;
            }

            // Never intercept browser or OS shortcut combinations (Cmd, Ctrl, Alt/Option, or Shift)
            // e.g., Cmd+Shift+I / Cmd+Option+I for DevTools/Inspect, Cmd+F for search, Cmd+T, etc.
            if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                return;
            }

            // Verify player container is on screen
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;
            if (!isInView) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    e.stopPropagation();
                    if (!hasStarted) {
                        handleStartPlayback();
                    } else {
                        togglePlayPause();
                    }
                    break;
                case 'KeyK':
                    e.preventDefault();
                    if (!hasStarted) {
                        handleStartPlayback();
                    } else {
                        togglePlayPause();
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyJ':
                    e.preventDefault();
                    seekRelative(-5);
                    break;
                case 'ArrowRight':
                case 'KeyL':
                    e.preventDefault();
                    seekRelative(5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    changeVolume(volume + 0.05);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    changeVolume(volume - 0.05);
                    break;
                case 'KeyM':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'KeyF':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'KeyT':
                    e.preventDefault();
                    onToggleTheater?.();
                    break;
                case 'KeyI':
                    e.preventDefault();
                    togglePiP();
                    break;
                case 'Digit0':
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                case 'Digit8':
                case 'Digit9': {
                    e.preventDefault();
                    const video = videoRef.current;
                    if (video && video.duration) {
                        const pct = parseInt(e.code.replace('Digit', ''), 10) / 10;
                        video.currentTime = pct * video.duration;
                        setCurrentTime(video.currentTime);
                        triggerBezel('forward', `${pct * 100}%`);
                    }
                    break;
                }
                case 'Escape':
                    if (settingsMenu) {
                        setSettingsMenu(null);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: false });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: false });
    }, [
        changeVolume,
        handleStartPlayback,
        hasStarted,
        onToggleTheater,
        seekRelative,
        settingsMenu,
        toggleFullscreen,
        toggleMute,
        togglePiP,
        togglePlayPause,
        volume,
    ]);

    // ─── Click / Double-Click Zone on Video ──────────────────────────────────
    const handleVideoClick = useCallback((e) => {
        // Prevent toggle if clicking on controls or menus
        if (e.target.closest('.cp-controls') || e.target.closest('.cp-menu') || e.target.closest('.cp-top-bar')) {
            return;
        }

        if (settingsMenu) {
            setSettingsMenu(null);
            return;
        }

        if (clickTimerRef.current) {
            // Double click detected -> Fullscreen
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
            toggleFullscreen();
        } else {
            // Single click -> Play/Pause
            clickTimerRef.current = setTimeout(() => {
                clickTimerRef.current = null;
                togglePlayPause();
            }, 220);
        }
    }, [settingsMenu, toggleFullscreen, togglePlayPause]);

    // ─── Progress Scrubber (Drag, Scrub, Click) ──────────────────────────────
    const computeScrubRatio = useCallback((clientX) => {
        const bar = progressRef.current;
        if (!bar) return 0;
        const rect = bar.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }, []);

    const handleProgressMouseMove = useCallback((e) => {
        const bar = progressRef.current;
        if (!bar) return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverPos(ratio * 100);
        setHoverPixel(e.clientX - rect.left);
        setHoverTime(formatTime(ratio * (duration || 0)));
    }, [duration]);

    const handleProgressMouseLeave = useCallback(() => {
        if (!isScrubbing) {
            setHoverPos(null);
        }
    }, [isScrubbing]);

    const handleProgressDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const ratio = computeScrubRatio(clientX);
        const targetTime = ratio * (duration || 0);

        isSeekingRef.current = true;
        setIsScrubbing(true);
        setCurrentTime(targetTime);

        if (videoRef.current) {
            videoRef.current.currentTime = targetTime;
        }

        const handleMove = (moveEvent) => {
            const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const moveRatio = computeScrubRatio(moveX);
            const moveTime = moveRatio * (duration || 0);
            setCurrentTime(moveTime);
            setHoverPos(moveRatio * 100);
            if (videoRef.current) {
                videoRef.current.currentTime = moveTime;
            }
        };

        const handleUp = (upEvent) => {
            const upX = upEvent.touches ? upEvent.touches[0].clientX : upEvent.clientX;
            const finalRatio = computeScrubRatio(upX);
            const finalTime = finalRatio * (duration || 0);

            if (videoRef.current) {
                videoRef.current.currentTime = finalTime;
            }
            setCurrentTime(finalTime);
            isSeekingRef.current = false;
            setIsScrubbing(false);
            setHoverPos(null);
            syncAmbient();

            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
    }, [computeScrubRatio, duration, syncAmbient]);

    // ─── Click Outside Settings Menu ─────────────────────────────────────────
    useEffect(() => {
        if (!settingsMenu) return;
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.cp-settings-container')) {
                setSettingsMenu(null);
            }
        };
        document.addEventListener('pointerdown', handleOutsideClick);
        return () => document.removeEventListener('pointerdown', handleOutsideClick);
    }, [settingsMenu]);

    // ─── Computed Percentages ────────────────────────────────────────────────
    const playedPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
    const bufferedPercent = duration > 0 ? Math.min(100, Math.max(0, (buffered / duration) * 100)) : 0;

    return (
        <div
            ref={containerRef}
            className={`cp-container ${!controlsVisible && isPlaying ? 'cp-cursor-hidden' : ''} ${isFullscreen ? 'cp-fullscreen' : ''} ${isTheater ? 'cp-theater' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                '--dominant-color': dominantColor,
            }}
        >
            {/* ══════════════════════════════════════════════════════════════
                1. AMBIENT BACKGROUND GLOW (YouTube Ambient Mode)
                Synchronized blurred video fill for left & right pillarbox
                ══════════════════════════════════════════════════════════════ */}
            <div className={`cp-ambient-glow ${isAmbient ? 'cp-ambient-active' : ''}`} aria-hidden="true">
                <video
                    ref={ambientVideoRef}
                    src={src}
                    muted
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    className="cp-ambient-video"
                />
                <div className="cp-ambient-vignette" />
            </div>

            {/* Left and Right Soft Gradients for edge blending */}
            <div className="cp-edge-gradient-left" aria-hidden="true" />
            <div className="cp-edge-gradient-right" aria-hidden="true" />

            {/* ══════════════════════════════════════════════════════════════
                2. MAIN VIDEO ELEMENT
                Clean HTML5 video without crossOrigin restriction
                ══════════════════════════════════════════════════════════════ */}
            <video
                ref={videoRef}
                src={src}
                className="cp-video"
                playsInline
                preload="metadata"
            />

            {/* ══════════════════════════════════════════════════════════════
                3. CLICK / DOUBLE-CLICK INTERACTION LAYER
                ══════════════════════════════════════════════════════════════ */}
            {hasStarted && (
                <div className="cp-click-surface" onClick={handleVideoClick} />
            )}

            {/* ══════════════════════════════════════════════════════════════
                4. POSTER OVERLAY (Before First Play)
                ══════════════════════════════════════════════════════════════ */}
            {!hasStarted && (
                <div className="cp-poster-screen" onClick={handleStartPlayback}>
                    {poster && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={poster} alt={title} className="cp-poster-img" />
                    )}
                    <div className="cp-poster-gradient" />

                    {/* Clean Video Play Button with brand red theme */}
                    <button className="cp-clean-play-btn" aria-label="Play video">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>

                    {/* Top title preview on poster */}
                    <div className="cp-poster-top">
                        <span className="cp-poster-title">{title}</span>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                5. CENTER PLAY/PAUSE ICON (Paused State)
                YouTube shows a clear play icon in center when paused
                ══════════════════════════════════════════════════════════════ */}
            {hasStarted && !isPlaying && !bezel && (
                <div className="cp-paused-center-btn" onClick={togglePlayPause} aria-label="Play">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                6. YOUTUBE CENTER BEZEL ANIMATION (Play, Pause, Seek Ripple)
                ══════════════════════════════════════════════════════════════ */}
            {bezel && (
                <div className="cp-bezel-wrapper" key={bezel.id}>
                    <div className={`cp-bezel ${bezel.type.startsWith('seek') ? 'cp-bezel-seek' : ''}`}>
                        {bezel.type === 'play' && (
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                        {bezel.type === 'pause' && (
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        )}
                        {bezel.type === 'rewind' && (
                            <div className="cp-seek-bezel-content">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                                    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                                </svg>
                                <span>-5s</span>
                            </div>
                        )}
                        {bezel.type === 'forward' && (
                            <div className="cp-seek-bezel-content">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                                    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                                </svg>
                                <span>+5s</span>
                            </div>
                        )}
                        {bezel.type === 'volume' && (
                            <div className="cp-volume-bezel-content">
                                <span>{bezel.value}%</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                7. BUFFERING SPINNER
                ══════════════════════════════════════════════════════════════ */}
            {isBuffering && hasStarted && (
                <div className="cp-spinner-container">
                    <div className="cp-spinner" />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                8. BRAND WATERMARK (Bottom-Right, above controls)
                ══════════════════════════════════════════════════════════════ */}
            {hasStarted && watermarkSrc && (
                <div className={`cp-watermark ${controlsVisible ? 'cp-watermark-dim' : ''}`} title="The Wedding Vachan">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={watermarkSrc} alt="The Wedding Vachan" />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                9. TOP BAR (Title on Hover)
                ══════════════════════════════════════════════════════════════ */}
            {hasStarted && (
                <div className={`cp-top-bar ${controlsVisible ? 'cp-show' : ''}`}>
                    <div className="cp-top-title">{title}</div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                10. YOUTUBE CONTROLS BAR (Bottom Chrome)
                ══════════════════════════════════════════════════════════════ */}
            {hasStarted && (
                <div className={`cp-controls ${controlsVisible ? 'cp-controls-visible' : ''}`}>
                    {/* ── Progress Scrubber Bar ── */}
                    <div
                        ref={progressRef}
                        className={`cp-progress-bar-container ${isScrubbing ? 'cp-scrubbing' : ''}`}
                        onMouseDown={handleProgressDown}
                        onTouchStart={handleProgressDown}
                        onMouseMove={handleProgressMouseMove}
                        onMouseLeave={handleProgressMouseLeave}
                    >
                        <div className="cp-progress-bar-track">
                            {/* Hover Ghost Bar */}
                            {hoverPos !== null && (
                                <div className="cp-progress-hover" style={{ width: `${hoverPos}%` }} />
                            )}
                            {/* Buffered Track */}
                            <div className="cp-progress-buffered" style={{ width: `${bufferedPercent}%` }} />
                            {/* Played Red Track */}
                            <div className="cp-progress-played" style={{ width: `${playedPercent}%` }} />
                            {/* Red Scrubber Knob */}
                            <div
                                className="cp-progress-scrubber-handle"
                                style={{ left: `${playedPercent}%` }}
                            />
                        </div>

                        {/* Tooltip Timestamp */}
                        {hoverPos !== null && (
                            <div
                                className="cp-time-tooltip"
                                style={{ left: `${hoverPixel}px` }}
                            >
                                {hoverTime}
                            </div>
                        )}
                    </div>

                    {/* ── Toolbar Bottom Row ── */}
                    <div className="cp-toolbar">
                        {/* ── LEFT CLUSTER: Play, Next, Volume, Time ── */}
                        <div className="cp-toolbar-left">
                            {/* Play / Pause Toggle */}
                            <button
                                className="cp-icon-btn"
                                onClick={togglePlayPause}
                                aria-label={isPlaying ? 'Pause (k)' : 'Play (k)'}
                                title={isPlaying ? 'Pause (k)' : 'Play (k)'}
                            >
                                {isPlaying ? (
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            {/* Next Video Button (if onNext available) */}
                            {onNext && (
                                <button
                                    className="cp-icon-btn"
                                    onClick={onNext}
                                    aria-label="Next film"
                                    title={nextTitle ? `Next: ${nextTitle}` : 'Next film (SHIFT+N)'}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                    </svg>
                                </button>
                            )}

                            {/* Volume Control Cluster */}
                            <div className="cp-volume-cluster">
                                <button
                                    className="cp-icon-btn cp-volume-btn"
                                    onClick={toggleMute}
                                    aria-label={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                                    title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                                >
                                    {isMuted || volume === 0 ? (
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                        </svg>
                                    ) : volume < 0.5 ? (
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                        </svg>
                                    )}
                                </button>
                                <div className="cp-volume-slider-wrapper">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.02"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => changeVolume(parseFloat(e.target.value))}
                                        className="cp-volume-slider"
                                        style={{
                                            '--volume-percent': `${(isMuted ? 0 : volume) * 100}%`,
                                        }}
                                        aria-label="Volume"
                                    />
                                </div>
                            </div>

                            {/* YouTube Style Time Display */}
                            <div className="cp-time-display">
                                <span className="cp-current-time">{formatTime(currentTime)}</span>
                                <span className="cp-time-sep"> / </span>
                                <span className="cp-duration">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* ── RIGHT CLUSTER: Autoplay, Settings, PiP, Theater, Fullscreen ── */}
                        <div className="cp-toolbar-right">
                            {/* Autoplay Toggle */}
                            <button
                                className={`cp-icon-btn cp-autoplay-toggle ${isAutoplay ? 'cp-autoplay-on' : ''}`}
                                onClick={() => setIsAutoplay(prev => !prev)}
                                title={`Autoplay is ${isAutoplay ? 'on' : 'off'}`}
                                aria-label="Toggle autoplay"
                            >
                                <span className="cp-autoplay-pill">
                                    <span className="cp-autoplay-circle">
                                        {isAutoplay ? (
                                            <svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor">
                                                <polygon points="2,1 8,5 2,9" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor">
                                                <rect x="2" y="2" width="2" height="6" />
                                                <rect x="6" y="2" width="2" height="6" />
                                            </svg>
                                        )}
                                    </span>
                                </span>
                            </button>

                            {/* Settings Gear & Menu */}
                            <div className="cp-settings-container">
                                <button
                                    className={`cp-icon-btn cp-settings-btn ${settingsMenu ? 'cp-settings-active' : ''}`}
                                    onClick={() => setSettingsMenu(prev => prev ? null : 'main')}
                                    aria-label="Settings"
                                    title="Settings"
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                                    </svg>
                                </button>

                                {/* YouTube Floating Settings Card */}
                                {settingsMenu && (
                                    <div className="cp-menu">
                                        {/* Main Settings Menu */}
                                        {settingsMenu === 'main' && (
                                            <div className="cp-menu-body">
                                                {/* Ambient Mode Toggle */}
                                                <div
                                                    className="cp-menu-item"
                                                    onClick={() => setIsAmbient(prev => !prev)}
                                                >
                                                    <div className="cp-menu-item-left">
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.79-.79C8.03 19.98 9.93 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                                                        </svg>
                                                        <span>Ambient mode</span>
                                                    </div>
                                                    <div className="cp-menu-item-right">
                                                        <span className={`cp-switch ${isAmbient ? 'cp-switch-on' : ''}`}>
                                                            <span className="cp-switch-thumb" />
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Playback Speed Item */}
                                                <div
                                                    className="cp-menu-item"
                                                    onClick={() => setSettingsMenu('speed')}
                                                >
                                                    <div className="cp-menu-item-left">
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                            <path d="M10 8v8l6-4-6-4zm11-5H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                                                        </svg>
                                                        <span>Playback speed</span>
                                                    </div>
                                                    <div className="cp-menu-item-right">
                                                        <span className="cp-menu-value">
                                                            {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
                                                        </span>
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                            <path d="M9.29 15.88L13.17 12 9.29 8.12a.996.996 0 1 1 1.41-1.41l4.59 4.59c.39.39.39 1.02 0 1.41L10.7 17.3a.996.996 0 0 1-1.41-1.42z" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Quality Item */}
                                                <div
                                                    className="cp-menu-item"
                                                    onClick={() => setSettingsMenu('quality')}
                                                >
                                                    <div className="cp-menu-item-left">
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                            <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12zM8 10h3v1.5H8V13h2v1H8v1h3.5v-4.5c0-.55-.45-1-1-1H8v1.5zm6.5-1h-2v6h3.5c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-1.5zm0 4.5h-1v-3.5h1v3.5z" />
                                                        </svg>
                                                        <span>Quality</span>
                                                    </div>
                                                    <div className="cp-menu-item-right">
                                                        <span className="cp-menu-value">{quality}</span>
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                            <path d="M9.29 15.88L13.17 12 9.29 8.12a.996.996 0 1 1 1.41-1.41l4.59 4.59c.39.39.39 1.02 0 1.41L10.7 17.3a.996.996 0 0 1-1.41-1.42z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Playback Speed Sub-menu */}
                                        {settingsMenu === 'speed' && (
                                            <div className="cp-menu-body">
                                                <div className="cp-menu-header" onClick={() => setSettingsMenu('main')}>
                                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                                    </svg>
                                                    <span>Playback speed</span>
                                                </div>
                                                {PLAYBACK_SPEEDS.map(speed => (
                                                    <div
                                                        key={speed}
                                                        className={`cp-menu-option ${playbackSpeed === speed ? 'cp-menu-option-active' : ''}`}
                                                        onClick={() => {
                                                            setPlaybackSpeed(speed);
                                                            setSettingsMenu(null);
                                                        }}
                                                    >
                                                        <span className="cp-check-icon">
                                                            {playbackSpeed === speed && (
                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                        <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Quality Sub-menu */}
                                        {settingsMenu === 'quality' && (
                                            <div className="cp-menu-body">
                                                <div className="cp-menu-header" onClick={() => setSettingsMenu('main')}>
                                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                                    </svg>
                                                    <span>Quality</span>
                                                </div>
                                                {['1080p HD', '720p', 'Auto'].map(q => (
                                                    <div
                                                        key={q}
                                                        className={`cp-menu-option ${quality === q ? 'cp-menu-option-active' : ''}`}
                                                        onClick={() => {
                                                            setQuality(q);
                                                            setSettingsMenu(null);
                                                        }}
                                                    >
                                                        <span className="cp-check-icon">
                                                            {quality === q && (
                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                        <span>{q}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Miniplayer (Picture-in-Picture) */}
                            <button
                                className="cp-icon-btn"
                                onClick={togglePiP}
                                aria-label="Miniplayer (i)"
                                title="Miniplayer (i)"
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                                </svg>
                            </button>

                            {/* Theater Mode Toggle */}
                            {onToggleTheater && (
                                <button
                                    className="cp-icon-btn"
                                    onClick={onToggleTheater}
                                    aria-label="Theater mode (t)"
                                    title="Theater mode (t)"
                                >
                                    {isTheater ? (
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                            <path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                            <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Fullscreen Toggle */}
                            <button
                                className="cp-icon-btn"
                                onClick={toggleFullscreen}
                                aria-label={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}
                                title={isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)'}
                            >
                                {isFullscreen ? (
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
