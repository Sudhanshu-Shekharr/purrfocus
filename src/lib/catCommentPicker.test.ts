import { describe, it, expect } from 'vitest';
import {
  hashString,
  getCatCommentForSession,
  JOURNAL_NOTE_LINES,
} from './catCommentPicker';

describe('catCommentPicker', () => {
  it('hashString produces a stable non-negative integer for identical strings', () => {
    const h1 = hashString('session-abc');
    const h2 = hashString('session-abc');
    expect(h1).toBe(h2);
    expect(h1).toBeGreaterThanOrEqual(0);
  });

  it('getCatCommentForSession is deterministic for identical session IDs and moods', () => {
    const comment1 = getCatCommentForSession('stable-session-id', 4);
    const comment2 = getCatCommentForSession('stable-session-id', 4);
    expect(comment1).toBe(comment2);
  });

  it('selects from encouraging pool for moods 1 and 2', () => {
    const encouragingPool = JOURNAL_NOTE_LINES.slice(0, 6);
    const comment1 = getCatCommentForSession('sess-tired', 1);
    const comment2 = getCatCommentForSession('sess-okay', 2);

    expect(encouragingPool).toContain(comment1);
    expect(encouragingPool).toContain(comment2);
  });

  it('selects from warm/celebratory pool for moods 4 and 5', () => {
    const celebratoryPool = JOURNAL_NOTE_LINES.slice(11, 16);
    const comment4 = getCatCommentForSession('sess-great', 4);
    const comment5 = getCatCommentForSession('sess-flow', 5);

    expect(celebratoryPool).toContain(comment4);
    expect(celebratoryPool).toContain(comment5);
  });

  it('selects from gentle/steady pool for mood 3 or undefined mood', () => {
    const gentlePool = JOURNAL_NOTE_LINES.slice(6, 11);
    const comment3 = getCatCommentForSession('sess-neutral', 3);
    const commentUnset = getCatCommentForSession('sess-unset', undefined);

    expect(gentlePool).toContain(comment3);
    expect(gentlePool).toContain(commentUnset);
  });
});
