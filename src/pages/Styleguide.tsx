import React, { useState } from 'react';
import { NotFoundPage } from './NotFound';
import {
  GlassCard,
  PillButton,
  IconButton,
  SegmentedTabs,
  Slider,
  Popover,
  MenuItem,
  Tooltip,
  Modal,
  useToast,
  Eyebrow,
  Toggle,
  TextField,
  Tile,
  Divider,
  Kbd,
} from '@/components/ui';
import {
  Play,
  Volume2,
  Heart,
  Coffee,
  Music,
  Cloud,
  Sun,
  Sunrise,
  Settings,
  Cat,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionType = 'focus' | 'short' | 'long';
type Scene = 'peach' | 'garden' | 'rain';

// ── Scene switcher effect ─────────────────────────────────────────────────────

function useSceneSwitcher(): [Scene, (s: Scene) => void] {
  const [scene, setSceneState] = useState<Scene>('peach');

  const setScene = (s: Scene) => {
    document.documentElement.setAttribute('data-scene', s);
    setSceneState(s);
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-scene', scene);
    return () => document.documentElement.removeAttribute('data-scene');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [scene, setScene];
}

// ── Color swatch ──────────────────────────────────────────────────────────────

type SwatchProps = { name: string; value: string; className: string };
function Swatch({ name, value, className }: SwatchProps): React.ReactElement {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className={`h-12 w-full rounded-xl border border-glass-border ${className}`} />
      <span className="font-sans text-small text-ink-700">{name}</span>
      <span className="font-sans text-micro text-ink-500">{value}</span>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

type SectionProps = { title: string; children: React.ReactNode };
function Section({ title, children }: SectionProps): React.ReactElement {
  return (
    <GlassCard padding="lg" className="flex flex-col gap-6">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </GlassCard>
  );
}

// ── Toast demo buttons ────────────────────────────────────────────────────────

function ToastDemo(): React.ReactElement {
  const { show } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <PillButton
        variant="glass"
        onClick={() => show({ message: 'Your session is saved. Keep going! 🐱' })}
      >
        Default toast
      </PillButton>
      <PillButton
        variant="glass"
        onClick={() => show({ message: 'Focus session complete!', tone: 'success' })}
      >
        Success toast
      </PillButton>
      <PillButton
        variant="glass"
        onClick={() => show({ message: 'Only 2 minutes left in your break.', tone: 'warning' })}
      >
        Warning toast
      </PillButton>
      <PillButton
        variant="glass"
        onClick={() => show({ message: 'Something went wrong. Try again.', tone: 'danger' })}
      >
        Danger toast
      </PillButton>
    </div>
  );
}

// ── Main Styleguide Page ──────────────────────────────────────────────────────

export function StyleguidePage(): React.ReactElement {
  if (!import.meta.env.DEV) return <NotFoundPage />;

  return <StyleguideContent />;
}

function StyleguideContent(): React.ReactElement {
  const [scene, setScene] = useSceneSwitcher();
  const [session, setSession] = useState<SessionType>('focus');
  const [volume, setVolume] = useState(60);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(true);
  const [textVal, setTextVal] = useState('');
  const [selectedTile, setSelectedTile] = useState<string | null>('rain');

  const sessionOptions = [
    { value: 'focus' as SessionType, label: 'Focus' },
    { value: 'short' as SessionType, label: 'Short break' },
    { value: 'long' as SessionType, label: 'Long break' },
  ] as const;

  const tiles = [
    { id: 'rain', icon: <Cloud />, label: 'Rain' },
    { id: 'cafe', icon: <Coffee />, label: 'Café' },
    { id: 'lofi', icon: <Music />, label: 'Lo-fi' },
  ];

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--sg-bg, #f5a07a)' }}>
      {/* Peach sunset gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'linear-gradient(160deg, #e8896a 0%, #f5a07a 25%, #f5c9a0 60%, #f5e0c8 100%)',
        }}
      />
      {/* Scene overlay — responds to data-scene token */}
      <div className="scene-overlay" aria-hidden="true" />

      <main className="relative z-card mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <Eyebrow tone="default" pulse className="mb-3 justify-center">
            Development only · /styleguide
          </Eyebrow>
          <h1 className="font-serif text-display text-ink-900 mb-2">
            Design System
          </h1>
          <p className="font-sans text-body text-ink-700">
            Study with a cat. Find your{' '}
            <em className="font-serif italic text-accent">focus.</em>
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* ── 1. Scene switcher ── */}
          <Section title="10 · Scene switcher">
            <p className="font-sans text-small text-ink-500">
              Sets <Kbd>data-scene</Kbd> on <Kbd>&lt;html&gt;</Kbd> — watch the card
              tint and page overlay shift.
            </p>
            <div className="flex flex-wrap gap-3">
              {(['peach', 'garden', 'rain'] as Scene[]).map(s => (
                <PillButton
                  key={s}
                  variant={scene === s ? 'primary' : 'glass'}
                  onClick={() => setScene(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </PillButton>
              ))}
            </div>
          </Section>

          {/* ── 2. Color tokens ── */}
          <Section title="1 · Color tokens">
            <div>
              <p className="font-sans text-small font-medium text-ink-700 mb-3">Ink</p>
              <div className="grid grid-cols-3 gap-4">
                <Swatch name="ink-900" value="var(--ink-900)" className="bg-ink-900" />
                <Swatch name="ink-700" value="var(--ink-700)" className="bg-ink-700" />
                <Swatch name="ink-500" value="var(--ink-500)" className="bg-ink-500" />
              </div>
            </div>
            <Divider />
            <div>
              <p className="font-sans text-small font-medium text-ink-700 mb-3">Accent & Surface</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Swatch name="accent" value="var(--accent)" className="bg-accent" />
                <Swatch name="accent-soft" value="var(--accent-soft)" className="bg-accent-soft" />
                <Swatch name="blush-strong" value="var(--blush-strong)" className="bg-blush-strong" />
                <Swatch name="surface" value="var(--surface)" className="bg-surface" />
              </div>
            </div>
            <Divider />
            <div>
              <p className="font-sans text-small font-medium text-ink-700 mb-3">Status</p>
              <div className="grid grid-cols-3 gap-4">
                <Swatch name="success" value="var(--success)" className="bg-success" />
                <Swatch name="warning" value="var(--warning)" className="bg-warning" />
                <Swatch name="danger" value="var(--danger)" className="bg-danger" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Swatch name="success-surface" value="var(--success-surface)" className="bg-success-surface" />
                <Swatch name="warning-surface" value="var(--warning-surface)" className="bg-warning-surface" />
                <Swatch name="danger-surface" value="var(--danger-surface)" className="bg-danger-surface" />
              </div>
            </div>
            <Divider />
            <div>
              <p className="font-sans text-small font-medium text-ink-700 mb-3">Glass</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="glass h-12 w-full rounded-xl" />
                  <span className="font-sans text-small text-ink-700">.glass</span>
                  <span className="font-sans text-micro text-ink-500">var(--glass-bg)</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="glass-strong h-12 w-full rounded-xl border border-glass-border" />
                  <span className="font-sans text-small text-ink-700">.glass-strong</span>
                  <span className="font-sans text-micro text-ink-500">var(--glass-bg-strong)</span>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 3. Typography ── */}
          <Section title="2 · Typography">
            <div className="flex flex-col gap-4">
              <div>
                <Eyebrow className="mb-1">display — Playfair Display, clamp(3rem → 5.25rem)</Eyebrow>
                <p className="font-serif text-display text-ink-900 leading-none">
                  Study with a cat.
                </p>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-1">title — 1.75rem</Eyebrow>
                <p className="font-serif text-title text-ink-900">Find your focus.</p>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-1">body — 0.9375rem / DM Sans</Eyebrow>
                <p className="font-sans text-body text-ink-700">
                  A cozy space to study, breathe, and be present with your work. Your cat is
                  watching — proudly.
                </p>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-1">small — 0.8125rem</Eyebrow>
                <p className="font-sans text-small text-ink-700">
                  Session complete · 25 min focused
                </p>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-1">micro — 0.6875rem, tracked uppercase</Eyebrow>
                <p className="font-sans text-micro uppercase tracking-widest text-ink-500">
                  Your cozy cat pomodoro timer
                </p>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-1">timer — clamp(6rem → 10rem), weight 300, tabular</Eyebrow>
                <p
                  className="font-serif tabular-nums text-ink-900 font-light"
                  style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', lineHeight: 1 }}
                >
                  25:00
                </p>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-2">Headline pattern</Eyebrow>
                <p className="font-serif text-title text-ink-900">
                  Study with a cat. Find your{' '}
                  <em className="italic text-accent">focus.</em>
                </p>
              </div>
            </div>
          </Section>

          {/* ── 4. Buttons ── */}
          <Section title="3 · Buttons">
            <div className="flex flex-col gap-4">
              <div>
                <Eyebrow className="mb-3">Variants × sizes</Eyebrow>
                <div className="flex flex-wrap items-center gap-3">
                  <PillButton variant="primary" size="sm" leftIcon={<Play />}>Small</PillButton>
                  <PillButton variant="primary" size="md" leftIcon={<Play />}>Primary</PillButton>
                  <PillButton variant="primary" size="lg" leftIcon={<Play />}>Large</PillButton>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <PillButton variant="glass" size="sm">Glass sm</PillButton>
                  <PillButton variant="glass" size="md">Glass md</PillButton>
                  <PillButton variant="glass" size="lg">Glass lg</PillButton>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <PillButton variant="ghost" size="sm">Ghost sm</PillButton>
                  <PillButton variant="ghost" size="md">Ghost md</PillButton>
                  <PillButton variant="ghost" rightIcon={<ChevronRight />}>With right icon</PillButton>
                </div>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-3">States</Eyebrow>
                <div className="flex flex-wrap items-center gap-3">
                  <PillButton variant="primary" loading>Loading</PillButton>
                  <PillButton variant="primary" disabled>Disabled</PillButton>
                  <PillButton variant="glass" disabled>Glass disabled</PillButton>
                  <PillButton variant="primary" fullWidth>Full width</PillButton>
                </div>
              </div>
              <Divider />
              <div>
                <Eyebrow className="mb-3">Icon buttons</Eyebrow>
                <div className="flex flex-wrap items-center gap-3">
                  <IconButton label="Settings" size="sm"><Settings /></IconButton>
                  <IconButton label="Settings" size="md"><Settings /></IconButton>
                  <IconButton label="Favourite" size="md"><Heart /></IconButton>
                  <IconButton label="Volume" size="md" disabled><Volume2 /></IconButton>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 5. Segmented Tabs ── */}
          <Section title="4 · Segmented tabs">
            <p className="font-sans text-small text-ink-500">
              Arrow keys navigate. Home/End jump to first/last.
            </p>
            <SegmentedTabs
              value={session}
              onChange={setSession}
              options={sessionOptions}
            />
            <p className="font-sans text-small text-ink-700">
              Selected: <strong className="text-accent">{session}</strong>
            </p>
          </Section>

          {/* ── 6. Slider ── */}
          <Section title="5 · Slider">
            <p className="font-sans text-small text-ink-500">
              Arrow keys (±step), PageUp/Down (±10%), Home/End (min/max).
            </p>
            <Slider
              aria-label="Volume"
              value={volume}
              onChange={setVolume}
              min={0}
              max={100}
              showValue
            />
            <p className="font-sans text-small text-ink-700">
              Value: <strong className="text-accent">{volume}</strong>
            </p>
          </Section>

          {/* ── 7. Popover ── */}
          <Section title="6 · Popover menu">
            <p className="font-sans text-small text-ink-500">
              Arrow keys navigate items. Esc closes. Focus returns to trigger.
            </p>
            <Popover
              trigger={
                <PillButton variant="glass" rightIcon={<ChevronRight />}>
                  Cat options
                </PillButton>
              }
            >
              <MenuItem icon={<Cat />} onClick={() => {}}>Change study pose</MenuItem>
              <MenuItem icon={<Heart />} onClick={() => {}}>Stretch together</MenuItem>
              <MenuItem icon={<Coffee />} onClick={() => {}}>Tiny treat</MenuItem>
            </Popover>
          </Section>

          {/* ── 8. Modal + Sheet ── */}
          <Section title="7 · Modal &amp; bottom sheet">
            <div className="flex flex-wrap gap-3">
              <PillButton variant="glass" onClick={() => setModalOpen(true)}>
                Open modal
              </PillButton>
              <PillButton variant="glass" onClick={() => setSheetOpen(true)}>
                Open bottom sheet
              </PillButton>
            </div>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              variant="center"
              title="Take a moment"
            >
              <p className="font-sans text-body text-ink-700">
                You have been focused for 25 minutes. Time for a short break — maybe stretch
                with your cat? 🐱
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <PillButton variant="ghost" onClick={() => setModalOpen(false)}>
                  Skip
                </PillButton>
                <PillButton variant="primary" onClick={() => setModalOpen(false)}>
                  Start break
                </PillButton>
              </div>
            </Modal>
            <Modal
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              variant="bottom"
              title="Quick settings"
            >
              <p className="font-sans text-body text-ink-700">
                This is a bottom sheet — slides up from the bottom. Great for quick actions on
                mobile.
              </p>
              <div className="mt-6 flex justify-end">
                <PillButton variant="primary" onClick={() => setSheetOpen(false)}>
                  Done
                </PillButton>
              </div>
            </Modal>
          </Section>

          {/* ── 9. Toast ── */}
          <Section title="8 · Toast">
            <p className="font-sans text-small text-ink-500">
              Auto-dismiss after 4s. Hover to pause. Stacked bottom-centre via portal.
            </p>
            <ToastDemo />
          </Section>

          {/* ── 10. Tiles, Toggle, TextField, Tooltip ── */}
          <Section title="9 · Tiles, toggle, text field, tooltip">
            <div>
              <Eyebrow className="mb-3">Sound preset tiles</Eyebrow>
              <div className="flex flex-wrap gap-3">
                {tiles.map(t => (
                  <Tile
                    key={t.id}
                    icon={t.icon}
                    label={t.label}
                    selected={selectedTile === t.id}
                    onSelect={() => setSelectedTile(t.id)}
                  />
                ))}
              </div>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Toggle</Eyebrow>
              <div className="flex flex-col gap-3">
                <Toggle checked={toggleOn} onChange={setToggleOn} label="Ambient sounds" />
                <Toggle checked={false} onChange={() => {}} label="Disabled toggle" disabled />
              </div>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Text field</Eyebrow>
              <div className="flex flex-col gap-4 max-w-sm">
                <TextField
                  label="Today's intention"
                  value={textVal}
                  onChange={setTextVal}
                  placeholder="What will you focus on today?"
                  helperText="This is shown in your journal."
                />
                <TextField
                  label="Required field"
                  value=""
                  onChange={() => {}}
                  placeholder="Required…"
                  required
                  error="This field is required."
                />
              </div>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Tooltip</Eyebrow>
              <div className="flex flex-wrap items-center gap-6">
                <Tooltip content="Starts a 25-minute focus session">
                  <PillButton variant="primary" leftIcon={<Play />}>Start focus</PillButton>
                </Tooltip>
                <Tooltip content="Your study companion" delay={200}>
                  <IconButton label="Cat companion"><Cat /></IconButton>
                </Tooltip>
              </div>
            </div>
          </Section>

          {/* ── 11. Misc helpers + reduced-motion note ── */}
          <Section title="11 · Helpers &amp; accessibility">
            <div>
              <Eyebrow className="mb-3">Dividers</Eyebrow>
              <div className="flex flex-col gap-3">
                <Divider />
                <Divider label="or" />
                <div className="flex h-8 items-center gap-4">
                  <span className="font-sans text-small text-ink-700">Section A</span>
                  <Divider orientation="vertical" />
                  <span className="font-sans text-small text-ink-700">Section B</span>
                </div>
              </div>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Keyboard chips</Eyebrow>
              <div className="flex flex-wrap items-center gap-2">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
                <span className="font-sans text-small text-ink-700">Open command palette</span>
                <Divider orientation="vertical" className="h-4" />
                <Kbd>Esc</Kbd>
                <span className="font-sans text-small text-ink-700">Close dialog</span>
              </div>
            </div>
            <Divider />
            <div>
              <Eyebrow tone="warning" className="mb-3">Reduced motion testing</Eyebrow>
              <GlassCard padding="sm" strong>
                <p className="font-sans text-small text-ink-700 leading-relaxed">
                  To test reduced motion: in macOS go to{' '}
                  <strong>System Settings → Accessibility → Display → Reduce Motion</strong>.
                  In Windows: <strong>Ease of Access → Display → Show animations</strong> → off.
                  In Chrome DevTools: open the Rendering panel and enable{' '}
                  <Kbd>prefers-reduced-motion: reduce</Kbd>.
                </p>
                <p className="mt-2 font-sans text-small text-ink-700 leading-relaxed">
                  Expected: no sliding pill, no lift animations, no toast fades, no tooltip fades.
                  State changes happen instantly.
                </p>
              </GlassCard>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Width note</Eyebrow>
              <p className="font-sans text-small text-ink-500">
                This page must remain usable at 360px width with no horizontal scroll.
                All sections use <Kbd>max-w-3xl</Kbd>, <Kbd>px-4</Kbd> gutters, and{' '}
                <Kbd>flex-wrap</Kbd> on button groups.
              </p>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Eyebrow status dots</Eyebrow>
              <div className="flex flex-col gap-2">
                <Eyebrow tone="success" pulse>Session active</Eyebrow>
                <Eyebrow tone="warning">Timer paused</Eyebrow>
                <Eyebrow tone="danger">Overdue</Eyebrow>
                <Eyebrow tone="default">Ready</Eyebrow>
              </div>
            </div>
            <Divider />
            <div>
              <Eyebrow className="mb-3">Icon gallery</Eyebrow>
              <div className="flex flex-wrap gap-4 text-ink-700">
                <Sun /><Sunrise /><Cloud /><Music /><BookOpen /><Volume2 /><Settings /><Heart />
              </div>
            </div>
          </Section>
        </div>

        <p className="mt-10 text-center font-sans text-micro text-ink-500">
          Purrfocus Design System · Phase 2 · Dev only
        </p>
      </main>
    </div>
  );
}
