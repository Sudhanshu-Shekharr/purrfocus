import { useStatsStore } from '@/features/stats/store';
import { useIntentionsStore } from '@/features/intentions/store';
import { useCatStore } from '@/features/cat/store';
import { useSceneryStore } from '@/features/scenery/store';
import { usePrefsStore } from '@/features/prefs/store';
import { getTodayDateString } from '@/features/timer/constants';
import type { SessionLog } from '@/features/stats/types';
import type { Task } from '@/features/intentions/types';
import type { ClockFormat, ReduceMotionOverride } from '@/features/prefs/types';

export const EXPORT_SCHEMA_VERSION = 1;
export const MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export type PurrfocusExportData = {
  version: number;
  exportedAt: string;
  stats: {
    logs: SessionLog[];
  };
  intentions: {
    tasks: Task[];
    subject: string;
  };
  cat: {
    name: string;
    catId: string;
    outfitId: string | null;
    bond: number;
    studyPoseVariant: 0 | 1 | 2;
  };
  scenery: {
    defaultSceneId: string;
    favoriteSceneIds: string[];
  };
  prefs: {
    sfxOn: boolean;
    rareEventsOn: boolean;
    clockFormat: ClockFormat;
    reduceMotion: ReduceMotionOverride;
  };
};

export type MergePreview = {
  newSessions: number;
  newTasks: number;
  conflicts: number;
  previewText: string;
};

export type ValidationResult =
  | { valid: true; data: PurrfocusExportData }
  | { valid: false; error: string };

/**
 * Builds the sanitized backup JSON payload.
 * Strictly excludes:
 * - Local audio blobs and object URLs (which are runtime-only)
 * - Temporary room nicknames or presence state
 */
export function buildExportPayload(): PurrfocusExportData {
  const statsState = useStatsStore.getState();
  const intentionsState = useIntentionsStore.getState();
  const catState = useCatStore.getState();
  const sceneryState = useSceneryStore.getState();
  const prefsState = usePrefsStore.getState();

  return {
    version: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    stats: {
      logs: statsState.logs,
    },
    intentions: {
      tasks: intentionsState.tasks,
      subject: intentionsState.subject,
    },
    cat: {
      name: catState.name,
      catId: catState.catId,
      outfitId: catState.outfitId,
      bond: catState.bond,
      studyPoseVariant: catState.studyPoseVariant,
    },
    scenery: {
      defaultSceneId: sceneryState.defaultSceneId,
      favoriteSceneIds: sceneryState.favoriteSceneIds,
    },
    prefs: {
      sfxOn: prefsState.sfxOn,
      rareEventsOn: prefsState.rareEventsOn,
      clockFormat: prefsState.clockFormat,
      reduceMotion: prefsState.reduceMotion,
    },
  };
}

/**
 * Triggers a browser file download of the Purrfocus export JSON.
 */
export function downloadExportJson(): PurrfocusExportData {
  const payload = buildExportPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `purrfocus-backup-${getTodayDateString()}.json`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return payload;
}

/**
 * Validates a parsed or raw import object against the backup schema.
 */
export function validateImportData(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Malformed JSON backup file.' };
  }

  const d = raw as Partial<PurrfocusExportData>;

  if (typeof d.version !== 'number' || d.version !== EXPORT_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Unsupported backup version: ${d.version ?? 'unknown'}. Expected version ${EXPORT_SCHEMA_VERSION}.`,
    };
  }

  if (!d.stats || !Array.isArray(d.stats.logs)) {
    return { valid: false, error: 'Missing or malformed stats logs in backup.' };
  }

  for (const log of d.stats.logs) {
    if (!log || typeof log !== 'object' || typeof log.sessionId !== 'string' || typeof log.minutes !== 'number') {
      return { valid: false, error: 'Invalid session log entry in backup.' };
    }
  }

  if (!d.intentions || !Array.isArray(d.intentions.tasks)) {
    return { valid: false, error: 'Missing or malformed tasks list in backup.' };
  }

  for (const task of d.intentions.tasks) {
    if (!task || typeof task !== 'object' || typeof task.id !== 'string' || typeof task.text !== 'string') {
      return { valid: false, error: 'Invalid task entry in backup.' };
    }
  }

  return { valid: true, data: raw as PurrfocusExportData };
}

/**
 * Calculates a preview of new items vs conflicts before merging.
 */
export function calculateMergePreview(incoming: PurrfocusExportData): MergePreview {
  const currentLogs = useStatsStore.getState().logs;
  const currentTasks = useIntentionsStore.getState().tasks;

  const existingSessionIds = new Set(currentLogs.map(l => l.sessionId));
  const existingTaskIds = new Set(currentTasks.map(t => t.id));

  let newSessions = 0;
  let conflictingSessions = 0;
  for (const log of incoming.stats.logs) {
    if (existingSessionIds.has(log.sessionId)) {
      conflictingSessions++;
    } else {
      newSessions++;
    }
  }

  let newTasks = 0;
  let conflictingTasks = 0;
  for (const task of incoming.intentions.tasks) {
    if (existingTaskIds.has(task.id)) {
      conflictingTasks++;
    } else {
      newTasks++;
    }
  }

  const totalConflicts = conflictingSessions + conflictingTasks;
  const previewText = `${newSessions} sessions, ${newTasks} tasks, ${totalConflicts} conflicts`;

  return {
    newSessions,
    newTasks,
    conflicts: totalConflicts,
    previewText,
  };
}

/**
 * Merges backup data into the active Zustand stores.
 * Rules:
 * - Sessions merge by sessionId; existing entries win (idempotent)
 * - Tasks merge by id; existing tasks win
 * - Prefs are only overwritten if explicitly requested
 */
export function applyImport(
  incoming: PurrfocusExportData,
  options?: { overwritePrefs?: boolean },
): void {
  // 1. Merge sessions (existing win)
  const currentLogs = useStatsStore.getState().logs;
  const existingSessionIds = new Set(currentLogs.map(l => l.sessionId));
  const logsToAdd = incoming.stats.logs.filter(l => !existingSessionIds.has(l.sessionId));

  if (logsToAdd.length > 0) {
    useStatsStore.setState({
      logs: [...currentLogs, ...logsToAdd].slice(-2000),
    });
  }

  // 2. Merge tasks (existing win)
  const currentTasks = useIntentionsStore.getState().tasks;
  const existingTaskIds = new Set(currentTasks.map(t => t.id));
  const tasksToAdd = incoming.intentions.tasks.filter(t => !existingTaskIds.has(t.id));

  if (tasksToAdd.length > 0) {
    useIntentionsStore.setState({
      tasks: [...currentTasks, ...tasksToAdd].slice(0, 100),
    });
  }

  // 3. Companion bond and cosmetics: adopt higher bond or incoming customization
  if (incoming.cat) {
    const currentCat = useCatStore.getState();
    useCatStore.setState({
      bond: Math.max(currentCat.bond, incoming.cat.bond ?? 0),
      name: incoming.cat.name || currentCat.name,
      catId: incoming.cat.catId || currentCat.catId,
      outfitId: incoming.cat.outfitId ?? currentCat.outfitId,
    });
  }

  // 4. Overwrite prefs only with confirmation
  if (options?.overwritePrefs && incoming.prefs) {
    usePrefsStore.setState({
      sfxOn: incoming.prefs.sfxOn ?? true,
      rareEventsOn: incoming.prefs.rareEventsOn ?? true,
      clockFormat: incoming.prefs.clockFormat ?? 'auto',
      reduceMotion: incoming.prefs.reduceMotion ?? 'system',
    });
  }
}

/**
 * Clears all purrfocus:* keys from localStorage and reloads the application.
 * Touches nothing else in localStorage.
 */
export function resetAllData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const allKeys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('purrfocus:')) {
      allKeys.push(key);
    }
  }

  for (const k of allKeys) {
    window.localStorage.removeItem(k);
  }

  if (typeof window.location !== 'undefined' && typeof window.location.reload === 'function') {
    window.location.reload();
  }
}
