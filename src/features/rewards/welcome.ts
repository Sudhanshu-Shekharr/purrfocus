import { getTodayDateString } from '@/features/timer/constants';
import { calculateStreak } from './streak';
import { useStatsStore } from '@/features/stats/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { getCatLines } from '@/features/cat/lines';
import { pickLineWithWindow } from '@/features/cat/pickLine';

/**
 * Checks if a "Welcome back" moment should trigger on session start.
 * Conditions:
 * - User had prior activity (lastActiveDay !== null)
 * - User was away for at least 1 day (gapDays >= 1)
 * - Has not already shown welcomeBack today (lastWelcomeDay !== today)
 *
 * If triggered:
 * - Updates thought bubble to a gentle welcomeBack line
 * - Records today in prefs lastWelcomeDay (fires at most once per return day)
 * - Returns true
 */
export function checkWelcomeBackMoment(
  today: string = getTodayDateString(),
): boolean {
  const prefs = usePrefsStore.getState();
  if (prefs.lastWelcomeDay === today) {
    return false;
  }

  const logs = useStatsStore.getState().logs;
  const streak = calculateStreak(logs.map(l => l.date), today);

  if (streak.lastActiveDay !== null && streak.gapDays >= 1) {
    const pool = getCatLines('welcomeBack');
    const runtime = useCatRuntimeStore.getState();
    const result = pickLineWithWindow(pool, runtime.recentLines);

    if (result.line) {
      useCatRuntimeStore.setState({
        currentLine: result.line,
        recentLines: result.updatedRecent,
      });
      usePrefsStore.getState().setLastWelcomeDay(today);
      return true;
    }
  }

  return false;
}
