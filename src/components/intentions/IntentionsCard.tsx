import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Target, Sparkles, CheckCheck } from 'lucide-react';
import { GlassCard, Eyebrow } from '@/components/ui';
import { useIntentionsStore } from '@/features/intentions/store';
import { getEmptyIntentionHints } from '@/data/dialogue';
import { TaskItem } from './TaskItem';

export interface IntentionsCardProps {
  className?: string;
}

export const IntentionsCard: React.FC<IntentionsCardProps> = ({ className = '' }) => {
  const tasks = useIntentionsStore(state => state.tasks);
  const activeTaskId = useIntentionsStore(state => state.activeTaskId);
  const subject = useIntentionsStore(state => state.subject);

  const addTask = useIntentionsStore(state => state.addTask);
  const toggleTask = useIntentionsStore(state => state.toggleTask);
  const deleteTask = useIntentionsStore(state => state.deleteTask);
  const setActiveTask = useIntentionsStore(state => state.setActiveTask);
  const setSubject = useIntentionsStore(state => state.setSubject);
  const reorderTasks = useIntentionsStore(state => state.reorderTasks);
  const clearCompletedTasks = useIntentionsStore(state => state.clearCompletedTasks);

  const [newTaskText, setNewText] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Rotating hints for empty state (every 20s)
  const hints = getEmptyIntentionHints();
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    if (tasks.length > 0 || hints.length <= 1) return;

    const timer = setInterval(() => {
      setHintIndex(prev => (prev + 1) % hints.length);
    }, 20000);

    return () => clearInterval(timer);
  }, [tasks.length, hints.length]);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddError(null);

    const trimmed = newTaskText.trim();
    if (!trimmed) {
      setAddError('Please enter a task.');
      return;
    }

    const created = addTask(trimmed);
    if (!created) {
      setAddError('Could not add task. Limit reached.');
      return;
    }

    setNewText('');
  };

  const handleUseHint = (hintText: string) => {
    addTask(hintText);
    setNewText('');
    setAddError(null);
  };

  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <GlassCard padding="md" className={`h-full flex flex-col justify-between ${className}`}>
      <div className="space-y-4">
        {/* 1. Header with Eyebrow, Title, and Count Pill */}
        <div>
          <Eyebrow className="text-ink-500 mb-1">LITTLE INTENTIONS</Eyebrow>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-pill glass text-accent" aria-hidden="true">
                <CheckSquare className="h-4 w-4" />
              </span>
              <h2 className="font-serif text-lg font-medium text-ink-900 tracking-tight">
                Intentions
              </h2>
            </div>

            <span
              className="glass px-2.5 py-0.5 rounded-pill font-mono text-micro font-medium text-ink-700 border border-glass-border shadow-xs"
              aria-label={`${doneCount} of ${totalCount} tasks completed`}
            >
              {doneCount} / {totalCount}
            </span>
          </div>

          <p className="font-sans text-small text-ink-500">
            What&apos;s on your mind for this study session?
          </p>
        </div>

        {/* 2. Session Subject Input */}
        <div className="space-y-1">
          <label
            htmlFor="session-subject-input"
            className="font-sans text-micro font-medium text-ink-700 flex items-center justify-between"
          >
            <span>What is this session about?</span>
            <span className="text-ink-500 font-mono text-micro" aria-hidden="true">{subject.length}/60</span>
          </label>
          <input
            id="session-subject-input"
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={60}
            placeholder="e.g. Chapter 4 reading, Essay draft..."
            className="w-full h-11 px-3 rounded-tile glass border border-glass-border/70 text-small text-ink-900 placeholder:text-ink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
          />
        </div>

        {/* 3. Add Task Input Form */}
        <form onSubmit={handleAddTask} className="space-y-1">
          <div className="relative flex items-center">
            <input
              type="text"
              value={newTaskText}
              onChange={e => {
                setNewText(e.target.value);
                if (addError) setAddError(null);
              }}
              maxLength={120}
              placeholder="Add a small intention... (Enter)"
              aria-label="Add a task"
              className="w-full h-11 pl-3 pr-12 rounded-tile glass border border-glass-border/70 text-small text-ink-900 placeholder:text-ink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent transition-colors"
            />
            <button
              type="submit"
              aria-label="Add intention"
              className="absolute right-1 min-w-[44px] min-h-[44px] p-2 rounded-pill text-accent hover:bg-glass transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent flex items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {addError && <p className="text-micro text-danger pl-1">{addError}</p>}
        </form>

        {/* 4. Tasks List or Rotating Empty State */}
        <div className="pt-1">
          {tasks.length === 0 ? (
            <div className="glass rounded-tile p-4 border border-glass-border/60 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-accent text-micro font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Small step suggestion</span>
              </div>
              <button
                type="button"
                onClick={() => handleUseHint(hints[hintIndex] ?? '')}
                className="font-serif italic text-small text-ink-800 hover:text-accent transition-colors block mx-auto text-center"
                title="Click to add this suggestion"
                aria-label={`Suggestion: ${hints[hintIndex]}. Click to add.`}
              >
                &ldquo;{hints[hintIndex]}&rdquo;
              </button>
              <p className="text-micro text-ink-500">
                Click suggestion or type your own intention above
              </p>
            </div>
          ) : (
            <div
              role="region"
              aria-label="Tasks list"
              className="max-h-48 overflow-y-auto pr-1 space-y-1.5 focus-visible:outline-none scrollbar-thin"
            >
              {tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isActive={task.id === activeTaskId}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onSetActive={setActiveTask}
                  onMoveUp={() => reorderTasks(index, index - 1)}
                  onMoveDown={() => reorderTasks(index, index + 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < tasks.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Footer: Current Focus Task or Session Attribution */}
      <div className="pt-4 mt-4 border-t border-glass-border/40 flex items-center justify-between text-micro text-ink-500 font-sans">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target className="h-3.5 w-3.5 text-accent shrink-0" />
          {activeTask ? (
            <span className="truncate text-ink-700">
              Focusing: <span className="font-medium text-ink-900">&ldquo;{activeTask.text}&rdquo;</span>
            </span>
          ) : (
            <span>Click &apos;Focus&apos; on a task to attribute pomodoros</span>
          )}
        </div>

        {doneCount > 0 && (
          <button
            type="button"
            onClick={clearCompletedTasks}
            className="text-ink-500 hover:text-ink-900 transition-colors flex items-center gap-1 shrink-0 ml-2 font-medium"
            aria-label="Clear completed intentions"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Clear done</span>
          </button>
        )}
      </div>
    </GlassCard>
  );
};

export default IntentionsCard;
