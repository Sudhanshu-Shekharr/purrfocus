# 🐱 Purrfocus

> **Your cozy cat Pomodoro timer · Study with a cat. Find your focus.**

Purrfocus is a cozy, aesthetic Pomodoro study web application featuring an animated cat companion (Mochi & Chai) whose poses react to your timer and interactions, synthesized ambient audio mixing, scenic backgrounds, task intentions, analytics, and a study journal.

---

## ✨ Key Features

- **Drift-Free Pomodoro Timer**: Timestamp-derived (`endsAt`) countdown powered by a Web Worker ticker with background-tab recovery, keyboard shortcuts, and subtle Web Audio chimes.
- **Interactive Cat Companion**: Choose between **Mochi** and **Chai** with unlock-free cozy outfits (scarf, beanie, wire glasses, bow, studio headphones), 13 expressive poses, rotating thought bubbles, and gentle interactions (pet, yarn ball play, tiny treat, stretch together).
- **Synthesized Ambient Sound Mixer**: Zero-external-file Web Audio ambient engine (soft piano, rainfall, brown noise) with granular layer mixing, master volume controls, and support for your own local audio or official YouTube/Spotify/SoundCloud embeds.
- **Scenic Atmospheres**: 5 curated visual scenes (Rainy Highrise, Midnight Desk, Nocturne Bedroom, Sunlit Studio, Botanical Garden) with smooth crossfades, adaptive contrast tokens, and time-of-day scene suggestions.
- **Little Intentions & Focus Mode**: Session subject field, task checklist with Pomodoro badges and keyboard reordering, plus a distraction-free Focus Mode (`f`) with ambient motion dampening.
- **My Desk (`/desk`)**: Today/weekly/all-time focus metrics, gentle non-punitive streak tracking, SVG weekly bar chart, 26-week activity heatmap, subject breakdown donut, interactive desk collectibles, and JSON backup import/export.
- **My Journal (`/journal`)**: Post-session mood & reflection prompt, chronological timeline with companion commentary, and safe Markdown / CSV export.
- **Accessible & Responsive**: WCAG 2.x AA contrast across every scene, keyboard navigation, reduced-motion support, and responsive layouts from mobile (with sticky mini-timer) to ultrawide desktop.

---

## 🛠️ Tech Stack

- **Core & Framework:** React 18, TypeScript (strict mode), Vite
- **Styling:** Tailwind CSS + CSS custom property design tokens
- **Typography:** Playfair Display & DM Sans
- **State Management:** Zustand (with debounced `localStorage` persistence)
- **Animation:** Framer Motion + custom Canvas particle system
- **Audio:** Web Audio API + Howler.js
- **Icons:** Lucide React
- **Routing:** React Router v6
- **Testing:** Vitest + React Testing Library + jsdom
- **Code Quality:** ESLint (flat config + `typescript-eslint` + `react-hooks` + `jsx-a11y`) + Prettier

---

## 📁 Project Structure

```text
src/
├─ app/                 # Router, providers, shell layout
├─ components/          # Reusable UI and feature components
│  ├─ header/           # Top bar navigation, sound popover, focus & fullscreen controls
│  ├─ home/             # Hero layout, live clock, scenery card, footer strip
│  ├─ timer/            # Timer card, isolated digits, controls, sticky mini-timer
│  ├─ cat/              # Companion stage, sprites, accessories, customization modal
│  ├─ mood/             # Ambient sound mixer & custom music sheet
│  ├─ intentions/       # Task checklist & subject input
│  ├─ scenery/          # Crossfading scenic backgrounds & gallery modal
│  ├─ desk/             # Analytics charts, heatmap, collectibles
│  ├─ journal/          # Post-session mood prompt & journal timeline entries
│  ├─ settings/         # Preferences & JSON backup drawer
│  └─ ui/               # Accessible glassmorphism primitives
├─ features/            # Domain stores, state machines, Web Worker ticker & Web Audio engine
├─ data/                # Static catalogs (scenes, cats, outfits, poses, dialogue)
├─ hooks/               # Shared custom React hooks
├─ lib/                 # Pure utilities (storage, time, contrast, exports, data port)
├─ pages/               # Route views (Home, Desk, Journal, Rooms, Styleguide, NotFound)
├─ styles/              # Design tokens (tokens.css), scene themes (scenes.css), globals
└─ assets/              # Optimized WebP scenes & cat sprite assets
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation & Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Verification Pipeline

Run typechecking, linting, unit tests, and the production build in one command:

```bash
npm run check
```

Individual commands:

```bash
npm run typecheck   # TypeScript strict check
npm run lint        # ESLint check
npm run format      # Prettier format
npm run test        # Vitest unit & component test suite
npm run build       # TypeScript compile + Vite production bundle
npm run preview     # Preview production build locally
```

---

## 🌐 Deployment

Purrfocus builds to a static SPA bundle in `dist/` and includes SPA fallback routing configs out of the box:

- **Vercel**: Ready to deploy directly using [`vercel.json`](vercel.json) (`npm run build`, output directory `dist`).
- **Netlify / Cloudflare Pages**: Ready to deploy using [`public/_redirects`](public/_redirects) (`npm run build`, publish directory `dist`).

---

## 🎨 Credits

See [`CREDITS.md`](CREDITS.md) for typography, iconography, and visual asset credits.
