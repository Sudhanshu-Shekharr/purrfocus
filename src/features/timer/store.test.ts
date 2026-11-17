import { describe, it, expect, beforeEach } from 'vitest';
import { useTimerStore, sanitizeTimerState } from './store';
import { DEFAULT_DURATIONS, getInitialTimerState } from './constants';
import { subscribeTimerEvents } from './events';
import type { TimerEvent } from './events';

describe('Timer Store & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimerStore.setState(getInitialTimerState('2026-10-28'));
  });

  it('starts a session and updates state', () => {
    const events: TimerEvent[] = [];
    const unsub = subscribeTimerEvents(e => events.push(e));

    useTimerStore.getState().start();

    const state = useTimerStore.getState();
    expect(state.status).toBe('running');
    expect(state.sessionId).toBeTruthy();
    expect(state.endsAt).toBeGreaterThan(Date.now());
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('start');

    unsub();
  });

  it('pauses and resumes updating status and events', () => {
    const events: TimerEvent[] = [];
    const unsub = subscribeTimerEvents(e => events.push(e));

    useTimerStore.getState().start();
    useTimerStore.getState().pause();

    let state = useTimerStore.getState();
    expect(state.status).toBe('paused');
    expect(state.endsAt).toBeNull();

    useTimerStore.getState().resume();
    state = useTimerStore.getState();
    expect(state.status).toBe('running');
    expect(state.endsAt).toBeGreaterThan(Date.now());

    expect(events.map(e => e.type)).toEqual(['start', 'pause', 'resume']);

    unsub();
  });

  it('resets session to idle full duration', () => {
    useTimerStore.getState().start();
    useTimerStore.getState().reset();

    const state = useTimerStore.getState();
    expect(state.status).toBe('idle');
    expect(state.remaining).toBe(DEFAULT_DURATIONS.focus);
    expect(state.endsAt).toBeNull();
  });

  it('sanitizes corrupt or partial state without throwing', () => {
    const corrupt = {
      mode: 'invalid_mode',
      status: 'alien_status',
      durations: { focus: -10, shortBreak: 'NaN' },
      cyclesBeforeLongBreak: 999,
      remaining: 'invalid',
    };

    const sanitized = sanitizeTimerState(corrupt);
    expect(sanitized.mode).toBe('focus');
    expect(sanitized.status).toBe('idle');
    expect(sanitized.durations.focus).toBe(DEFAULT_DURATIONS.focus);
    expect(sanitized.cyclesBeforeLongBreak).toBe(4);
    expect(sanitized.remaining).toBe(DEFAULT_DURATIONS.focus);
  });

  it('recovers future running session on reload', () => {
    const now = 2000000;
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'running',
      endsAt: now + 600 * 1000,
      remaining: 1500,
      sessionId: 'sess-abc',
    });

    useTimerStore.getState().rehydrate(now, '2026-10-28');

    const state = useTimerStore.getState();
    expect(state.status).toBe('running');
    expect(state.remaining).toBe(600);
    expect(state.sessionId).toBe('sess-abc');
  });

  it('handles session finished while tab was closed (endsAt in past)', () => {
    const events: TimerEvent[] = [];
    const unsub = subscribeTimerEvents(e => events.push(e));

    const now = 2000000;
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'running',
      endsAt: now - 30 * 1000,
      remaining: 30,
      sessionId: 'sess-past',
    });

    useTimerStore.getState().rehydrate(now, '2026-10-28');

    const state = useTimerStore.getState();
    expect(state.status).toBe('finished');
    expect(state.remaining).toBe(0);
    expect(state.completedFocusSessions).toBe(1);

    // Verifies 'recovered' event emitted instead of 'finish'
    expect(events.some(e => e.type === 'recovered')).toBe(true);
    expect(events.some(e => e.type === 'finish')).toBe(false);

    unsub();
  });

  it('survives paused and finished states across reload', () => {
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'paused',
      remaining: 720,
    });

    useTimerStore.getState().rehydrate(Date.now(), '2026-10-28');
    expect(useTimerStore.getState().status).toBe('paused');
    expect(useTimerStore.getState().remaining).toBe(720);

    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'finished',
      remaining: 0,
    });

    useTimerStore.getState().rehydrate(Date.now(), '2026-10-28');
    expect(useTimerStore.getState().status).toBe('finished');
  });

  it('advances from finished to nextMode and respects autoStartNext', () => {
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'finished',
      mode: 'focus',
      completedFocusSessions: 1,
      autoStartNext: true,
    });

    useTimerStore.getState().advance();

    const state = useTimerStore.getState();
    expect(state.mode).toBe('shortBreak');
    expect(state.status).toBe('running'); // Auto-started!
  });
});
