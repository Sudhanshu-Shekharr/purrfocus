import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { useUiStore } from '@/features/ui/store';
import { ToastProvider } from '@/components/ui/Toast';

const renderHeader = () => {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </ToastProvider>,
  );
};

describe('Header', () => {
  beforeEach(() => {
    useUiStore.setState({
      focusMode: false,
      soundPanelOpen: false,
      mobileMenuOpen: false,
    });
  });

  it('renders brand logo and wordmark unboxed with text-surface', () => {
    renderHeader();
    const logoLink = screen.getByLabelText('Purrfocus home');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).not.toHaveClass('glass');
    expect(logoLink).not.toHaveClass('border-glass-border');
    const wordmark = screen.getByText('purrfocus');
    expect(wordmark).toHaveClass('text-surface');
  });

  it('toggles focusMode when Focus Mode button is clicked', () => {
    renderHeader();
    const focusButton = screen.getByRole('button', { name: /focus mode/i });
    expect(focusButton).toBeInTheDocument();
    expect(useUiStore.getState().focusMode).toBe(false);

    fireEvent.click(focusButton);
    expect(useUiStore.getState().focusMode).toBe(true);
  });

  it('exits focusMode on Escape key press', () => {
    useUiStore.setState({ focusMode: true });
    renderHeader();

    expect(useUiStore.getState().focusMode).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(useUiStore.getState().focusMode).toBe(false);
  });

  it('hides fullscreen button when Fullscreen API is unsupported', () => {
    // In standard JSDOM, document.fullscreenEnabled is undefined/false
    renderHeader();
    const fullscreenButton = screen.queryByLabelText(/enter fullscreen/i);
    expect(fullscreenButton).toBeNull();
  });

  it('groups focus mode, sound, and fullscreen into quick controls cluster with equal spacing and height', () => {
    const origEnabled = document.fullscreenEnabled;
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });

    renderHeader();

    const cluster = screen.getByRole('group', { name: 'Quick controls' });
    expect(cluster).toBeInTheDocument();
    expect(cluster).toHaveClass('flex', 'items-center', 'gap-1.5');

    const focusBtn = screen.getByRole('button', { name: /focus mode/i });
    const soundBtn = screen.getByRole('button', { name: 'Sound and visitor settings' });
    const fullscreenBtn = screen.getByRole('button', { name: 'Enter fullscreen' });

    expect(cluster).toContainElement(focusBtn);
    expect(cluster).toContainElement(soundBtn);
    expect(cluster).toContainElement(fullscreenBtn);

    // Verify DOM order follows visual order left-to-right: Focus mode -> Sound -> Fullscreen
    expect(focusBtn.compareDocumentPosition(soundBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(soundBtn.compareDocumentPosition(fullscreenBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Verify equal heights (h-8)
    expect(focusBtn).toHaveClass('h-8');
    expect(soundBtn).toHaveClass('h-8');
    expect(fullscreenBtn).toHaveClass('h-8');

    Object.defineProperty(document, 'fullscreenEnabled', { value: origEnabled, configurable: true });
  });
});
