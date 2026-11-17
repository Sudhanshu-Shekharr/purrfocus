export type ClassValue =
  | ClassValue[]
  | Record<string, boolean | null | undefined>
  | string
  | number
  | null
  | boolean
  | undefined;

/**
 * Lightweight, zero-dependency className merging helper (clsx style).
 * Combines strings, conditional classes, objects, and nested arrays.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  function process(item: ClassValue): void {
    if (!item) return;

    if (typeof item === 'string' || typeof item === 'number') {
      classes.push(String(item));
    } else if (Array.isArray(item)) {
      for (const element of item) {
        process(element);
      }
    } else if (typeof item === 'object') {
      for (const [key, val] of Object.entries(item)) {
        if (val) {
          classes.push(key);
        }
      }
    }
  }

  for (const input of inputs) {
    process(input);
  }

  return classes.join(' ');
}
