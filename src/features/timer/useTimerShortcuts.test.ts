import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimerShortcuts } from './useTimerShortcuts';
import { useTimerStore } from './store';
import { getInitialTimerState, DEFAULT_DURATIONS } from './constants';

describe('useTimerShortcuts', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimerStore.setState(getInitialTimerState('2026-10-28'));
  });

  it('Space key starts, pauses, and resumes timer', () => {
    renderHook(() => useTimerShortcuts());

    // 1. Idle -> Start
    const spaceEvt1 = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(spaceEvt1);
    expect(useTimerStore.getState().status).toBe('running');
    expect(spaceEvt1.defaultPrevented).toBe(true);

    // 2. Running -> Pause
    const spaceEvt2 = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(spaceEvt2);
    expect(useTimerStore.getState().status).toBe('paused');

    // 3. Paused -> Resume
    const spaceEvt3 = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(spaceEvt3);
    expect(useTimerStore.getState().status).toBe('running');
  });

  it('R key resets timer', () => {
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'paused',
      remaining: 500,
    });

    renderHook(() => useTimerShortcuts());

    const rEvt = new KeyboardEvent('keydown', { key: 'r', cancelable: true });
    window.dispatchEvent(rEvt);

    expect(useTimerStore.getState().status).toBe('idle');
    expect(useTimerStore.getState().remaining).toBe(DEFAULT_DURATIONS.focus);
    expect(rEvt.defaultPrevented).toBe(true);
  });

  it('1 / 2 / 3 switches mode from idle without confirmation', () => {
    const onConfirm = vi.fn();
    renderHook(() => useTimerShortcuts({ onRequestSwitchConfirm: onConfirm }));

    // Press '2' -> shortBreak
    const key2 = new KeyboardEvent('keydown', { key: '2', cancelable: true });
    window.dispatchEvent(key2);
    expect(useTimerStore.getState().mode).toBe('shortBreak');
    expect(onConfirm).not.toHaveBeenCalled();

    // Press '3' -> longBreak
    const key3 = new KeyboardEvent('keydown', { key: '3', cancelable: true });
    window.dispatchEvent(key3);
    expect(useTimerStore.getState().mode).toBe('longBreak');
    expect(onConfirm).not.toHaveBeenCalled();

    // Press '1' -> focus
    const key1 = new KeyboardEvent('keydown', { key: '1', cancelable: true });
    window.dispatchEvent(key1);
    expect(useTimerStore.getState().mode).toBe('focus');
  });

  it('1 / 2 / 3 while running triggers confirmation callback', () => {
    const onConfirm = vi.fn();
    useTimerStore.setState({
      ...getInitialTimerState('2026-10-28'),
      status: 'running',
      mode: 'focus',
      endsAt: Date.now() + 100000,
    });

    renderHook(() => useTimerShortcuts({ onRequestSwitchConfirm: onConfirm }));

    const key2 = new KeyboardEvent('keydown', { key: '2', cancelable: true });
    window.dispatchEvent(key2);

    expect(onConfirm).toHaveBeenCalledWith('shortBreak');
    expect(useTimerStore.getState().mode).toBe('focus'); // Not changed yet
  });

  it('ignores Space when focus is on a button (avoids double activation)', () => {
    renderHook(() => useTimerShortcuts());

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const spaceEvt = new KeyboardEvent('keydown', {
      key: ' ',
      cancelable: true,
      bubbles: true,
    });
    button.dispatchEvent(spaceEvt);

    expect(useTimerStore.getState().status).toBe('idle'); // Untouched!
    expect(spaceEvt.defaultPrevented).toBe(false);

    document.body.removeChild(button);
  });

  it('ignores all shortcuts when focus is inside text input, textarea or contenteditable', () => {
    renderHook(() => useTimerShortcuts());

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Press Space inside input
    const spaceEvt = new KeyboardEvent('keydown', {
      key: ' ',
      cancelable: true,
      bubbles: true,
    });
    input.dispatchEvent(spaceEvt);
    expect(useTimerStore.getState().status).toBe('idle');

    // Press 'r' inside input
    const rEvt = new KeyboardEvent('keydown', {
      key: 'r',
      cancelable: true,
      bubbles: true,
    });
    input.dispatchEvent(rEvt);
    expect(useTimerStore.getState().status).toBe('idle');

    document.body.removeChild(input);
  });

  it('ignores shortcuts when modifier keys are pressed', () => {
    renderHook(() => useTimerShortcuts());

    const spaceWithCtrl = new KeyboardEvent('keydown', {
      key: ' ',
      ctrlKey: true,
      cancelable: true,
    });
    window.dispatchEvent(spaceWithCtrl);
    expect(useTimerStore.getState().status).toBe('idle');
    expect(spaceWithCtrl.defaultPrevented).toBe(false);

    const rWithAlt = new KeyboardEvent('keydown', {
      key: 'r',
      altKey: true,
      cancelable: true,
    });
    window.dispatchEvent(rWithAlt);
    expect(rWithAlt.defaultPrevented).toBe(false);
  });

  it('ignores shortcuts when focus is inside an open dialog or menu modal', () => {
    renderHook(() => useTimerShortcuts());

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const child = document.createElement('span');
    dialog.appendChild(child);
    document.body.appendChild(dialog);

    const spaceInsideDialog = new KeyboardEvent('keydown', {
      key: ' ',
      cancelable: true,
      bubbles: true,
    });
    child.dispatchEvent(spaceInsideDialog);

    expect(useTimerStore.getState().status).toBe('idle');
    expect(spaceInsideDialog.defaultPrevented).toBe(false);

    document.body.removeChild(dialog);
  });
});
