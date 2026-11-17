import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Clock,
  Film,
  Sparkles,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PillButton } from '@/components/ui/PillButton';
import { Toggle } from '@/components/ui/Toggle';
import { SegmentedTabs, type SegmentedOption } from '@/components/ui/SegmentedTabs';
import { TextField } from '@/components/ui/TextField';
import { SCENES } from '@/data/scenes';
import { useSceneryStore } from '@/features/scenery/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useTimerStore } from '@/features/timer/store';
import type { ClockFormat, ReduceMotionOverride } from '@/features/prefs/types';
import type { SceneId } from '@/features/scenery/types';
import {
  downloadExportJson,
  validateImportData,
  calculateMergePreview,
  applyImport,
  resetAllData,
  MAX_IMPORT_SIZE_BYTES,
  type PurrfocusExportData,
  type MergePreview,
} from '@/lib/dataPort';

export type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const CLOCK_OPTIONS: readonly SegmentedOption<ClockFormat>[] = [
  { value: 'auto', label: 'Auto' },
  { value: '12h', label: '12h' },
  { value: '24h', label: '24h' },
];

const MOTION_OPTIONS: readonly SegmentedOption<ReduceMotionOverride>[] = [
  { value: 'system', label: 'System' },
  { value: 'on', label: 'Always on' },
  { value: 'off', label: 'Always off' },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  // Timer durations
  const durations = useTimerStore(s => s.durations);
  const focusMin = Math.round(durations.focus / 60);
  const shortMin = Math.round(durations.shortBreak / 60);
  const longMin = Math.round(durations.longBreak / 60);

  // Scenery
  const defaultSceneId = useSceneryStore(s => s.defaultSceneId);
  const setDefaultScene = useSceneryStore(s => s.setDefaultScene);

  // Preferences
  const clockFormat = usePrefsStore(s => s.clockFormat);
  const setClockFormat = usePrefsStore(s => s.setClockFormat);
  const reduceMotion = usePrefsStore(s => s.reduceMotion);
  const setReduceMotion = usePrefsStore(s => s.setReduceMotion);
  const sfxOn = usePrefsStore(s => s.sfxOn);
  const setSfxOn = usePrefsStore(s => s.setSfxOn);

  // Notifications state (never requested on mount)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  const handleToggleNotification = async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setNotifPermission('unsupported');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setNotifPermission(res);
    } catch {
      setNotifPermission(Notification.permission);
    }
  };

  // Data import/export state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<PurrfocusExportData | null>(null);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [overwritePrefs, setOverwritePrefs] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  // Reset dialog state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const handleExport = () => {
    downloadExportJson();
    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    setImportData(null);
    setMergePreview(null);

    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      setImportError('File too large. Maximum size is 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setImportError('Failed to read file contents.');
          return;
        }
        const parsed = JSON.parse(text);
        const val = validateImportData(parsed);
        if (!val.valid) {
          setImportError(val.error);
          return;
        }
        setImportData(val.data);
        const preview = calculateMergePreview(val.data);
        setMergePreview(preview);
      } catch {
        setImportError('Malformed JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importData) return;
    applyImport(importData, { overwritePrefs });
    setImportSuccess(true);
    setImportData(null);
    setMergePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Modal variant="right" open={open} onClose={onClose} title="Settings">
        <div className="flex flex-col gap-6 text-ink-900">
          {/* Section 1: Timer Defaults */}
          <section className="flex flex-col gap-2">
            <h3 className="font-serif text-subheading text-ink-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span>Timer Defaults</span>
            </h3>
            <p className="font-sans text-small text-ink-700">
              Focus {focusMin}m · Short break {shortMin}m · Long break {longMin}m
            </p>
            <div className="pt-0.5">
              <Link
                to="/"
                onClick={onClose}
                className="text-small font-sans text-accent underline hover:opacity-80 transition-opacity"
              >
                Adjust on timer →
              </Link>
            </div>
          </section>

          {/* Section 2: Default Scene */}
          <section className="flex flex-col gap-2">
            <label
              htmlFor="default-scene-select"
              className="font-serif text-subheading text-ink-900 flex items-center gap-2"
            >
              <Film className="h-4 w-4 text-accent" />
              <span>Default Scene</span>
            </label>
            <p className="font-sans text-micro text-ink-700">
              The scenery that loads automatically when you open Purrfocus.
            </p>
            <div className="relative">
              <select
                id="default-scene-select"
                value={defaultSceneId}
                onChange={e => setDefaultScene(e.target.value as SceneId)}
                className="w-full appearance-none rounded-pill border border-glass-border bg-glass px-4 py-2 font-sans text-small text-ink-900 shadow-glass focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {SCENES.map(scene => (
                  <option key={scene.id} value={scene.id} className="bg-canvas text-ink-900">
                    {scene.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Section 3: Notifications */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-serif text-subheading text-ink-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>Desktop Notifications</span>
                </span>
                <p className="font-sans text-micro text-ink-700">
                  Notify when a focus session or break ends.
                </p>
              </div>
              <Toggle
                label="Desktop notifications"
                hideLabel
                checked={notifPermission === 'granted'}
                onChange={handleToggleNotification}
                disabled={notifPermission === 'unsupported'}
              />
            </div>
            {notifPermission === 'denied' && (
              <p className="font-sans text-micro text-danger mt-1">
                Notifications are blocked by your browser. You can re-enable them in your browser site settings.
              </p>
            )}
            {notifPermission === 'unsupported' && (
              <p className="font-sans text-micro text-ink-500 mt-1">
                Desktop notifications are not supported in this browser.
              </p>
            )}
          </section>

          {/* Section 4: Clock Format */}
          <section className="flex flex-col gap-2">
            <span className="font-serif text-subheading text-ink-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span>Clock Format</span>
            </span>
            <SegmentedTabs<ClockFormat>
              value={clockFormat}
              onChange={setClockFormat}
              options={CLOCK_OPTIONS}
            />
          </section>

          {/* Section 5: Reduce Motion Override */}
          <section className="flex flex-col gap-2">
            <span className="font-serif text-subheading text-ink-900 flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" />
              <span>Reduce Motion</span>
            </span>
            <SegmentedTabs<ReduceMotionOverride>
              value={reduceMotion}
              onChange={setReduceMotion}
              options={MOTION_OPTIONS}
            />
            <p className="font-sans text-micro text-ink-700">
              &lsquo;off&rsquo; only removes the OS preference for this app; it does not change your system settings.
            </p>
          </section>

          {/* Section 6: Sound Effects */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-serif text-subheading text-ink-900 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-accent" />
                  <span>Sound Effects</span>
                </span>
                <p className="font-sans text-micro text-ink-700">
                  Soft clicks, pops, and timer finish chimes.
                </p>
              </div>
              <Toggle
                label="Sound effects"
                hideLabel
                checked={sfxOn}
                onChange={setSfxOn}
              />
            </div>
            <p className="font-sans text-micro text-ink-700">
              Ambient study sounds (rain, cafe, vinyl) can be mixed anytime using the sound icon in the header.
            </p>
          </section>

          {/* Section 7: Your Data */}
          <section className="flex flex-col gap-3 pt-2 border-t border-glass-border">
            <h3 className="font-serif text-subheading text-ink-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>Your Data</span>
            </h3>

            {/* Export */}
            <div className="flex flex-col gap-1.5">
              <PillButton
                variant="glass"
                size="sm"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={handleExport}
                className="w-full justify-center"
              >
                Export JSON backup
              </PillButton>
              {exportedSuccess && (
                <span className="text-micro text-accent flex items-center gap-1 justify-center">
                  <Check className="h-3 w-3" /> Backup downloaded
                </span>
              )}
            </div>

            {/* Import */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="purrfocus-import-file-input"
              />
              <PillButton
                variant="glass"
                size="sm"
                leftIcon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-center"
              >
                Import JSON backup...
              </PillButton>

              {importError && (
                <p className="font-sans text-micro text-danger">{importError}</p>
              )}

              {importSuccess && (
                <p className="font-sans text-micro text-accent flex items-center gap-1 justify-center">
                  <Check className="h-3 w-3" /> Backup imported successfully!
                </p>
              )}

              {mergePreview && importData && (
                <div className="rounded-card bg-glass border border-glass-border p-3 flex flex-col gap-2 mt-1">
                  <p className="font-sans text-small text-ink-900 font-medium">
                    Import preview:
                  </p>
                  <p className="font-sans text-micro text-ink-700">
                    {mergePreview.previewText}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={overwritePrefs}
                      onChange={e => setOverwritePrefs(e.target.checked)}
                      className="rounded text-accent focus:ring-accent"
                    />
                    <span className="font-sans text-micro text-ink-700">
                      Overwrite preferences (clock format, sound, motion)
                    </span>
                  </label>
                  <PillButton
                    variant="primary"
                    size="sm"
                    onClick={handleApplyImport}
                    className="w-full justify-center mt-1"
                  >
                    Apply import
                  </PillButton>
                </div>
              )}
            </div>

            {/* Reset All */}
            <div className="pt-2">
              <PillButton
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw className="h-3.5 w-3.5 text-danger" />}
                onClick={() => setShowResetConfirm(true)}
                className="w-full justify-center text-danger hover:bg-danger/10"
              >
                Reset all data...
              </PillButton>
            </div>
          </section>

          {/* Section 8: Plain-language Privacy Note */}
          <section className="rounded-card bg-glass-panel border border-glass-border p-3.5 flex flex-col gap-1.5">
            <span className="font-sans text-small text-ink-900 font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>Privacy Note</span>
            </span>
            <p className="font-sans text-micro text-ink-700 leading-relaxed">
              Everything you do in Purrfocus is stored locally in your browser. There are no accounts,
              no trackers, and no analytics. Your data never leaves your device unless you export it yourself.
            </p>
          </section>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        open={showResetConfirm}
        onClose={() => {
          setShowResetConfirm(false);
          setResetInput('');
        }}
        title="Reset all data"
      >
        <div className="flex flex-col gap-4 text-ink-900">
          <div className="flex items-start gap-3 rounded-card bg-danger/10 border border-danger/20 p-3 text-danger">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="font-sans text-small leading-relaxed">
              This will permanently delete all local sessions, tasks, streak progress, and settings.
              This cannot be undone.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <TextField
              label="Type reset to confirm"
              value={resetInput}
              onChange={setResetInput}
              placeholder="reset"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <PillButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowResetConfirm(false);
                setResetInput('');
              }}
            >
              Cancel
            </PillButton>
            <PillButton
              variant="primary"
              size="sm"
              disabled={resetInput.trim().toLowerCase() !== 'reset'}
              onClick={resetAllData}
              className="bg-danger hover:bg-danger/90 text-white"
            >
              Delete everything
            </PillButton>
          </div>
        </div>
      </Modal>
    </>
  );
};
