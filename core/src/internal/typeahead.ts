/** How long typed characters build one typeahead query, in milliseconds. */
export const TYPEAHEAD_RESET = 500;

/** A typeahead entry: its value and the text the query is matched against. */
export interface TypeaheadEntry {
  value: string;
  label: string;
}

/**
 * The value of the next entry whose label starts with `query`
 * (case-insensitive), searching after `fromValue` and wrapping, or `null`.
 * Pass only the entries that can take focus.
 */
export function matchNext(
  entries: TypeaheadEntry[],
  query: string,
  fromValue: string | null,
): string | null {
  if (!query || entries.length === 0) return null;
  const q = query.toLowerCase();
  const start = entries.findIndex((entry) => entry.value === fromValue);
  for (let i = 1; i <= entries.length; i++) {
    const entry = entries[(start + i + entries.length) % entries.length]!;
    if (entry.label.toLowerCase().startsWith(q)) return entry.value;
  }
  return null;
}

/**
 * The character a key press types, for typeahead: one printable, non-space
 * character pressed with no Control, Meta or Alt, or `null`.
 */
export function typedCharacter(event: KeyboardEvent): string | null {
  const { key } = event;
  if (key.length !== 1 || key.trim() === "") return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  return key;
}

/** A typeahead query that typed characters extend until a pause clears it. */
export interface Typeahead {
  /** Add a character and return the query so far. */
  push(character: string): string;
  /** Clear the query. */
  reset(): void;
}

/**
 * Create a typeahead query: characters typed within `resetAfter`
 * milliseconds of each other build one query, so a sequence such as "ba"
 * matches "Banana" after "Apple".
 */
export function createTypeahead(resetAfter = TYPEAHEAD_RESET): Typeahead {
  let query = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reset = () => {
    clearTimeout(timer);
    query = "";
  };
  return {
    push(character) {
      clearTimeout(timer);
      query += character;
      timer = setTimeout(reset, resetAfter);
      return query;
    },
    reset,
  };
}
