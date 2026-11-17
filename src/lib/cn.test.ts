import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('combines simple class names', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
  });

  it('filters out falsy values like false, null, undefined, 0, and empty string', () => {
    expect(cn('btn', false, null, undefined, '', 'btn-primary')).toBe('btn btn-primary');
  });

  it('handles conditional expressions properly', () => {
    const isPrimary = true;
    const isLarge = false;
    expect(cn('btn', isPrimary && 'btn-primary', isLarge && 'btn-lg')).toBe('btn btn-primary');
  });

  it('handles object maps with boolean values', () => {
    expect(
      cn('btn', {
        'btn-active': true,
        'btn-disabled': false,
        'btn-rounded': true,
      })
    ).toBe('btn btn-active btn-rounded');
  });

  it('handles nested arrays recursively', () => {
    expect(cn('a', ['b', ['c', { d: true, e: false }]])).toBe('a b c d');
  });

  it('returns an empty string when no valid arguments are provided', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });
});
