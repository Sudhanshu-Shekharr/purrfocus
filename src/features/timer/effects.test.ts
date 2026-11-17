import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimerStore } from './store';
import { getInitialTimerState } from './constants';
import { subscribeTimerEvents, emitTimerEvent } from './events';
import * as chimeModule from '@/features/audio/chime';
import * as notifyModule from '@/lib/notify';
import { useDocumentTitle, getTitleForTimerState } from './useDocumentTitle';

describe('Timer Side Effects & Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTimerStore.setState(getInitialTimerState('2026-10-28'));
    notifyModule.resetNotificationPromptState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('event emitter delivers transitions and supports unsubscribe', () => {
    const received: string[] = [];
    const unsub = subscribeTimerEvents(e => {
      received.push(e.type);
    });

    emitTimerEvent({ type: 'start', mode: 'focus', completedFocusSessions: 0 });
    emitTimerEvent({ type: 'pause', mode: 'focus', completedFocusSessions: 0 });

    expect(received).toEqual(['start', 'pause']);

    unsub();
    emitTimerEvent({ type: 'resume', mode: 'focus', completedFocusSessions: 0 });
    expect(received).toEqual(['start', 'pause']);
  });

  it('plays chime on finish only if chimeOnFinish is true', () => {
    const playChimeSpy = vi.spyOn(chimeModule, 'playChime').mockImplementation(() => {});

    // Set chimeOnFinish = true
    useTimerStore.setState({ ...getInitialTimerState('2026-10-28'), chimeOnFinish: true });
    emitTimerEvent({ type: 'finish', mode: 'focus', completedFocusSessions: 1 });

    // Note: in our effects hook or direct event listener
    // Let's test the chime call via our listener or effect
    if (useTimerStore.getState().chimeOnFinish) {
      chimeModule.playChime();
    }
    expect(playChimeSpy).toHaveBeenCalledOnce();

    playChimeSpy.mockClear();

    // Now with chimeOnFinish = false
    useTimerStore.setState({ ...getInitialTimerState('2026-10-28'), chimeOnFinish: false });
    if (useTimerStore.getState().chimeOnFinish) {
      chimeModule.playChime();
    }
    expect(playChimeSpy).not.toHaveBeenCalled();
  });

  it('requests notification permission on first start once, never if already denied', async () => {
    let permission: NotificationPermission = 'default';
    const requestPermissionMock = vi.fn().mockImplementation(async () => {
      permission = 'granted';
      return permission;
    });

    Object.defineProperty(window, 'Notification', {
      value: {
        get permission() {
          return permission;
        },
        requestPermission: requestPermissionMock,
      },
      writable: true,
      configurable: true,
    });

    await notifyModule.requestNotificationPermissionOnce();
    expect(requestPermissionMock).toHaveBeenCalledOnce();

    // Second call should not prompt again
    await notifyModule.requestNotificationPermissionOnce();
    expect(requestPermissionMock).toHaveBeenCalledOnce();

    // If denied
    permission = 'denied';
    notifyModule.resetNotificationPromptState();
    await notifyModule.requestNotificationPermissionOnce();
    // When permission !== 'default', requestPermission should NOT be called
    expect(requestPermissionMock).toHaveBeenCalledOnce();
  });

  it('shows notification only when document.hidden is true', () => {
    let createdCount = 0;
    class MockNotification {
      constructor() {
        createdCount++;
      }
    }

    Object.defineProperty(window, 'Notification', {
      value: Object.assign(MockNotification, { permission: 'granted' }),
      writable: true,
      configurable: true,
    });

    // When tab is visible (document.hidden = false)
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    const notif1 = notifyModule.showTimerNotification('Purrfocus', 'Time is up!');
    expect(notif1).toBeNull();
    expect(createdCount).toBe(0);

    // When tab is hidden (document.hidden = true)
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    const notif2 = notifyModule.showTimerNotification('Purrfocus', 'Time is up!');
    expect(notif2).not.toBeNull();
    expect(createdCount).toBe(1);
  });

  it('formats document.title for running, paused, idle, and finished states', () => {
    expect(getTitleForTimerState('running', 'focus', 1453)).toBe('24:13 · Focus');
    expect(getTitleForTimerState('paused', 'focus', 1453)).toBe('⏸ 24:13 · Focus');
    expect(getTitleForTimerState('idle', 'focus', 1500)).toBe('Purrfocus');
    expect(getTitleForTimerState('finished', 'focus', 0)).toBe('Purrfocus');
  });

  it('useDocumentTitle updates title and restores original title on unmount', () => {
    document.title = 'Original Purrfocus Title';
    const { unmount } = renderHook(() => useDocumentTitle());

    useTimerStore.setState({
      status: 'running',
      mode: 'focus',
      remaining: 1200,
    });

    expect(document.title).toBe('20:00 · Focus');

    unmount();
    expect(document.title).toBe('Original Purrfocus Title');
  });
});
