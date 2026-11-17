import { getTodayDateString } from '@/features/timer/constants';

/**
 * Maps focus minutes to a 5-tier heatmap bucket index (0-4).
 * Boundaries:
 * - 0: 0 minutes
 * - 1: 1 - 24 minutes
 * - 2: 25 - 49 minutes
 * - 3: 50 - 99 minutes
 * - 4: 100+ minutes
 */
export function getHeatmapBucket(minutes: number): 0 | 1 | 2 | 3 | 4 {
  const safe = Math.max(0, Math.round(minutes));
  if (safe === 0) return 0;
  if (safe < 25) return 1;
  if (safe < 50) return 2;
  if (safe < 100) return 3;
  return 4;
}

export type HeatmapCell = {
  date: string; // YYYY-MM-DD
  minutes: number;
  bucket: 0 | 1 | 2 | 3 | 4;
  weekday: number; // 0 = Monday ... 6 = Sunday
  col: number; // 0 ... 25
  row: number; // 0 ... 6
};

/**
 * Builds a 26-week calendar matrix ending at the current local week.
 * 26 columns (weeks), 7 rows (Mon-Sun).
 */
export function buildHeatmapGrid(
  minutesMap: Record<string, number>,
  referenceToday: string = getTodayDateString(),
): HeatmapCell[][] {
  const [y, m, d] = referenceToday.split('-').map(Number);
  const todayDate = new Date(y!, m! - 1, d!);

  // Find Monday of the current week (ISO: Mon=1, Sun=7)
  const currentDayOfWeek = todayDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  const currentWeekMonday = new Date(todayDate);
  currentWeekMonday.setDate(todayDate.getDate() - daysToMonday);

  // 25 weeks before currentWeekMonday gives 26 weeks total
  const startDate = new Date(currentWeekMonday);
  startDate.setDate(currentWeekMonday.getDate() - 25 * 7);

  const grid: HeatmapCell[][] = [];

  for (let col = 0; col < 26; col++) {
    const weekCol: HeatmapCell[] = [];
    for (let row = 0; row < 7; row++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + col * 7 + row);

      const cellDateStr = getTodayDateString(cellDate);
      const minutes = minutesMap[cellDateStr] ?? 0;

      weekCol.push({
        date: cellDateStr,
        minutes,
        bucket: getHeatmapBucket(minutes),
        weekday: row,
        col,
        row,
      });
    }
    grid.push(weekCol);
  }

  return grid;
}

export type SubjectSlice = {
  subject: string;
  minutes: number;
  percentage: number;
};

/**
 * Takes minutes by subject record, sorts descending, takes up to 5 subjects,
 * and groups the remainder into "Other". Calculates percentage of total.
 */
export function groupSubjects(rawMap: Record<string, number>): SubjectSlice[] {
  const entries = Object.entries(rawMap)
    .filter(([, mins]) => mins > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalMinutes = entries.reduce((acc, [, mins]) => acc + mins, 0);
  if (totalMinutes === 0) return [];

  let topSlices: { subject: string; minutes: number }[] = [];

  if (entries.length <= 5) {
    topSlices = entries.map(([subject, minutes]) => ({ subject, minutes }));
  } else {
    const firstFive = entries.slice(0, 5);
    const otherEntries = entries.slice(5);
    const otherMinutes = otherEntries.reduce((sum, [, m]) => sum + m, 0);

    topSlices = firstFive.map(([subject, minutes]) => ({ subject, minutes }));
    if (otherMinutes > 0) {
      topSlices.push({ subject: 'Other', minutes: otherMinutes });
    }
  }

  return topSlices.map(s => ({
    ...s,
    percentage: Math.round((s.minutes / totalMinutes) * 100),
  }));
}
