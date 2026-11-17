import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Menu,
  Sparkles,
  Layout,
  Music,
  BookOpen,
  Users,
} from 'lucide-react';
import { PillButton, IconButton, Tooltip, Modal, Popover, Eyebrow, Slider } from '@/components/ui';
import { useUiStore } from '@/features/ui/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useAmbientStore, selectIsAudible } from '@/features/audio/ambient/store';
import { ambientEngine } from '@/features/audio/ambient/engine';
import { primeAudioContext } from '@/features/audio/chime';
import { cn } from '@/lib/cn';

/**
 * Original geometric cozy cat face icon for Purrfocus branding.
 */
export const PurrfocusLogoIcon: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Head and ears contour */}
    <path
      d="M7 11L5 5L12 8C13.2 7.3 14.6 7 16 7C17.4 7 18.8 7.3 20 8L27 5L25 11C27.5 13.5 28.5 17 28 20.5C27 25 22 28 16 28C10 28 5 25 4 20.5C3.5 17 4.5 13.5 7 11Z"
      fill="currentColor"
      fillOpacity="0.12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner ear soft accents */}
    <path
      d="M8.5 9L7 6L11 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    />
    <path
      d="M23.5 9L25 6L21 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    />
    {/* Cute happy sleepy eyes */}
    <path
      d="M10.5 17C11.5 18 13 18 13.5 17"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M18.5 17C19 18 20.5 18 21.5 17"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    {/* Sweet nose & mouth */}
    <path
      d="M15 19.5L16 20.7L17 19.5H15Z"
      fill="currentColor"
      className="text-accent"
    />
    <path
      d="M14.5 22C15.2 22.8 16 22.8 16 21C16 22.8 16.8 22.8 17.5 22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const Header: React.FC = () => {
  const location = useLocation();
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useUiStore();

  const focusMode = usePrefsStore(state => state.focusMode);
  const toggleFocusMode = usePrefsStore(state => state.toggleFocusMode);
  const setFocusMode = usePrefsStore(state => state.setFocusMode);

  const sfxOn = usePrefsStore(state => state.sfxOn);
  const toggleSfx = usePrefsStore(state => state.toggleSfx);

  const rareEventsOn = usePrefsStore(state => state.rareEventsOn);
  const toggleRareEvents = usePrefsStore(state => state.toggleRareEvents);

  const clockFormat = usePrefsStore(state => state.clockFormat);
  const setClockFormat = usePrefsStore(state => state.setClockFormat);

  const ambientMaster = useAmbientStore(state => state.master);
  const ambientMuted = useAmbientStore(state => state.muted);
  const setAmbientMaster = useAmbientStore(state => state.setMaster);
  const toggleAmbientMute = useAmbientStore(state => state.toggleMute);
  const isAmbientAudible = useAmbientStore(selectIsAudible);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  // Focus Mode live region announcement
  const [announcement, setAnnouncement] = useState('');
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setAnnouncement(focusMode ? 'Focus mode on' : 'Focus mode off');
  }, [focusMode]);

  // Check Fullscreen API support
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isSupported = Boolean(
        document.fullscreenEnabled ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (document as any).webkitFullscreenEnabled,
      );
      setFullscreenSupported(isSupported);

      const handleFullscreenChange = () => {
        setIsFullscreen(Boolean(document.fullscreenElement));
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, []);

  const isHome = location.pathname === '/';

  // Global 'f' shortcut & 'Escape' exit with modal/sheet/popover precedence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Mode shortcut is Home-only
      if (!isHome) return;

      // Shortcut 'f' / 'F' toggles Focus Mode (guarded from inputs/textareas)
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // 'Escape' exits Focus Mode ONLY if no modal dialog, sheet, or popover menu is open
      if (e.key === 'Escape' && focusMode) {
        if (e.defaultPrevented) return;

        const hasOpenOverlay = Boolean(
          document.querySelector('[role="dialog"]') ||
          document.querySelector('[role="menu"]')
        );
        if (hasOpenOverlay) return;

        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, setFocusMode, toggleFocusMode, isHome]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Fullscreen may be rejected by user agent
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch {
        // Exit fullscreen ignored
      }
    }
  };

  return (
    <header className="relative w-full border-b border-glass-border/40 z-header px-4 sm:px-8 py-3.5 transition-colors">
      {/* Polite live region for Focus Mode screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="max-w-[1060px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Wordmark (Unboxed, high contrast) */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-pill transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Purrfocus home"
        >
          <div className="flex items-center justify-center text-surface group-hover:text-accent transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <PurrfocusLogoIcon className="h-5 w-5" />
          </div>
          <span className="font-serif text-lg font-medium tracking-tight text-surface [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
            purrfocus<span className="text-accent">.</span>
          </span>
        </Link>

        {/* Center: Status pill (hidden on mobile and in focus mode) */}
        {!focusMode && (
          <div className="hidden lg:flex items-center">
            <div className="glass px-3.5 lg:px-4 py-1.5 rounded-pill border border-glass-border flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <Eyebrow className="text-ink-700 tracking-[0.15em] lg:tracking-[0.2em] font-medium whitespace-nowrap">
                YOUR LITTLE CORNER OF CALM
              </Eyebrow>
            </div>
          </div>
        )}

        {/* Right: Desktop Controls */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
          {/* Nav links: My desk, My journal, Study with friends */}
          {!focusMode && (
            <nav aria-label="Main navigation" className="flex items-center gap-1.5">
              <Link
                to="/desk"
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill font-sans text-small font-medium transition-all ${
                  location.pathname === '/desk'
                    ? 'bg-ink-900 text-surface shadow-sm'
                    : 'glass text-ink-700 hover:glass-strong hover:text-ink-900'
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
              >
                <Layout className="h-3.5 w-3.5" />
                <span>My desk</span>
              </Link>
              <Link
                to="/journal"
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill font-sans text-small font-medium transition-all ${
                  location.pathname === '/journal'
                    ? 'bg-ink-900 text-surface shadow-sm'
                    : 'glass text-ink-700 hover:glass-strong hover:text-ink-900'
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>My journal</span>
              </Link>
              <Link
                to="/rooms"
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill font-sans text-small font-medium transition-all ${
                  location.pathname === '/rooms'
                    ? 'bg-ink-900 text-surface shadow-sm'
                    : 'glass text-ink-700 hover:glass-strong hover:text-ink-900'
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Study with friends</span>
              </Link>
            </nav>
          )}

          {/* Quick controls cluster: focus mode, sound, fullscreen */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Quick controls">
            {/* Focus Mode toggle pill button (Home only) */}
            {isHome && (
              <Tooltip
                content={focusMode ? 'Exit focus mode (Esc)' : 'Enter focus mode (f)'}
              >
                <PillButton
                  variant={focusMode ? 'primary' : 'glass'}
                  size="sm"
                  leftIcon={focusMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  onClick={toggleFocusMode}
                  aria-pressed={focusMode}
                  className="h-8 text-small whitespace-nowrap"
                >
                  {focusMode ? 'Exit focus' : 'Focus mode'}
                </PillButton>
              </Tooltip>
            )}

            {/* Sound settings mini popover */}
            {!focusMode && (
              <Popover
                role="dialog"
                ariaLabel="Sound & visitors preferences"
                trigger={
                  <IconButton
                    label="Sound and visitor settings"
                    size="sm"
                    className={cn(!sfxOn && 'opacity-70', 'h-8 w-8')}
                  >
                    {sfxOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </IconButton>
                }
              >
                <div className="w-64 p-3.5 flex flex-col gap-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-body font-medium text-ink-900">Sound effects</span>
                      <span className="text-micro text-ink-500">Chimes, clicks and purrs</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sfxOn}
                      aria-label="Toggle sound effects"
                      onClick={toggleSfx}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                        sfxOn ? 'bg-accent' : 'bg-ink-500/30',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm ring-0 transition duration-200 ease-in-out translate-y-0.5',
                          sfxOn ? 'translate-x-5' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-glass-border/60 pt-2.5">
                    <div className="flex flex-col">
                      <span className="text-body font-medium text-ink-900">Little visitors</span>
                      <span className="text-micro text-ink-500">Butterflies and leaves</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rareEventsOn}
                      aria-label="Toggle little visitors"
                      onClick={toggleRareEvents}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                        rareEventsOn ? 'bg-accent' : 'bg-ink-500/30',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm ring-0 transition duration-200 ease-in-out translate-y-0.5',
                          rareEventsOn ? 'translate-x-5' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-glass-border/60 pt-2.5">
                    <div className="flex flex-col">
                      <span className="text-body font-medium text-ink-900">Clock format</span>
                      <span className="text-micro text-ink-500">Live clock style</span>
                    </div>
                    <div className="flex items-center gap-1 glass p-0.5 rounded-pill border border-glass-border">
                      {(['auto', '12h', '24h'] as const).map(fmt => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setClockFormat(fmt)}
                          aria-pressed={clockFormat === fmt}
                          className={cn(
                            'px-2 py-0.5 rounded-pill text-micro font-medium transition-colors',
                            clockFormat === fmt
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-ink-600 hover:text-ink-900',
                          )}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-glass-border/60 pt-2.5 flex flex-col gap-2 font-sans">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-body font-medium text-ink-900 flex items-center gap-1.5">
                          <Music className="h-3.5 w-3.5 text-accent" />
                          <span>Ambient sound</span>
                        </span>
                        <span className="text-micro text-ink-500">
                          {isAmbientAudible ? 'Playing' : ambientMuted ? 'Muted' : 'Sound off'}
                        </span>
                      </div>

                      <IconButton
                        label={ambientMuted ? 'Unmute ambient sound' : 'Mute ambient sound'}
                        size="sm"
                        onClick={() => {
                          primeAudioContext();
                          ambientEngine.startEngine();
                          toggleAmbientMute();
                        }}
                        className="h-7 w-7 text-ink-700"
                      >
                        {ambientMuted ? (
                          <VolumeX className="h-3.5 w-3.5 text-ink-500" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5 text-accent" />
                        )}
                      </IconButton>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-micro text-ink-500">
                        <span>Volume</span>
                        <span className="tabular-nums font-medium text-ink-700">
                          {ambientMuted ? 'Muted' : `${Math.round(ambientMaster * 100)}%`}
                        </span>
                      </div>
                      <Slider
                        aria-label="Header ambient master volume"
                        aria-valuetext={`${Math.round(ambientMaster * 100)}%`}
                        value={Math.round(ambientMaster * 100)}
                        onChange={val => {
                          primeAudioContext();
                          ambientEngine.startEngine();
                          setAmbientMaster(val / 100);
                        }}
                        min={0}
                        max={100}
                        step={1}
                        showValue={false}
                      />
                    </div>

                    <p className="text-micro text-ink-500 italic pt-0.5">
                      Open the mood card to mix
                    </p>
                  </div>
                </div>
              </Popover>
            )}

            {/* Fullscreen button */}
            {fullscreenSupported && (
              <Tooltip content={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                <IconButton
                  label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  size="sm"
                  onClick={toggleFullscreen}
                  className="h-8 w-8"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Mobile Controls (< 768px) */}
        <div className="flex md:hidden items-center gap-2">
          <IconButton
            label="Open navigation menu"
            size="md"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      {/* Mobile Drawer Sheet */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        variant="bottom"
        title="Navigation & Controls"
        showTitle
        className="w-full max-h-[85vh] overflow-y-auto"
      >
        <div className="flex flex-col gap-3 py-2">
          {/* Centered status pill */}
          <div className="flex items-center gap-2 px-4 py-3 min-h-[44px] glass rounded-tile">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <Eyebrow className="text-ink-700">YOUR LITTLE CORNER OF CALM</Eyebrow>
          </div>

          {/* Secondary routes */}
          <Link
            to="/desk"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Layout className="h-4 w-4 text-accent shrink-0" />
              <span>My desk</span>
            </span>
            <span className="text-small text-ink-500">Go ↗</span>
          </Link>

          <Link
            to="/journal"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-accent shrink-0" />
              <span>My journal</span>
            </span>
            <span className="text-small text-ink-500">Go ↗</span>
          </Link>

          <Link
            to="/rooms"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-accent shrink-0" />
              <span>Study with friends</span>
            </span>
            <span className="text-small text-ink-500">Go ↗</span>
          </Link>

          {/* Focus mode (without desktop shortcut hint) */}
          {isHome && (
            <button
              type="button"
              onClick={() => {
                toggleFocusMode();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                {focusMode ? (
                  <Sun className="h-4 w-4 text-warning shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 text-accent shrink-0" />
                )}
                <span>{focusMode ? 'Exit focus mode' : 'Enter focus mode'}</span>
              </span>
              <span className="text-small text-ink-500">{focusMode ? 'Active' : 'Off'}</span>
            </button>
          )}

          {/* Ambient Music / Volume */}
          <div className="flex flex-col gap-2 p-4 min-h-[44px] glass rounded-tile text-ink-900 font-sans">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 font-medium">
                <Music className="h-4 w-4 text-accent shrink-0" />
                <span>Ambient sound</span>
              </span>
              <IconButton
                label={ambientMuted ? 'Unmute ambient sound' : 'Mute ambient sound'}
                size="sm"
                onClick={() => {
                  primeAudioContext();
                  ambientEngine.startEngine();
                  toggleAmbientMute();
                }}
                className="min-h-[44px] min-w-[44px]"
              >
                {ambientMuted ? (
                  <VolumeX className="h-4 w-4 text-ink-500" />
                ) : (
                  <Volume2 className="h-4 w-4 text-accent" />
                )}
              </IconButton>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-micro text-ink-500">
                <span>Volume</span>
                <span className="tabular-nums font-medium text-ink-700">
                  {ambientMuted ? 'Muted' : `${Math.round(ambientMaster * 100)}%`}
                </span>
              </div>
              <Slider
                aria-label="Mobile ambient master volume"
                aria-valuetext={`${Math.round(ambientMaster * 100)}%`}
                value={Math.round(ambientMaster * 100)}
                onChange={val => {
                  primeAudioContext();
                  ambientEngine.startEngine();
                  setAmbientMaster(val / 100);
                }}
                min={0}
                max={100}
                step={1}
                showValue={false}
              />
            </div>
          </div>

          {/* Sound effects */}
          <button
            type="button"
            onClick={toggleSfx}
            className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors text-left"
          >
            <span className="flex items-center gap-2.5">
              {sfxOn ? (
                <Volume2 className="h-4 w-4 text-accent shrink-0" />
              ) : (
                <VolumeX className="h-4 w-4 text-ink-500 shrink-0" />
              )}
              <span>Sound effects</span>
            </span>
            <span className="text-small text-ink-500">{sfxOn ? 'On' : 'Off'}</span>
          </button>

          {/* Little visitors */}
          <button
            type="button"
            onClick={toggleRareEvents}
            className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors text-left"
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-accent shrink-0" />
              <span>Little visitors</span>
            </span>
            <span className="text-small text-ink-500">{rareEventsOn ? 'On' : 'Off'}</span>
          </button>

          {/* Clock format */}
          <div className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans">
            <span className="text-small font-medium">Clock format</span>
            <div className="flex items-center gap-1 glass p-0.5 rounded-pill border border-glass-border">
              {(['auto', '12h', '24h'] as const).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setClockFormat(fmt)}
                  aria-pressed={clockFormat === fmt}
                  className={cn(
                    'px-2.5 py-1 min-h-[36px] rounded-pill text-micro font-medium transition-colors',
                    clockFormat === fmt
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-ink-600 hover:text-ink-900',
                  )}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Fullscreen */}
          {fullscreenSupported && (
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between px-4 py-3 min-h-[44px] glass rounded-tile text-ink-900 font-medium font-sans hover:glass-strong transition-colors text-left"
            >
              <span className="flex items-center gap-2.5">
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 shrink-0" />
                ) : (
                  <Maximize2 className="h-4 w-4 shrink-0" />
                )}
                <span>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</span>
              </span>
            </button>
          )}

          <div className="pt-2 flex justify-center text-micro text-ink-500">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>Study with a cat. Find your focus.</span>
            </span>
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default Header;
