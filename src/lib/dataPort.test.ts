import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildExportPayload,
  downloadExportJson,
  validateImportData,
  calculateMergePreview,
  applyImport,
  resetAllData,
  EXPORT_SCHEMA_VERSION,
  type PurrfocusExportData,
} from './dataPort';
import { useStatsStore } from '@/features/stats/store';
import { useIntentionsStore } from '@/features/intentions/store';
import { useCatStore } from '@/features/cat/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useSceneryStore } from '@/features/scenery/store';

describe('dataPort module', () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.setState({
      logs: [
        {
          sessionId: 'sess-1',
          date: '2026-11-15',
          completedAt: 1763200000000,
          minutes: 25,
          subject: 'Math',
          source: 'finish',
        },
      ],
    });
    useIntentionsStore.setState({
      tasks: [
        { id: 'task-1', text: 'Finish problem set', done: false, createdAt: 1763200000000, pomodoros: 0 },
      ],
      subject: 'Math',
    });
    useCatStore.setState({
      name: 'Mochi',
      catId: 'calico',
      outfitId: null,
      bond: 150,
      studyPoseVariant: 0,
    });
    useSceneryStore.setState({
      defaultSceneId: 'scene4',
      favoriteSceneIds: ['scene4'],
    });
    usePrefsStore.setState({
      sfxOn: true,
      rareEventsOn: true,
      clockFormat: 'auto',
      reduceMotion: 'system',
    });
  });

  describe('buildExportPayload & downloadExportJson', () => {
    it('creates a complete export object conforming to EXPORT_SCHEMA_VERSION', () => {
      const payload = buildExportPayload();
      expect(payload.version).toBe(EXPORT_SCHEMA_VERSION);
      expect(payload.stats.logs).toHaveLength(1);
      expect(payload.stats.logs[0]?.sessionId).toBe('sess-1');
      expect(payload.intentions.tasks).toHaveLength(1);
      expect(payload.cat.name).toBe('Mochi');
      expect(payload.cat.bond).toBe(150);
      expect(payload.scenery.defaultSceneId).toBe('scene4');
      expect(payload.prefs.reduceMotion).toBe('system');
    });

    it('downloads export JSON without error', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const payload = downloadExportJson();
      expect(payload.version).toBe(EXPORT_SCHEMA_VERSION);
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('validateImportData', () => {
    it('rejects null or non-object payloads', () => {
      expect(validateImportData(null).valid).toBe(false);
      expect(validateImportData('invalid string').valid).toBe(false);
    });

    it('rejects wrong schema versions', () => {
      const result = validateImportData({ version: 99 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Unsupported backup version');
      }
    });

    it('rejects payloads missing stats or tasks arrays', () => {
      const res1 = validateImportData({ version: EXPORT_SCHEMA_VERSION, stats: null });
      expect(res1.valid).toBe(false);

      const res2 = validateImportData({
        version: EXPORT_SCHEMA_VERSION,
        stats: { logs: [] },
        intentions: null,
      });
      expect(res2.valid).toBe(false);
    });

    it('validates a well-formed export object', () => {
      const validPayload: PurrfocusExportData = buildExportPayload();
      const res = validateImportData(validPayload);
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.version).toBe(EXPORT_SCHEMA_VERSION);
      }
    });
  });

  describe('calculateMergePreview', () => {
    it('correctly categorizes new items and conflicting duplicates', () => {
      const incoming: PurrfocusExportData = {
        version: EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        stats: {
          logs: [
            // existing
            {
              sessionId: 'sess-1',
              date: '2026-11-15',
              completedAt: 1763200000000,
              minutes: 25,
              subject: 'Math',
              source: 'finish',
            },
            // new
            {
              sessionId: 'sess-2',
              date: '2026-11-16',
              completedAt: 1763286400000,
              minutes: 45,
              subject: 'Physics',
              source: 'finish',
            },
          ],
        },
        intentions: {
          tasks: [
            // existing
            { id: 'task-1', text: 'Existing task', done: true, createdAt: 100, pomodoros: 1 },
            // new
            { id: 'task-2', text: 'New task', done: false, createdAt: 200, pomodoros: 0 },
          ],
          subject: 'Physics',
        },
        cat: {
          name: 'Luna',
          catId: 'black',
          outfitId: null,
          bond: 200,
          studyPoseVariant: 1,
        },
        scenery: {
          defaultSceneId: 'scene5',
          favoriteSceneIds: [],
        },
        prefs: {
          sfxOn: false,
          rareEventsOn: false,
          clockFormat: '24h',
          reduceMotion: 'on',
        },
      };

      const preview = calculateMergePreview(incoming);
      expect(preview.newSessions).toBe(1);
      expect(preview.newTasks).toBe(1);
      expect(preview.conflicts).toBe(2);
      expect(preview.previewText).toBe('1 sessions, 1 tasks, 2 conflicts');
    });
  });

  describe('applyImport', () => {
    it('merges sessions and tasks with existing data winning on id collisions', () => {
      const incoming: PurrfocusExportData = {
        version: EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        stats: {
          logs: [
            // Conflict: same sessionId, different minutes
            {
              sessionId: 'sess-1',
              date: '2026-11-15',
              completedAt: 1763200000000,
              minutes: 999,
              subject: 'Different',
              source: 'finish',
            },
            // New session
            {
              sessionId: 'sess-2',
              date: '2026-11-16',
              completedAt: 1763286400000,
              minutes: 50,
              subject: 'Coding',
              source: 'finish',
            },
          ],
        },
        intentions: {
          tasks: [
            // Conflict
            { id: 'task-1', text: 'Overwritten?', done: true, createdAt: 100, pomodoros: 1 },
            // New
            { id: 'task-2', text: 'New task', done: false, createdAt: 200, pomodoros: 0 },
          ],
          subject: 'Coding',
        },
        cat: {
          name: 'Kiki',
          catId: 'tuxedo',
          outfitId: null,
          bond: 300,
          studyPoseVariant: 0,
        },
        scenery: {
          defaultSceneId: 'scene2',
          favoriteSceneIds: [],
        },
        prefs: {
          sfxOn: false,
          rareEventsOn: false,
          clockFormat: '24h',
          reduceMotion: 'on',
        },
      };

      // Import without overwriting prefs
      applyImport(incoming, { overwritePrefs: false });

      const logs = useStatsStore.getState().logs;
      expect(logs).toHaveLength(2);
      // Existing session preserved
      expect(logs.find(l => l.sessionId === 'sess-1')?.minutes).toBe(25);
      expect(logs.find(l => l.sessionId === 'sess-2')?.minutes).toBe(50);

      const tasks = useIntentionsStore.getState().tasks;
      expect(tasks).toHaveLength(2);
      expect(tasks.find(t => t.id === 'task-1')?.text).toBe('Finish problem set');
      expect(tasks.find(t => t.id === 'task-2')?.text).toBe('New task');

      // Cat updates bond to max and adopts customization
      expect(useCatStore.getState().bond).toBe(300);
      expect(useCatStore.getState().name).toBe('Kiki');

      // Prefs remain unchanged when overwritePrefs is false
      expect(usePrefsStore.getState().clockFormat).toBe('auto');
    });

    it('overwrites preferences when overwritePrefs is true', () => {
      const incoming: PurrfocusExportData = {
        version: EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        stats: { logs: [] },
        intentions: { tasks: [], subject: '' },
        cat: { name: 'Mochi', catId: 'calico', outfitId: null, bond: 10, studyPoseVariant: 0 },
        scenery: { defaultSceneId: 'scene1', favoriteSceneIds: [] },
        prefs: {
          sfxOn: false,
          rareEventsOn: false,
          clockFormat: '24h',
          reduceMotion: 'on',
        },
      };

      applyImport(incoming, { overwritePrefs: true });

      expect(usePrefsStore.getState().clockFormat).toBe('24h');
      expect(usePrefsStore.getState().reduceMotion).toBe('on');
      expect(usePrefsStore.getState().sfxOn).toBe(false);
    });
  });

  describe('resetAllData', () => {
    it('deletes all purrfocus:* keys and touches nothing else', () => {
      localStorage.setItem('purrfocus:stats', 'test-stats');
      localStorage.setItem('purrfocus:prefs', 'test-prefs');
      localStorage.setItem('unrelated-app:data', 'keep-me');

      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      resetAllData();

      expect(localStorage.getItem('purrfocus:stats')).toBeNull();
      expect(localStorage.getItem('purrfocus:prefs')).toBeNull();
      expect(localStorage.getItem('unrelated-app:data')).toBe('keep-me');
      expect(reloadMock).toHaveBeenCalled();
    });
  });
});
