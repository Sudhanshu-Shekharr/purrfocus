import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OwnMusicSheet } from './OwnMusicSheet';
import { ambientEngine } from '@/features/audio/ambient/engine';
import { useAmbientStore } from '@/features/audio/ambient/store';

describe('OwnMusicSheet', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    useAmbientStore.setState({
      levels: { 'soft-piano': 0, rainfall: 0, 'brown-noise': 0 },
      master: 0.8,
      muted: false,
      sessionStarted: false,
    });
    localStorage.clear();

    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    ambientEngine.unregisterSource('custom-file');
  });

  it('renders modal sheet when open is true', () => {
    render(<OwnMusicSheet open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /your own music/i })).toBeInTheDocument();
    expect(screen.getByText('Choose an audio file')).toBeInTheDocument();
  });

  it('rejects files larger than 50MB with an error message', async () => {
    render(<OwnMusicSheet open={true} onClose={vi.fn()} />);

    const input = screen.getByTestId('audio-file-input');
    const largeFile = new File([''], 'huge.mp3', { type: 'audio/mp3' });
    Object.defineProperty(largeFile, 'size', { value: 55 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/exceeds 50mb limit/i);
    expect(ambientEngine.getSource('custom-file')).toBeUndefined();
  });

  it('uploads valid audio file and registers on ambient engine and store', async () => {
    render(<OwnMusicSheet open={true} onClose={vi.fn()} />);

    const input = screen.getByTestId('audio-file-input');
    const validFile = new File(['mock content'], 'chill_lofi.mp3', { type: 'audio/mp3' });
    Object.defineProperty(validFile, 'size', { value: 4 * 1024 * 1024 }); // 4MB

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText('chill_lofi.mp3')).toBeInTheDocument();
    });

    // Check source registration
    const source = ambientEngine.getSource('custom-file');
    expect(source).toBeDefined();
    expect(useAmbientStore.getState().levels['custom-file']).toBe(0.8);
    expect(screen.getByRole('slider', { name: /custom audio volume/i })).toBeInTheDocument();
  });

  it('allows removing the uploaded audio file', async () => {
    render(<OwnMusicSheet open={true} onClose={vi.fn()} />);

    const input = screen.getByTestId('audio-file-input');
    const file = new File(['mock'], 'soundtrack.mp3', { type: 'audio/mp3' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('soundtrack.mp3')).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', { name: /remove audio file/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('soundtrack.mp3')).not.toBeInTheDocument();
    expect(ambientEngine.getSource('custom-file')).toBeUndefined();
    expect(useAmbientStore.getState().levels['custom-file']).toBe(0);
  });

  it('switches to embed tab and renders sandboxed iframe on valid YouTube URL', async () => {
    render(<OwnMusicSheet open={true} onClose={vi.fn()} />);

    // Click Web player tab
    const embedTab = screen.getByRole('tab', { name: /web player/i });
    fireEvent.click(embedTab);

    const input = screen.getByPlaceholderText(/youtube\.com/i);
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });

    const loadBtn = screen.getByRole('button', { name: /load/i });
    fireEvent.click(loadBtn);

    const iframe = (await screen.findByTitle('YouTube Player')) as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
    expect(iframe.getAttribute('allow')).toContain('autoplay');

    // Removing embed
    const removeEmbedBtn = screen.getByRole('button', { name: /remove player/i });
    fireEvent.click(removeEmbedBtn);
    expect(screen.queryByTitle('YouTube Player')).not.toBeInTheDocument();
  });

  it('displays error for invalid embed link in web player tab', async () => {
    render(<OwnMusicSheet open={true} onClose={vi.fn()} />);

    const embedTab = screen.getByRole('tab', { name: /web player/i });
    fireEvent.click(embedTab);

    const input = screen.getByPlaceholderText(/youtube\.com/i);
    fireEvent.change(input, { target: { value: 'https://vimeo.com/12345' } });

    const loadBtn = screen.getByRole('button', { name: /load/i });
    fireEvent.click(loadBtn);

    expect(screen.getByText(/only youtube, spotify, and soundcloud links/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<OwnMusicSheet open={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
