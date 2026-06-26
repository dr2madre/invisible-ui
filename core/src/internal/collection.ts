/** Shared navigation helpers for single-select collections (radio group, tabs). */

export interface CollectionItem {
  value: string;
  disabled?: boolean;
}

const isEnabled = (item: CollectionItem) => !item.disabled;

/** First enabled item value, or `null` when none. */
export function firstEnabled(items: CollectionItem[]): string | null {
  return items.find(isEnabled)?.value ?? null;
}

/** Last enabled item value, or `null` when none. */
export function lastEnabled(items: CollectionItem[]): string | null {
  return [...items].reverse().find(isEnabled)?.value ?? null;
}

/**
 * Step `delta` (+1/-1) from `value`, wrapping around and skipping disabled
 * items. Returns the next enabled value, or `null` when there are none.
 */
export function step(items: CollectionItem[], value: string | null, delta: 1 | -1): string | null {
  const count = items.length;
  if (count === 0) return null;

  const start = items.findIndex((item) => item.value === value);
  // When nothing is active, begin just before/after the ends.
  const from = start === -1 ? (delta === 1 ? -1 : 0) : start;

  for (let i = 1; i <= count; i++) {
    const index = (from + delta * i + count * i) % count;
    const item = items[index];
    if (item && isEnabled(item)) return item.value;
  }
  return null;
}

export const nextEnabled = (items: CollectionItem[], value: string | null) => step(items, value, 1);

export const prevEnabled = (items: CollectionItem[], value: string | null) =>
  step(items, value, -1);
