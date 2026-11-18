# Changelog

All notable changes to Purrfocus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.1] - Polish: Tab Title, Two-Line Hero & Rotating First Line - 2026-11-18

### Changed
- **Emoji-Free Tab Title & Brand Favicon**:
  - Simplified `index.html` `<title>` to `Purrfocus` and replaced the inline cat-emoji data-URI favicon with a crisp brand-palette `"P"` monogram (`public/favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`).
  - Removed the pause emoji from `useDocumentTitle` (`Paused · 24:13 · Focus` instead of `⏸ 24:13 · Focus`) while keeping live running timer titles (`24:13 · Focus`) intact.
- **Two-Line Responsive Hero Headline (`HeroHeadline`)**:
  - Refactored the home hero `h1` to stay strictly two lines across 320–2560 px using the `--fs-hero` (`clamp(1.875rem, 8.2vw, 3.75rem)`) typography token, preserving the italic `text-accent-focus` treatment on `focus.`.
- **Rotating First Line**:
  - Added six original first-line variants (`src/data/hero.ts`) rotating sequentially every 5.5 s via a subtle 500 ms Framer Motion `rotateX` (15°) fade-and-flip transition.
  - Stacked all six variants in a single CSS grid cell (`grid-area: 1 / 1`) to reserve width and height with zero reflow (Lighthouse mobile median CLS `0.024`, Performance `97`, Accessibility `100`, Best Practices `100`, SEO `92`).
  - Pauses on `visibilitychange` when hidden, preserves cycle position across route changes and Focus Mode toggles, clears the single `setTimeout` on unmount, falls back statically to variant 1 with zero timers under `useReducedMotion`, and exposes a static screen-reader `h1` name (`"Study with a cat. Find your focus."`) without `aria-live`.

### Added
- **Hero & Title Test Coverage**:
  - Added `src/components/home/HeroHeadline.test.tsx` (7 tests covering 5.5 s timing, non-repeating sequence, `grid-area: 1 / 1`, OS & Settings reduced motion, tab visibility pause/resume, static accessible name, and unmount cleanup).
  - Extended `src/features/timer/effects.test.ts` with Unicode emoji-range assertions on document and timer titles.
  - Extended `src/lib/contrast.test.ts` verifying hero `surface` ($\ge 4.5:1$) and `accent-focus` ($\ge 3.0:1$) contrast across all five scene tints.

## [0.9.0] - Phase 9: Responsiveness, Accessibility & Performance - 2026-11-16

### Added
- **Responsive Breakpoint Layouts**:
  - Implemented semantic CSS Grid layout for $\ge 1100$ px (desktop two-column hero with cat vertically centered with `self-center`; 3 equal-height cards), $768–1099$ px (tablet stacked hero; 2+1 cards), and $< 768$ px (single-column flow with cat scaled to ~60%).
  - Guaranteed zero horizontal overflow across 320, 360, 390, 768, 1024, 1280, and 1440 px viewports.
  - Sized all interactive tap targets to $\ge 44 \times 44$ px across mobile touch surfaces.
- **Mobile Navigation Bottom Sheet & Sticky Mini-Timer**:
  - Collapsing header below 768 px to logo and accessible hamburger menu button.
  - Menu opens as an accessible bottom sheet with focus trap, Escape dismissal, and return of focus to trigger.
  - `MiniTimer` component mounted via `IntersectionObserver` when `#timer-card` scrolls out of view on screens $< 768$ px; features tap-to-scroll, countdown digits, mode badge, and pause/resume button with `aria-live="off"` and `role="region"`.
- **Contrast Audit Suite**:
  - Built `src/lib/contrast.ts` calculating WCAG relative luminance and contrast ratios. Audited all critical token pairs across all 5 scenic tints (`peach`, `garden`, `rain`, `midnight`, `nocturne`) guaranteeing $\ge 4.5:1$ body and $\ge 3:1$ large/timer contrast.
- **Enhanced Keyboard Navigation & Accessible Semantics**:
  - Contextual skip link ("Skip to timer" on home, "Skip to content" on secondary routes).
  - Proper `role="tablist"` and `role="tabpanel"` markup for timer mode tabs with roving focus (`ArrowLeft`/`ArrowRight`/`Home`/`End`).
  - Added visible 2px accent focus rings with 2px offset on all focusable elements.
  - Wrapped interactive headers cleanly (`<h2><button>` instead of `<button><h2>`).
- **Live Region Throttling & Render Tree Isolation**:
  - Updated `TimerAnnouncer` to subscribe outside React; announces start, pause, resume, reset, finish, and whole-minute boundaries (24:00, 23:00, etc.) while suppressing per-second announcements.
  - Isolated tick re-renders strictly to `TimerDigits`.
- **Reduced Motion & Flash Safety**:
  - Added reactive `useReducedMotion` checking OS media query and in-app override.
  - Added root `[data-reduce-motion="true"]` instantly halting animations, hover translations, and setting `--motion-scale: 0`.
  - Audited all keyframes ensuring zero animations exceed 1 Hz (well below 3 Hz WCAG threshold).
  - Explicit audio autoplay gate: AudioContext is only created on user interaction.
- **Performance Optimizations**:
  - Re-architected `<SceneBackground />` with responsive `<picture>` serving 960w / 1672w WebP images, with `sizes="100vw"`, `fetchPriority="high"`, and explicit dimensions (CLS = 0.04).
  - Implemented `DebouncedStorageManager` (`src/lib/storageDebounce.ts`) coalescing Zustand writes to 500 ms with auto-flush on `visibilitychange` / `pagehide`.
  - Added low-end hardware detection (`src/lib/lowEnd.ts`), applying `data-perf="low"` on $\le 4$ cores or $\le 4$ GB RAM and capping glass blur radius to $\le 8$ px.
  - Asynchronous non-render-blocking Google Fonts loading.
  - Rollup vendor code-splitting keeping initial JS bundle to ~171 kB gzipped (under 200 kB budget).
  - Lighthouse mobile audit results: Performance 96, Accessibility 100, Best Practices 100, SEO 92.

## [0.8.0] - Phase 8: Secondary Pages & Retention - 2026-11-16

### Added
- **My Desk (`/desk`)**:
  - Four glass stat cards displaying Today, This week, All time, and Current streak with companion bond level.
  - Hand-rolled SVG Weekly Bar Chart for the last 7 local days with accessible `<title>` per bar and adjacent visually hidden `<table>`.
  - 26-week Activity Heatmap Calendar with 5 focus tiers, roving focus keyboard navigation (`ArrowUp`/`Down`/`Left`/`Right`), accessible aria-labels, and legend.
  - Hand-rolled SVG Subject Donut with `today | week | all` range selector, top 5 grouping + "Other", center readout, and accessible table alternative.
  - SVG Desk Illustration displaying 5 milestone collectibles (`tea-mug`, `plant`, `lamp`, `photo-frame`, `bookmark`) with bounce on tap and 16 original `deskTap` cat dialogue lines. Locked collectibles render as silhouettes with plain-language unlock hints.
  - Empty state with gentle reassurance (*"Your desk fills up as you focus. No rush."*).
- **Settings Drawer**:
  - Right-side sliding glass drawer accessible from My Desk.
  - Summary of timer defaults with quick-adjust link.
  - Default scene selector persisted to `purrfocus:scenery:v1`.
  - Desktop notifications toggle: requested strictly on user click, never on page load, with site setting recovery instructions.
  - Clock format preference (`auto | 12h | 24h`) and reduce motion override (`system | on | off`).
  - Data porting: JSON export (`purrfocus-backup-<date>.json`), JSON import with 2 MB cap, schema version validation, item/conflict preview, and idempotent session/task deduplication.
  - Reset all data modal requiring explicit typed `"reset"` confirmation.
  - Plain-language local-first privacy statement.
- **My Journal (`/journal`)**:
  - End-of-session reflection prompt (`MoodPrompt`): 5 mood emojis, 140-char note input, 30s auto-dismiss (halted on interaction), `Esc` dismiss, skippable, deferred automatically during Focus Mode.
  - Chronological study timeline grouped by local date headers with session time, duration, subject, mood badge, user reflection quote, and companion cat comment.
  - Deterministic cat commentary using `sessionId` hashing mapped to mood tone pools (`journalNote` catalog).
  - Safe exports: Date-grouped Markdown (`.md`) with escaped markdown control characters, and RFC 4180 CSV (`.csv`) with formula injection defense (`=,+,-,@,\t,\r` prefixed with `'`).
  - Time range filter (`All time` vs `Last 7 days`), dynamic subject filter dropdown, and 50-session in-memory pagination with "Show more" button.
- **Study with Friends (`/rooms`)**:
  - Honest coming-soon co-working page detailing presence-only mechanics, anonymous monikers, and cozy privacy guarantees with zero network calls.
- **Upgraded Data Model**:
  - Bumped `purrfocus:stats:v1` to version 2 with backward-compatible migration deriving `completedAt` from local noon epoch of session `date`.
  - Added pure stats selectors: `totalsFor`, `minutesByDay`, `minutesBySubject`, `sessionsForJournal`, `currentStreak`.

### Fixed
- **Accessibility & Contrast**:
  - Restored home page mobile accessibility score to $\ge 95$ after Phase 7 regression.
  - Corrected heading levels in MoodCardSlot, IntentionsCardSlot, SetTheMoodCard, and IntentionsCard (`<h3>` $\to$ `<h2>`).
  - Improved contrast on small captions and task action icons (`text-ink-400` $\to$ `text-ink-500`).
  - Made disabled footer journal link inert and updated to active navigation link.
  - Hardened iframe sandbox security in `OwnMusicSheet` (dropped `allow-same-origin`).

## [0.7.0] - Phase 7: Set the Mood, Little Intentions & Footer - 2026-10-30

### Added
- **Shared Ambient Audio Engine**: Single AudioContext singleton coordinating procedural Web Audio synthesis (brown noise, rainfall, soft piano) and Howler.js file adapter. Autoplay gating strictly requires user gesture (`sessionStarted` not persisted). Fades use 800ms linear ramps with node cleanup upon silence.
- **Procedural Web Audio Soundscapes**:
  - `brownNoise`: 4s looped buffer generated with digital leaky integrator filter ($y[n] = 0.98 y[n-1] + 0.02 x[n]$) clamped to $[-1, 1]$.
  - `rainfall`: White noise through Biquad bandpass filter ($1200$ Hz, $Q = 0.7$) with lookahead droplet scheduler generating soft resonant impulses ($1800$ Hz, $40$ms decay).
  - `softPiano`: 16s pentatonic progression loop with dual triangle/sine oscillators and simulated feedback delay network reverb ($350$ms delay, $0.25$ feedback gain).
- **Set the Mood Card**:
  - Preset tiles with roving tabindex keyboard navigation.
  - Master volume slider with `%` readout and accessible valuetext.
  - `SOUND ON` / `SOUND OFF` status chip with pulsing activity indicator (motion-safe).
  - Scene suggestion chip setting suggested level to 0.6 without auto-starting playback.
  - Expandable mix panel with individual volume sliders and reset capability.
  - Header sound popover integration with quick mute and volume control.
- **Your Own Music Modal Sheet**:
  - Local file upload tab supporting audio files up to 50MB with object URL lifecycle management.
  - Web player tab with pure URL parser for allowlisted YouTube, Spotify, and SoundCloud embeds rendered in sandboxed iframes.
- **Little Intentions**:
  - Persisted tasks store (`purrfocus:intentions:v1`) with 100-task cap, 120-char text validation, and 60-char subject limit.
  - Inline subject field linking the current focus session to a specific topic.
  - Task item controls: animated checkboxes (reduced-motion safe), pomodoro count badges, active session task toggle, and delete.
  - Keyboard reordering (`Alt+ArrowUp`, `Alt+ArrowDown`) and hover button controls.
  - Rotating empty-state suggestions cycling every 20 seconds.
  - Typed intentions event bus (`taskDone`, `pomodoroCounted`) triggering celebratory cat companion thought lines.
- **Single Completion Point**: Centralized `recordCompletedFocusSession` coordinating session logging, subject attribution, active task pomodoro counting, and celebratory reactions.
- **Footer Strip & Live Metrics**:
  - Real live focus minutes today calculated from stats store.
  - Isolated `LiveClock` with configurable format preference (`auto | 12h | 24h`) in prefs store.
  - Disabled `My journal ↗` placeholder with accessible tooltip (*"Coming in Phase 8"*).
- **Documentation**: New `docs/mood-and-intentions.md` and `CREDITS.md`.

## [0.6.0] - Phase 6: The Interactive Delight Layer - 2026-10-29

### Added
- **Consolidated Preferences Store**: Persisted `purrfocus:prefs:v1` store managing global `sfxOn`, `rareEventsOn`, `lastWelcomeDay`, and session-only `focusMode`. Includes automatic v1 -> v2 migration from legacy cat store.
- **Shared Canvas Particle System**: Single HTML5 Canvas 2D layer (`ParticleCanvas`) capped at 40 particles with physics step (gravity, air drag, alpha decay), DPR capped at 2, debounced resize, auto-pausing rAF loop on 0 particles, and `visibilitychange` pause.
- **Particle Emitters**:
  - `emitPetHearts`: 5 floating hearts rising with horizontal drift on Pet.
  - `emitTreatSparkles`: 8 shimmering radial sparkles on Treat drop.
  - `emitPawPrint`: Soft fading paw prints behind draggable yarn ball.
  - `emitCelebratePetals`: 24 scene-tinted falling confetti-lite petals on focus timer completion.
- **Pointer Parallax & Sprite Bounce**:
  - Cat pointer parallax spring (`stiffness: 160`, `damping: 26`) clamped to $\pm 6$px, dampened to $\pm 2$px in focus mode, and 0 in reduced motion.
  - Tactile click bounce (`scale: [1, 0.96, 1.02, 1]`, 260ms) with 8s spam-guard cooldown on dialogue line changes.
- **Tactile Feedback**:
  - Fine-pointer hover lift (2px translateY with deepened shadow) on `GlassCard` using `@media (hover: hover) and (pointer: fine)`.
  - Active press feedback (scale down to 0.97 with 120ms transition) on `PillButton` and `Tile`.
- **Time-of-Day Awareness & Scene Suggestions**:
  - Pure `getTimeOfDay(date)` helper partitioning hours into morning (05–11), afternoon (12–16), evening (17–21), and lateNight (22–04).
  - Contextual dialogue greetings for `morning`, `evening`, and `lateNight`.
  - Small, dismissible glass suggestion chip under scenery picker suggesting time-matched scenes without auto-switching.
- **Cosmetic Rare Scenic Events**:
  - Pure scheduler evaluating every 90s with 12% probability, 10-minute cooldown, max 1 active, and Quiet Focus Rule (never fires during running focus session or active UI focus mode).
  - SVG butterfly (sine wave path), drifting leaves, and bird silhouette with gentle chirp SFX.
- **Focus Mode**:
  - Keyboard shortcut `f` with input/textarea guard, and header toggle with `aria-pressed`.
  - Dims non-essential UI to 35%, hides cards row with `inert` attribute, slows ambient motion with `--motion-scale: 2`.
  - `Esc` key exits Focus Mode only when no modal, sheet, or popover menu is open.
  - Polite live region announcement (`"Focus mode on"` / `"Focus mode off"`).
- **Gentle Streak & "Welcome Back" Moment**:
  - Pure streak calculator with 1-day grace period; no guilt language or loss states.
  - Subtle caption streak chip in cat companion when streak $\ge 2$ days (`"N days in a row"`).
  - "Welcome back" return moment greeting on first load of the day when returning after absence.
- **Collectibles Unlock Logic**: Pure calculator computing unlocks for tea mug (60m), plant (120m), lamp (240m), photo frame (480m), and bookmark (3-day streak).
- **Documentation**: Comprehensive architecture guide in `docs/delight.md`.

## [0.5.0] - Phase 5: The Cat Companion - 2026-10-28

### Added
- **Pose Engine & State Machine**: Pure derivation for 13 poses across base timer modes, idle sleepy state, and ephemeral overlays with strict precedence (e.g. celebrate non-interruption, focus-blocked play).
- **Persisted Cat Store**: Zustand store persisted to `purrfocus:cat:v1` tracking companion name, cat variant, selected outfit, bond points, study pose variant, SFX toggle, and rolling 1-hour interaction bond history.
- **Synthesized Web Audio SFX**: Real-time purr (frequency rumble with LFO tremolo), pop (down-sweep treat snack), and rustle (dual pitch flutter) audio with master gain $\le 0.15$ and mute gating.
- **Declarative Manifests & Art**:
  - `src/data/poses.ts`: 13 pose definitions with captions, screen reader alt text, and preload suggestions.
  - `src/data/cats.ts`: Mochi and Chai character definitions with color swatches.
  - `src/data/outfits.ts`: 6 outfits with bond tier unlocks (Natural Fur, Wire Glasses, Cozy Knit Scarf, Slouchy Beanie, Silk Ribbon Bow, Studio Headphones).
  - `src/assets/cat/placeholder/*.svg`: 13 lightweight, high-contrast, cozy SVG illustrations.
- **Dialogue & Speech Bubble**:
  - 220+ original, wholesome one-liners across 14 contexts (<60 chars each, $\ge 15$ lines per context) in `dialogue.json`.
  - Non-repeating sliding window line picker (`pickLineWithWindow`) with 25–40s natural rotation.
  - `ThoughtBubble` component with cream styling, trailing dots, and polite ARIA live region.
- **Interactive UI Components**:
  - `CatSprite`: Smooth crossfades, idle breathing loop (scale 1.015, ~4s), tap bounce, and 600ms hold-to-pet.
  - `CatNameEditor`: Inline renaming with auto-focus, Enter/blur save, Escape cancel, and 20-character clamp.
  - `CatCaption` & `CatEyebrow`: State descriptor and pulsing status indicator dot.
  - `Hearts`: Floating love hearts animation on Pet action with reduced-motion support.
  - `YarnBall`: Draggable interactive yarn ball with dismiss button and rustle sound effects.
  - `StretchRing`: 10-second visual countdown ring for Stretch Together.
  - `MoreMenu`: Popover menu with study pose cycler, stretch trigger, tiny treat, and SFX toggle.
  - `OutfitSheet`: Modal sheet with character switcher, outfit catalog, bond level progression bar, and live preview.
- **Documentation**: Comprehensive architecture guide in `docs/cat.md`.

## [0.4.0] - Phase 4: Pomodoro Timer Core - 2026-10-28

### Added
- **Pure Functional Reducer**: `timerReducer` in `src/features/timer/reducer.ts` implementing start, pause, resume, reset, tick, finish, advance, switchMode, applySettings, rollDay, and rehydrate actions.
- **Authoritative Timestamp Ticker**: Web Worker ticker in `src/features/timer/tick.worker.ts` with visibilitychange and `setInterval` fallback.
- **Persisted Timer Store**: Validated and sanitized Zustand store under `purrfocus:timer:v1` with recovery rules for tab reload and background sleep.
- **Audio Chime**: Cozy two-tone Web Audio synthesized chime (`src/features/audio/chime.ts`) with lazy context initialization.
- **Desktop Notifications**: Background notifications on session finish when tab is hidden (`src/lib/notify.ts`).
- **Phase 5 Cat Companion Event API**: Typed event emitter and hooks (`subscribeTimerEvents`, `useTimerEvents`) in `src/features/timer/events.ts`.
- **Dialogue & Micro-Copy**: Original captions and 48+ micro-copy variants in `src/data/dialogue.json` with stable seeded loader in `src/data/dialogue.ts`.
- **Timer UI Components**:
  - `TimerCard`: Full Pomodoro card with glassmorphism styling.
  - `ModeTabs`: Controlled SegmentedTabs with mid-session confirmation guard.
  - `TimerDigits`: Isolated subscriber to `remaining` seconds with tabular numbers and ARIA timer role.
  - `TimerControls`: Dynamic primary action button, reset button, and shortcut tooltips.
  - `AdjustPopover`: Settings dialog for custom durations (1–180 min), cycles (1–12), auto-start, and chime toggles.
  - `SessionDots`: Animated session progress dots with accessible captions and reduced motion support.
  - `MicroCopy`: Soft crossfading motivational copy.
  - `ModeSwitchModal`: Accessible confirmation dialog when switching modes with unsaved progress.
  - `TimerAnnouncer`: Polite screen reader announcer for state transitions.
- **Keyboard Shortcuts**: `useTimerShortcuts` hook supporting `Space` (start/pause/resume/advance), `R` (reset), and `1`/`2`/`3` (mode switch) with focus guards.
- **Stats Store & Footer**: Persisted `purrfocus:stats:v1` store tracking focus minutes, idempotent logging, and live "N min of focus today" ticker.
- **Documentation**: Comprehensive timer architecture guide in `docs/timer.md`.

## [0.3.0] - Phase 3: Page Shell, Header & Scenery System - 2026-10-23
- Implemented AppShell, Header, SceneryCard, SceneBackground, and Scene Gallery Modal.
- Multi-resolution WebP optimization pipeline with 5 scenic presets.

## [0.2.0] - Phase 2: Design System & Primitives - 2026-10-23
- 17 accessible UI primitives and interactive development styleguide.

## [0.1.0] - Phase 1: Project Scaffold & Tooling - 2026-10-23
- Vite, React 18, TypeScript strict, Tailwind CSS tokens, Vitest, and ESLint flat config setup.
