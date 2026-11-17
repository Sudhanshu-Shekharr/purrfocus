import React from 'react';
import { Check, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Task } from '@/features/intentions/types';
import { cn } from '@/lib/cn';

export interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isActive,
  onToggle,
  onDelete,
  onSetActive,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveUp?.();
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveDown?.();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="group"
      onKeyDown={handleKeyDown}
      aria-label={`Task: ${task.text}${task.done ? ' (completed)' : ''}${isActive ? ' (current session)' : ''}`}
      className={cn(
        'group relative flex items-center justify-between gap-2.5 p-2 rounded-tile glass border transition-all duration-fast',
        isActive
          ? 'border-accent/40 bg-accent/5'
          : 'border-glass-border/60 hover:border-glass-border',
      )}
    >
      {/* 1. Left: Checkbox + Text + Pomodoro Badge */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Animated Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={task.done}
          aria-label={`Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`}
          onClick={() => onToggle(task.id)}
          className={cn(
            'h-4.5 w-4.5 rounded flex items-center justify-center shrink-0 transition-colors border duration-fast',
            task.done
              ? 'bg-accent border-accent text-white'
              : 'border-ink-300 glass hover:border-accent/70',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
          )}
        >
          {task.done && (
            <motion.span
              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.5, opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-3 w-3 stroke-[3]" />
            </motion.span>
          )}
        </button>

        {/* Task Text and Pomodoros */}
        <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'font-sans text-small leading-tight break-words transition-all duration-fast',
              task.done
                ? 'line-through text-ink-500 opacity-60'
                : 'text-ink-900',
            )}
          >
            {task.text}
          </span>

          {/* Pomodoro counter badge */}
          {task.pomodoros > 0 && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-pill glass text-micro font-mono text-ink-600 border border-glass-border shrink-0"
              title={`${task.pomodoros} pomodoro${task.pomodoros === 1 ? '' : 's'} completed`}
              aria-label={`${task.pomodoros} pomodoro${task.pomodoros === 1 ? '' : 's'}`}
            >
              <span aria-hidden="true">🍅</span>
              <span>{task.pomodoros}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Right: Active session badge + Reorder & Delete actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Current session focus toggle button */}
        {!task.done && (
          <button
            type="button"
            onClick={() => onSetActive(task.id)}
            aria-label={
              isActive
                ? `Currently focusing on "${task.text}". Click to deselect.`
                : `Set "${task.text}" as active focus task`
            }
            className={cn(
              'px-2 py-0.5 rounded-pill text-micro font-medium transition-all duration-fast flex items-center gap-1',
              isActive
                ? 'bg-accent/15 text-accent border border-accent/40 shadow-xs'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-ink-500 hover:text-accent hover:bg-glass border border-transparent',
            )}
          >
            {isActive && (
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full bg-accent',
                  !shouldReduceMotion && 'animate-pulse',
                )}
                aria-hidden="true"
              />
            )}
            <span>{isActive ? 'Focusing' : 'Focus'}</span>
          </button>
        )}

        {/* Reorder Buttons (Visible on hover & focus) */}
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center transition-opacity">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label={`Move "${task.text}" up`}
            className={cn(
              'p-1 text-ink-500 hover:text-ink-800 rounded transition-colors disabled:opacity-20 disabled:hover:text-ink-500',
              'focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
            )}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label={`Move "${task.text}" down`}
            className={cn(
              'p-1 text-ink-500 hover:text-ink-800 rounded transition-colors disabled:opacity-20 disabled:hover:text-ink-500',
              'focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent',
            )}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete "${task.text}"`}
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 text-ink-500 hover:text-danger rounded transition-all focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
