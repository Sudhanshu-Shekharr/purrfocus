import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { IntentionsCard } from './IntentionsCard';
import { useIntentionsStore } from '@/features/intentions/store';
import { _clearIntentionListenersForTest } from '@/features/intentions/events';

describe('IntentionsCard', () => {
  beforeEach(() => {
    _clearIntentionListenersForTest();
    useIntentionsStore.setState({
      tasks: [],
      activeTaskId: null,
      subject: '',
    });
  });

  it('renders header, count pill, subject input and rotating suggestions empty state', () => {
    render(<IntentionsCard />);

    expect(screen.getByText('LITTLE INTENTIONS')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /intentions/i })).toBeInTheDocument();
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    expect(screen.getByLabelText(/what is this session about\?/i)).toBeInTheDocument();
    expect(screen.getByText(/small step suggestion/i)).toBeInTheDocument();
  });

  it('adds a new intention task via text input and updates count pill', () => {
    render(<IntentionsCard />);

    const input = screen.getByLabelText('Add a task');
    fireEvent.change(input, { target: { value: 'Read chapter 3' } });

    const addBtn = screen.getByRole('button', { name: /add intention/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Read chapter 3')).toBeInTheDocument();
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('shows error if attempting to add empty task', () => {
    render(<IntentionsCard />);

    const addBtn = screen.getByRole('button', { name: /add intention/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/please enter a task/i)).toBeInTheDocument();
  });

  it('clicking a suggestion hint adds it directly to tasks', () => {
    render(<IntentionsCard />);

    const suggestionBtn = screen.getByRole('button', { name: /suggestion: .* click to add\./i });
    fireEvent.click(suggestionBtn);

    expect(useIntentionsStore.getState().tasks).toHaveLength(1);
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
  });

  it('toggles task done status with checkbox and updates count pill', () => {
    useIntentionsStore.getState().addTask('Write thesis outline');
    render(<IntentionsCard />);

    expect(screen.getByText('0 / 1')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /mark "write thesis outline" as complete/i });
    fireEvent.click(checkbox);

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(useIntentionsStore.getState().tasks[0]?.done).toBe(true);
  });

  it('sets a task as the current session focus task', () => {
    useIntentionsStore.getState().addTask('Solve math problems');
    render(<IntentionsCard />);

    const focusBtn = screen.getByRole('button', { name: /set "solve math problems" as active focus task/i });
    fireEvent.click(focusBtn);

    expect(screen.getByText('Focusing')).toBeInTheDocument();
    expect(useIntentionsStore.getState().activeTaskId).toBe(useIntentionsStore.getState().tasks[0]?.id);
    expect(screen.getByText(/“Solve math problems”/)).toBeInTheDocument();
  });

  it('allows moving tasks up and down with reorder buttons and keyboard Alt+Arrow', () => {
    const t1 = useIntentionsStore.getState().addTask('Task 1')!;
    const t2 = useIntentionsStore.getState().addTask('Task 2')!;
    render(<IntentionsCard />);

    // Move task 2 up via button
    const moveUpBtn = screen.getByRole('button', { name: /move "task 2" up/i });
    fireEvent.click(moveUpBtn);

    expect(useIntentionsStore.getState().tasks[0]?.id).toBe(t2.id);
    expect(useIntentionsStore.getState().tasks[1]?.id).toBe(t1.id);

    // Move task 2 down via Alt+ArrowDown keyboard shortcut
    const taskContainer = screen.getByLabelText(/task: task 2/i);
    fireEvent.keyDown(taskContainer, { key: 'ArrowDown', altKey: true });

    expect(useIntentionsStore.getState().tasks[0]?.id).toBe(t1.id);
    expect(useIntentionsStore.getState().tasks[1]?.id).toBe(t2.id);
  });

  it('deletes a task with the delete button', () => {
    useIntentionsStore.getState().addTask('Temporary note');
    render(<IntentionsCard />);

    const deleteBtn = screen.getByRole('button', { name: /delete "temporary note"/i });
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('Temporary note')).not.toBeInTheDocument();
    expect(useIntentionsStore.getState().tasks).toHaveLength(0);
  });

  it('updates session subject in store when typing in subject input', () => {
    render(<IntentionsCard />);

    const input = screen.getByLabelText(/what is this session about\?/i);
    fireEvent.change(input, { target: { value: 'Organic Chemistry Prep' } });

    expect(useIntentionsStore.getState().subject).toBe('Organic Chemistry Prep');
  });

  it('allows clearing completed tasks', () => {
    const t1 = useIntentionsStore.getState().addTask('Done task')!;
    useIntentionsStore.getState().addTask('Pending task');
    useIntentionsStore.getState().toggleTask(t1.id);

    render(<IntentionsCard />);

    const clearBtn = screen.getByRole('button', { name: /clear completed intentions/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText('Done task')).not.toBeInTheDocument();
    expect(screen.getByText('Pending task')).toBeInTheDocument();
    expect(useIntentionsStore.getState().tasks).toHaveLength(1);
  });
});
