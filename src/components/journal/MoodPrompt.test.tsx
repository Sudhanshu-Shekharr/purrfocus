import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MoodPrompt } from './MoodPrompt';
import { useMoodPromptStore } from '@/features/journal/moodPromptStore';
import { useStatsStore } from '@/features/stats/store';

describe('MoodPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMoodPromptStore.setState({
      pendingSession: null,
      deferredSession: null,
    });
    useStatsStore.setState({
      logs: [
        {
          sessionId: 'sess-100',
          date: '2026-11-16',
          completedAt: 1763286400000,
          minutes: 25,
          subject: 'Math',
          source: 'finish',
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when pendingSession is null', () => {
    render(<MoodPrompt />);
    expect(screen.queryByRole('region', { name: /session reflection/i })).not.toBeInTheDocument();
  });

  it('renders reflection card when pendingSession is present', () => {
    useMoodPromptStore.setState({
      pendingSession: { sessionId: 'sess-100', minutes: 25 },
    });

    render(<MoodPrompt />);
    expect(screen.getByRole('region', { name: /session reflection/i })).toBeInTheDocument();
    expect(screen.getByText(/25m focus complete/i)).toBeInTheDocument();
    expect(screen.getByText(/How did that feel\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip reflection/i })).toBeInTheDocument();
  });

  it('allows selecting a mood and saving note', () => {
    const originalMethod = useStatsStore.getState().updateSessionMoodNote;
    const mockUpdate = vi.fn((sessionId: string, mood?: 1 | 2 | 3 | 4 | 5, note?: string) => {
      originalMethod(sessionId, mood, note);
    });
    useStatsStore.setState({ updateSessionMoodNote: mockUpdate });

    useMoodPromptStore.setState({
      pendingSession: { sessionId: 'sess-100', minutes: 25 },
    });

    render(<MoodPrompt />);

    const goodMoodBtn = screen.getByRole('button', { name: /Good \(mood 3\)/i });
    fireEvent.click(goodMoodBtn);
    expect(goodMoodBtn).toHaveAttribute('aria-pressed', 'true');

    const input = screen.getByPlaceholderText(/Add a quiet note/i);
    fireEvent.change(input, { target: { value: 'Great session!' } });
    expect(screen.getByText('14/140')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save reflection/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    expect(mockUpdate).toHaveBeenCalledWith('sess-100', 3, 'Great session!');
    expect(useMoodPromptStore.getState().pendingSession).toBeNull();
  });

  it('dismisses when Skip is clicked without saving mood or note', () => {
    const mockUpdate = vi.fn();
    useStatsStore.setState({ updateSessionMoodNote: mockUpdate });

    useMoodPromptStore.setState({
      pendingSession: { sessionId: 'sess-100', minutes: 25 },
    });

    render(<MoodPrompt />);

    const skipBtn = screen.getByRole('button', { name: /Skip reflection/i });
    fireEvent.click(skipBtn);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(useMoodPromptStore.getState().pendingSession).toBeNull();
  });

  it('dismisses when Escape key is pressed', () => {
    useMoodPromptStore.setState({
      pendingSession: { sessionId: 'sess-100', minutes: 25 },
    });

    render(<MoodPrompt />);
    expect(screen.getByRole('region', { name: /session reflection/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useMoodPromptStore.getState().pendingSession).toBeNull();
  });

  it('auto-dismisses after 30 seconds of inactivity', () => {
    useMoodPromptStore.setState({
      pendingSession: { sessionId: 'sess-100', minutes: 25 },
    });

    render(<MoodPrompt />);
    expect(screen.getByRole('region', { name: /session reflection/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(useMoodPromptStore.getState().pendingSession).toBeNull();
  });

  it('does not auto-dismiss after 30 seconds if user has interacted', () => {
    useMoodPromptStore.setState({
      pendingSession: { sessionId: 'sess-100', minutes: 25 },
    });

    render(<MoodPrompt />);

    const input = screen.getByPlaceholderText(/Add a quiet note/i);
    fireEvent.change(input, { target: { value: 'Still typing...' } });

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Prompt should still be present
    expect(useMoodPromptStore.getState().pendingSession).not.toBeNull();
  });
});
