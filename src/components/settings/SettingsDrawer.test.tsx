import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsDrawer } from './SettingsDrawer';
import { usePrefsStore } from '@/features/prefs/store';
import { useSceneryStore } from '@/features/scenery/store';
import { useTimerStore } from '@/features/timer/store';
import * as dataPort from '@/lib/dataPort';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('SettingsDrawer', () => {
  beforeEach(() => {
    usePrefsStore.setState({
      sfxOn: true,
      rareEventsOn: true,
      clockFormat: 'auto',
      reduceMotion: 'system',
    });
    useSceneryStore.setState({
      defaultSceneId: 'scene4',
      favoriteSceneIds: ['scene4'],
    });
    useTimerStore.setState({
      durations: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders drawer content when open is true', () => {
    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/Timer Defaults/i)).toBeInTheDocument();
    expect(screen.getByText(/Focus 25m · Short break 5m · Long break 15m/i)).toBeInTheDocument();
    expect(screen.getByText(/Default Scene/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Desktop Notifications/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Privacy Note/i)).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    renderWithRouter(<SettingsDrawer open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('changes default scene via select dropdown', () => {
    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    const select = screen.getByLabelText(/Default Scene/i);
    fireEvent.change(select, { target: { value: 'scene1' } });
    expect(useSceneryStore.getState().defaultSceneId).toBe('scene1');
  });

  it('changes clock format via segmented tabs', () => {
    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    const tab24 = screen.getByRole('tab', { name: '24h' });
    fireEvent.click(tab24);
    expect(usePrefsStore.getState().clockFormat).toBe('24h');
  });

  it('changes reduce motion override via segmented tabs', () => {
    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    const tabOn = screen.getByRole('tab', { name: 'Always on' });
    fireEvent.click(tabOn);
    expect(usePrefsStore.getState().reduceMotion).toBe('on');
  });

  it('toggles sound effects', () => {
    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    const sfxToggle = screen.getByRole('switch', { name: /sound effects/i });
    expect(sfxToggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sfxToggle);
    expect(usePrefsStore.getState().sfxOn).toBe(false);
  });

  it('does not request notification permission on mount, only on toggle click', async () => {
    const requestPermissionMock = vi.fn().mockResolvedValue('granted');
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: requestPermissionMock,
      },
    });

    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    expect(requestPermissionMock).not.toHaveBeenCalled();

    const notifToggle = screen.getByRole('switch', { name: /desktop notifications/i });
    fireEvent.click(notifToggle);

    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(notifToggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('displays blocked message when notification permission is denied', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: {
        permission: 'denied',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      },
    });

    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    expect(
      screen.getByText(/Notifications are blocked by your browser/i),
    ).toBeInTheDocument();
  });

  it('triggers download when Export JSON is clicked', () => {
    const downloadSpy = vi.spyOn(dataPort, 'downloadExportJson').mockImplementation(() => {
      return {} as unknown as dataPort.PurrfocusExportData;
    });

    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    const exportBtn = screen.getByRole('button', { name: /export json backup/i });
    fireEvent.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });

  it('requires typing "reset" in confirmation modal before allowing resetAllData', () => {
    const resetSpy = vi.spyOn(dataPort, 'resetAllData').mockImplementation(() => {});

    renderWithRouter(<SettingsDrawer open={true} onClose={vi.fn()} />);
    const resetBtn = screen.getByRole('button', { name: /reset all data\.\.\./i });
    fireEvent.click(resetBtn);

    const deleteBtn = screen.getByRole('button', { name: /delete everything/i });
    expect(deleteBtn).toBeDisabled();

    const input = screen.getByLabelText(/type reset to confirm/i);
    fireEvent.change(input, { target: { value: 'not-reset' } });
    expect(deleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'reset' } });
    expect(deleteBtn).not.toBeDisabled();

    fireEvent.click(deleteBtn);
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
