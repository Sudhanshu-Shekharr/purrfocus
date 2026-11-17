import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CatCompanion } from './CatCompanion';
import { useCatStore } from '@/features/cat/store';
import { useCatRuntimeStore, destroyCatController } from '@/features/cat/controller';
import { useTimerStore } from '@/features/timer/store';
import { useStatsStore } from '@/features/stats/store';

describe('CatCompanion Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    destroyCatController();
    useCatRuntimeStore.getState().resetRuntime();
    useCatStore.getState().resetCat();
    useTimerStore.getState().reset();
  });

  afterEach(() => {
    destroyCatController();
    vi.useRealTimers();
  });

  it('renders default cat name, status eyebrow, and initial descriptor', () => {
    render(<CatCompanion />);

    expect(screen.getByText('Mochi')).toBeInTheDocument();
    expect(screen.getByText('READY WHEN YOU ARE')).toBeInTheDocument();
    expect(screen.getByText('a happy little cat')).toBeInTheDocument();
  });

  describe('Inline rename', () => {
    it('renames cat when user clicks rename and presses Enter', () => {
      render(<CatCompanion />);

      const renameBtn = screen.getByRole('button', { name: /Rename Mochi/i });
      fireEvent.click(renameBtn);

      const input = screen.getByLabelText('Cat name');
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'Biscuit' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(useCatStore.getState().name).toBe('Biscuit');
      expect(screen.getByText('Biscuit')).toBeInTheDocument();
    });

    it('cancels rename on Escape key without saving', () => {
      render(<CatCompanion />);

      const renameBtn = screen.getByRole('button', { name: /Rename Mochi/i });
      fireEvent.click(renameBtn);

      const input = screen.getByLabelText('Cat name');
      fireEvent.change(input, { target: { value: 'CancelledName' } });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(useCatStore.getState().name).toBe('Mochi');
      expect(screen.getByText('Mochi')).toBeInTheDocument();
    });
  });

  describe('Sprite and Action Interactions', () => {
    it('clicking the cat sprite triggers pet overlay', () => {
      render(<CatCompanion />);

      const sprite = screen.getByRole('button', { name: /Pet Mochi/i });
      fireEvent.click(sprite);

      expect(useCatRuntimeStore.getState().overlay?.type).toBe('pet_happy');
    });

    it('clicking Pet button triggers pet interaction', () => {
      render(<CatCompanion />);

      const petBtn = screen.getByRole('button', { name: /Pet cat/i });
      fireEvent.click(petBtn);

      expect(useCatRuntimeStore.getState().overlay?.type).toBe('pet_happy');
    });

    it('clicking Play button triggers play interaction', () => {
      render(<CatCompanion />);

      const playBtn = screen.getByRole('button', { name: /Play with yarn ball/i });
      fireEvent.click(playBtn);

      expect(useCatRuntimeStore.getState().overlay?.type).toBe('play');
      expect(useCatRuntimeStore.getState().playActive).toBe(true);
    });

    it('opens More menu and triggers stretch and cycle study pose', async () => {
      render(<CatCompanion />);

      const moreBtn = screen.getByRole('button', { name: /More cat options/i });
      fireEvent.click(moreBtn);

      // Cycle study pose
      const studyPoseItem = screen.getByRole('menuitem', { name: /Study pose: Book/i });
      fireEvent.click(studyPoseItem);
      expect(useCatStore.getState().studyPoseVariant).toBe(1);

      // Stretch together
      const stretchItem = screen.getByRole('menuitem', { name: /Stretch together/i });
      fireEvent.click(stretchItem);
      expect(useCatRuntimeStore.getState().overlay?.type).toBe('stretch');
    });

    it('opens OutfitSheet when Change cat & outfit is clicked', () => {
      render(<CatCompanion />);

      const outfitBtn = screen.getByRole('button', { name: /Change cat & outfit/i });
      fireEvent.click(outfitBtn);

      expect(screen.getByText('Customize Companion')).toBeInTheDocument();
    });

    it('renders shortened single-line Change cat & outfit button without parenthetical', () => {
      render(<CatCompanion />);

      const outfitBtn = screen.getByRole('button', { name: 'Change cat & outfit' });
      expect(outfitBtn).toBeInTheDocument();
      expect(outfitBtn).toHaveTextContent(/^Change cat & outfit$/);
      expect(outfitBtn).toHaveClass('whitespace-nowrap');
      expect(outfitBtn).toHaveClass('px-4');
    });
  });

  describe('Timer Reactions', () => {
    it('updates eyebrow and descriptor when timer starts running focus', () => {
      render(<CatCompanion />);

      act(() => {
        useTimerStore.setState({ status: 'running', mode: 'focus' });
      });

      expect(screen.getByText('STUDYING TOGETHER')).toBeInTheDocument();
      expect(screen.getByText('reading beside you')).toBeInTheDocument();
    });

    it('updates descriptor when timer switches to break', () => {
      render(<CatCompanion />);

      act(() => {
        useTimerStore.setState({ status: 'running', mode: 'shortBreak' });
      });

      expect(screen.getByText('TAKING A BREAK')).toBeInTheDocument();
      expect(screen.getByText('enjoying warm tea')).toBeInTheDocument();
    });
  });

  describe('Streak chip', () => {
    it('does not display streak chip when streak is under 2 days', () => {
      useStatsStore.setState({ logs: [] });
      render(<CatCompanion />);
      expect(screen.queryByTestId('streak-chip')).not.toBeInTheDocument();
    });

    it('displays subtle streak chip when streak is 2 or more days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      useStatsStore.setState({
        logs: [
          { sessionId: '1', date: fmt(yesterday), minutes: 25, completedAt: yesterday.getTime(), subject: null, source: 'finish' },
          { sessionId: '2', date: fmt(today), minutes: 25, completedAt: today.getTime(), subject: null, source: 'finish' },
        ],
      });

      render(<CatCompanion />);
      const chip = screen.getByTestId('streak-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('2 days in a row');
    });
  });

  describe('Chai Selection and Rendering (Chunk 3)', () => {
    it('selecting Chai sets character, displays Warm Calico, and uses Chai asset path', () => {
      render(<CatCompanion />);

      // Initial state: Mochi (Cream Tabby)
      expect(screen.getByText('Mochi')).toBeInTheDocument();
      expect(screen.getByText('Cream Tabby')).toBeInTheDocument();
      const initialImg = screen.getByRole('img', { name: /happy cream cat/i });
      expect(initialImg).toHaveAttribute('src', expect.stringContaining('placeholder/idle_happy.svg'));

      // Open modal and select Chai
      const outfitBtn = screen.getByRole('button', { name: /Change cat & outfit/i });
      fireEvent.click(outfitBtn);

      const chaiBtn = screen.getByRole('button', { name: /Chai/i });
      fireEvent.click(chaiBtn);

      const saveBtn = screen.getByRole('button', { name: /Save changes/i });
      fireEvent.click(saveBtn);

      // Verify store updated
      expect(useCatStore.getState().catId).toBe('chai');
      expect(useCatStore.getState().name).toBe('Chai');

      // Verify companion tile renders Chai's name, breed, and asset path
      expect(screen.getByRole('button', { name: /Rename Chai/i })).toBeInTheDocument();
      expect(screen.getAllByText('Warm Calico').length).toBeGreaterThanOrEqual(1);
      const chaiImg = screen.getByRole('img', { name: /calico cat/i });
      expect(chaiImg).toHaveAttribute('src', expect.stringContaining('chai/idle_happy.svg'));
    });

    it('verifies outfit selection still works when Chai is selected', () => {
      useCatStore.getState().setCatId('chai');
      render(<CatCompanion />);

      const outfitBtn = screen.getByRole('button', { name: /Change cat & outfit/i });
      fireEvent.click(outfitBtn);

      // Select Cozy Knit Scarf
      const scarfBtn = screen.getByRole('button', { name: /Cozy Knit Scarf/i });
      fireEvent.click(scarfBtn);

      const saveBtn = screen.getByRole('button', { name: /Save changes/i });
      fireEvent.click(saveBtn);

      expect(useCatStore.getState().catId).toBe('chai');
      expect(useCatStore.getState().outfitId).toBe('scarf');
    });
  });
});
