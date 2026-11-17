import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePrefsStore,
  getInitialPrefs,
  sanitizePrefs,
  migrateLegacySfxPref,
  LEGACY_CAT_STORAGE_KEY,
} from './store';
import { useCatStore } from '@/features/cat/store';

describe('usePrefsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePrefsStore.getState().resetPrefs();
  });

  it('initializes with expected default values', () => {
    const state = usePrefsStore.getState();
    expect(state.sfxOn).toBe(true);
    expect(state.focusMode).toBe(false);
    expect(state.rareEventsOn).toBe(true);
    expect(state.lastWelcomeDay).toBeNull();
    expect(state.clockFormat).toBe('auto');
  });

  it('sets and updates clockFormat preference', () => {
    expect(usePrefsStore.getState().clockFormat).toBe('auto');

    usePrefsStore.getState().setClockFormat('12h');
    expect(usePrefsStore.getState().clockFormat).toBe('12h');

    usePrefsStore.getState().setClockFormat('24h');
    expect(usePrefsStore.getState().clockFormat).toBe('24h');
  });

  it('toggles and sets sfxOn directly', () => {
    expect(usePrefsStore.getState().sfxOn).toBe(true);

    usePrefsStore.getState().toggleSfx();
    expect(usePrefsStore.getState().sfxOn).toBe(false);

    usePrefsStore.getState().setSfxOn(true);
    expect(usePrefsStore.getState().sfxOn).toBe(true);
  });

  it('toggles and sets rareEventsOn directly', () => {
    expect(usePrefsStore.getState().rareEventsOn).toBe(true);

    usePrefsStore.getState().toggleRareEvents();
    expect(usePrefsStore.getState().rareEventsOn).toBe(false);

    usePrefsStore.getState().setRareEventsOn(true);
    expect(usePrefsStore.getState().rareEventsOn).toBe(true);
  });

  it('toggles and sets focusMode directly', () => {
    expect(usePrefsStore.getState().focusMode).toBe(false);

    usePrefsStore.getState().toggleFocusMode();
    expect(usePrefsStore.getState().focusMode).toBe(true);

    usePrefsStore.getState().setFocusMode(false);
    expect(usePrefsStore.getState().focusMode).toBe(false);
  });

  it('tracks lastWelcomeDay', () => {
    usePrefsStore.getState().setLastWelcomeDay('2026-10-29');
    expect(usePrefsStore.getState().lastWelcomeDay).toBe('2026-10-29');
  });

  describe('persistence and serialization', () => {
    it('focusMode is never persisted (session-only)', () => {
      // Simulate state rehydration with dirty or true focusMode
      const sanitized = sanitizePrefs({
        sfxOn: false,
        focusMode: true,
        rareEventsOn: false,
        lastWelcomeDay: '2026-10-28',
      });

      expect(sanitized.sfxOn).toBe(false);
      expect(sanitized.rareEventsOn).toBe(false);
      expect(sanitized.lastWelcomeDay).toBe('2026-10-28');
      // focusMode must ALWAYS sanitize to false
      expect(sanitized.focusMode).toBe(false);
    });

    it('sanitizes dirty or missing persisted input', () => {
      expect(sanitizePrefs(null)).toEqual(getInitialPrefs());
      expect(sanitizePrefs(undefined)).toEqual(getInitialPrefs());
      expect(sanitizePrefs('invalid')).toEqual(getInitialPrefs());

      const dirty = {
        sfxOn: 'yes',
        rareEventsOn: 123,
        lastWelcomeDay: 456,
      };
      const cleaned = sanitizePrefs(dirty);
      expect(cleaned.sfxOn).toBe(true);
      expect(cleaned.rareEventsOn).toBe(true);
      expect(cleaned.lastWelcomeDay).toBeNull();
      expect(cleaned.focusMode).toBe(false);
    });
  });

  describe('migration from legacy cat store', () => {
    it('migrates sfxOn=false from legacy cat store and removes it from cat storage', () => {
      const legacyState = {
        state: {
          name: 'Mochi',
          catId: 'mochi',
          bond: 15,
          studyPoseVariant: 1,
          sfxOn: false,
        },
        version: 1,
      };
      localStorage.setItem(LEGACY_CAT_STORAGE_KEY, JSON.stringify(legacyState));

      const migrated = migrateLegacySfxPref();
      expect(migrated).toBe(false);

      // Verify legacy storage was cleansed of sfxOn
      const raw = localStorage.getItem(LEGACY_CAT_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const updatedLegacy = JSON.parse(raw!);
      expect(updatedLegacy.state.sfxOn).toBeUndefined();
      expect(updatedLegacy.state.name).toBe('Mochi');
      expect(updatedLegacy.state.bond).toBe(15);
    });

    it('returns undefined when no legacy store exists or sfxOn is absent', () => {
      expect(migrateLegacySfxPref()).toBeUndefined();

      localStorage.setItem(LEGACY_CAT_STORAGE_KEY, JSON.stringify({ state: { name: 'Mochi' } }));
      expect(migrateLegacySfxPref()).toBeUndefined();
    });

    it('cat store v1 migration sets prefs sfxOn and preserves companion state', () => {
      usePrefsStore.getState().setSfxOn(true);

      const persistOptions = useCatStore.persist.getOptions();
      expect(persistOptions.migrate).toBeDefined();
      if (!persistOptions.migrate) return;

      const legacyPersisted = {
        name: 'Chai',
        catId: 'chai',
        bond: 42,
        studyPoseVariant: 2,
        sfxOn: false,
      };

      const result = persistOptions.migrate(legacyPersisted, 1) as Record<string, unknown>;
      expect(result.name).toBe('Chai');
      expect(result.catId).toBe('chai');
      expect(result.bond).toBe(42);
      expect(result.studyPoseVariant).toBe(2);
      expect(result.sfxOn).toBeUndefined();

      // Verify prefs store was updated
      expect(usePrefsStore.getState().sfxOn).toBe(false);
    });
  });
});
