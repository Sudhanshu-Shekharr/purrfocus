import { describe, it, expect, beforeEach } from 'vitest';
import { checkWelcomeBackMoment } from './welcome';
import { useStatsStore } from '@/features/stats/store';
import { usePrefsStore } from '@/features/prefs/store';
import { useCatRuntimeStore } from '@/features/cat/controller';
import { getCatLines } from '@/features/cat/lines';

describe('Welcome Back Moment', () => {
  const TODAY = '2026-10-29';
  const TWO_DAYS_AGO = '2026-10-27';

  beforeEach(() => {
    useStatsStore.setState({ logs: [] });
    usePrefsStore.setState({ lastWelcomeDay: null });
    useCatRuntimeStore.setState({
      currentLine: 'ready whenever you are.',
      recentLines: ['ready whenever you are.'],
    });
  });

  it('does NOT trigger welcome back if user has no prior sessions', () => {
    const triggered = checkWelcomeBackMoment(TODAY);
    expect(triggered).toBe(false);
    expect(usePrefsStore.getState().lastWelcomeDay).toBeNull();
  });

  it('does NOT trigger welcome back if user already studied today (gapDays == 0)', () => {
    useStatsStore.getState().logFocusSession({
      id: 'sess-today',
      minutes: 25,
      date: TODAY,
      endedAt: Date.now(),
    });

    const triggered = checkWelcomeBackMoment(TODAY);
    expect(triggered).toBe(false);
  });

  it('triggers welcome back when user returns after being away (gapDays >= 1) with prior sessions', () => {
    useStatsStore.getState().logFocusSession({
      id: 'sess-past',
      minutes: 25,
      date: TWO_DAYS_AGO,
      endedAt: Date.now() - 2 * 86400000,
    });

    const triggered = checkWelcomeBackMoment(TODAY);
    expect(triggered).toBe(true);

    // Verifies lastWelcomeDay was stored as TODAY
    expect(usePrefsStore.getState().lastWelcomeDay).toBe(TODAY);

    // Thought bubble line is from the welcomeBack pool
    const welcomeBackPool = getCatLines('welcomeBack');
    const currentLine = useCatRuntimeStore.getState().currentLine;
    expect(welcomeBackPool).toContain(currentLine);
  });

  it('only fires once per day (subsequent calls on the same day return false)', () => {
    useStatsStore.getState().logFocusSession({
      id: 'sess-past',
      minutes: 25,
      date: TWO_DAYS_AGO,
      endedAt: Date.now() - 2 * 86400000,
    });

    // First call triggers
    expect(checkWelcomeBackMoment(TODAY)).toBe(true);

    // Second call on the same day does not trigger
    expect(checkWelcomeBackMoment(TODAY)).toBe(false);
  });
});
