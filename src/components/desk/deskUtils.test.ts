import { describe, it, expect } from 'vitest';
import { getHeatmapBucket, buildHeatmapGrid, groupSubjects } from './deskUtils';

describe('deskUtils', () => {
  describe('getHeatmapBucket', () => {
    it('returns bucket 0 for 0 or negative minutes', () => {
      expect(getHeatmapBucket(0)).toBe(0);
      expect(getHeatmapBucket(-5)).toBe(0);
    });

    it('returns bucket 1 for 1 to 24 minutes (boundary test: 1 and 24)', () => {
      expect(getHeatmapBucket(1)).toBe(1);
      expect(getHeatmapBucket(15)).toBe(1);
      expect(getHeatmapBucket(24)).toBe(1);
    });

    it('returns bucket 2 for 25 to 49 minutes (boundary test: 25 and 49)', () => {
      expect(getHeatmapBucket(25)).toBe(2);
      expect(getHeatmapBucket(35)).toBe(2);
      expect(getHeatmapBucket(49)).toBe(2);
    });

    it('returns bucket 3 for 50 to 99 minutes (boundary test: 50 and 99)', () => {
      expect(getHeatmapBucket(50)).toBe(3);
      expect(getHeatmapBucket(75)).toBe(3);
      expect(getHeatmapBucket(99)).toBe(3);
    });

    it('returns bucket 4 for 100+ minutes (boundary test: 100)', () => {
      expect(getHeatmapBucket(100)).toBe(4);
      expect(getHeatmapBucket(150)).toBe(4);
      expect(getHeatmapBucket(600)).toBe(4);
    });
  });

  describe('buildHeatmapGrid', () => {
    it('generates 26 columns of 7 days each (182 cells total)', () => {
      const grid = buildHeatmapGrid({ '2026-11-16': 45 }, '2026-11-16');
      expect(grid).toHaveLength(26);
      for (const col of grid) {
        expect(col).toHaveLength(7);
      }

      // Check that the specified date received the correct bucket and minutes
      const lastWeek = grid[25]!;
      const matchingCell = lastWeek.find(c => c.date === '2026-11-16');
      expect(matchingCell).toBeDefined();
      expect(matchingCell?.minutes).toBe(45);
      expect(matchingCell?.bucket).toBe(2);
    });
  });

  describe('groupSubjects', () => {
    it('returns empty array when input is empty or all zeroes', () => {
      expect(groupSubjects({})).toEqual([]);
      expect(groupSubjects({ Math: 0, English: 0 })).toEqual([]);
    });

    it('returns up to 5 subjects without "Other" grouping', () => {
      const raw = {
        Math: 60,
        Science: 40,
        History: 30,
        Art: 20,
        Music: 10,
      };
      const result = groupSubjects(raw);
      expect(result).toHaveLength(5);
      expect(result.map(r => r.subject)).toEqual(['Math', 'Science', 'History', 'Art', 'Music']);
      expect(result.find(r => r.subject === 'Other')).toBeUndefined();
    });

    it('groups 6 or more subjects into top 5 plus "Other"', () => {
      const raw = {
        Math: 100,
        Science: 80,
        History: 60,
        Art: 40,
        Music: 20,
        Physics: 15,
        Chemistry: 10,
        Biology: 5,
      };
      const result = groupSubjects(raw);
      expect(result).toHaveLength(6);
      expect(result.slice(0, 5).map(r => r.subject)).toEqual([
        'Math',
        'Science',
        'History',
        'Art',
        'Music',
      ]);
      const otherSlice = result[5]!;
      expect(otherSlice.subject).toBe('Other');
      expect(otherSlice.minutes).toBe(30); // 15 + 10 + 5
    });
  });
});
