import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';

// Helper component to trigger toasts
function ToastTrigger({ message = 'Hello!', duration = 500 }: { message?: string; duration?: number }) {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show({ message, duration })}>
      Show toast
    </button>
  );
}

describe('useToast', () => {
  it('shows a toast when show() is called', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Focus complete!" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByText('Focus complete!')).toBeInTheDocument();
  });

  it('auto-dismisses the toast after duration', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Auto-dismiss me" duration={50} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByText('Auto-dismiss me')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('Auto-dismiss me')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('throws when used outside ToastProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<ToastTrigger />),
    ).toThrow('useToast must be used inside <ToastProvider>');
    consoleSpy.mockRestore();
  });
});

