import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check } from 'lucide-react';
import { useCatStore } from '@/features/cat/store';
import { MAX_CAT_NAME_LENGTH } from '@/features/cat/constants';

export type CatNameEditorProps = {
  className?: string;
};

export const CatNameEditor: React.FC<CatNameEditorProps> = ({ className = '' }) => {
  const name = useCatStore(s => s.name);
  const setName = useCatStore(s => s.setName);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraftName(name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, name]);

  const handleSave = (): void => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      setName(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraftName(name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        className={`inline-flex items-center gap-1.5 ${className}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={draftName}
          maxLength={MAX_CAT_NAME_LENGTH}
          onChange={e => setDraftName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          aria-label="Cat name"
          className="font-serif text-2xl font-medium text-ink-900 bg-white/70 backdrop-blur-sm border border-glass-border px-2 py-0.5 rounded-sm text-center max-w-[180px] shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          aria-label="Save name"
          className="p-1 rounded-sm text-ink-700 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Check className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <h2 className={`font-serif text-2xl font-medium text-ink-900 tracking-tight ${className}`}>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="group inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1 transition-colors"
        aria-label={`Rename ${name}`}
        title="Click to rename"
      >
        <span>{name}</span>
        <Pencil className="h-3.5 w-3.5 text-ink-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" aria-hidden="true" />
      </button>
    </h2>
  );
};
