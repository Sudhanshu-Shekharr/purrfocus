import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { usePrefsStore } from '@/features/prefs/store';
import { useAmbientStore } from '@/features/audio/ambient/store';

describe('HeaderSoundPopover', () => {
  beforeEach(() => {
    localStorage.clear();
    usePrefsStore.getState().resetPrefs();
    useAmbientStore.getState().resetMix();
    useAmbientStore.setState({ sessionStarted: false, muted: false, master: 0.7 });
  });

  it('renders separate controls for SFX and ambient sound', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const soundTrigger = screen.getByRole('button', { name: 'Sound and visitor settings' });
    await user.click(soundTrigger);

    // Both sections present
    expect(screen.getByText('Sound effects')).toBeInTheDocument();
    expect(screen.getByText('Ambient sound')).toBeInTheDocument();
    expect(screen.getByText('Open the mood card to mix')).toBeInTheDocument();
  });

  it('ambient mute shares state with ambient store without affecting SFX toggle', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const soundTrigger = screen.getByRole('button', { name: 'Sound and visitor settings' });
    await user.click(soundTrigger);

    expect(useAmbientStore.getState().muted).toBe(false);
    expect(usePrefsStore.getState().sfxOn).toBe(true);

    const muteBtn = screen.getByRole('button', { name: 'Mute ambient sound' });
    await user.click(muteBtn);

    // Ambient is muted
    expect(useAmbientStore.getState().muted).toBe(true);
    // SFX toggle is unchanged
    expect(usePrefsStore.getState().sfxOn).toBe(true);

    // Unmute
    const unmuteBtn = screen.getByRole('button', { name: 'Unmute ambient sound' });
    await user.click(unmuteBtn);
    expect(useAmbientStore.getState().muted).toBe(false);
  });

  it('toggling SFX leaves ambient store unchanged', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const soundTrigger = screen.getByRole('button', { name: 'Sound and visitor settings' });
    await user.click(soundTrigger);

    const sfxSwitch = screen.getByRole('switch', { name: 'Toggle sound effects' });
    expect(sfxSwitch).toHaveAttribute('aria-checked', 'true');

    await user.click(sfxSwitch);
    expect(usePrefsStore.getState().sfxOn).toBe(false);
    // Ambient store master and mute unchanged
    expect(useAmbientStore.getState().master).toBe(0.7);
    expect(useAmbientStore.getState().muted).toBe(false);
  });
});
