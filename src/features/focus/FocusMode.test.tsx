import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '@/components/header/Header';
import { HomePage } from '@/pages/Home';
import { usePrefsStore } from '@/features/prefs/store';
import { ToastProvider } from '@/components/ui/Toast';

const renderHeader = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <Header />
      </ToastProvider>
    </BrowserRouter>,
  );
};

const renderHome = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <HomePage />
      </ToastProvider>
    </BrowserRouter>,
  );
};

describe('Focus Mode Integration', () => {
  beforeEach(() => {
    usePrefsStore.setState({
      focusMode: false,
      sfxOn: true,
      rareEventsOn: true,
    });
  });

  it('renders Focus Mode button in header with correct aria-pressed state', () => {
    renderHeader();
    const btn = screen.getByRole('button', { name: /focus mode/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn);
    expect(usePrefsStore.getState().focusMode).toBe(true);
    expect(screen.getByRole('button', { name: /exit focus/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles Focus Mode with "f" key shortcut', () => {
    renderHeader();
    expect(usePrefsStore.getState().focusMode).toBe(false);

    // Press 'f' on window
    fireEvent.keyDown(window, { key: 'f' });
    expect(usePrefsStore.getState().focusMode).toBe(true);

    // Press 'f' again to exit
    fireEvent.keyDown(window, { key: 'f' });
    expect(usePrefsStore.getState().focusMode).toBe(false);
  });

  it('ignores "f" key shortcut when typing inside input or textarea', () => {
    renderHeader();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 'f' });
    expect(usePrefsStore.getState().focusMode).toBe(false);

    document.body.removeChild(input);
  });

  it('exits Focus Mode on Escape key when no dialog is open', () => {
    usePrefsStore.setState({ focusMode: true });
    renderHeader();

    expect(usePrefsStore.getState().focusMode).toBe(true);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(usePrefsStore.getState().focusMode).toBe(false);
  });

  it('does NOT exit Focus Mode on Escape key when a modal/dialog is open', () => {
    usePrefsStore.setState({ focusMode: true });
    renderHeader();

    // Create a mock modal dialog element in DOM
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);

    fireEvent.keyDown(window, { key: 'Escape' });
    // Since dialog was open, Focus Mode remains active!
    expect(usePrefsStore.getState().focusMode).toBe(true);

    document.body.removeChild(dialog);
  });

  it('announces Focus Mode changes to polite live region', () => {
    renderHeader();

    // Live region starts empty on initial mount
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');

    // Toggle on
    fireEvent.keyDown(window, { key: 'f' });
    expect(liveRegion).toHaveTextContent('Focus mode on');

    // Toggle off
    fireEvent.keyDown(window, { key: 'f' });
    expect(liveRegion).toHaveTextContent('Focus mode off');
  });

  it('applies inert attribute to hidden cards section on Home page during focus mode', () => {
    const { rerender } = renderHome();

    const cardsSection = screen.getByLabelText(/study room controls and atmosphere/i);
    expect(cardsSection).not.toHaveAttribute('inert');

    // Activate focus mode
    usePrefsStore.setState({ focusMode: true });
    rerender(
      <BrowserRouter>
        <ToastProvider>
          <HomePage />
        </ToastProvider>
      </BrowserRouter>,
    );

    expect(cardsSection).toHaveAttribute('inert');
  });
});
