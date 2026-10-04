import { useCallback, useState } from "react";

/**
 * A controllable mirror (ADR 0011): the prop seeds the state, a changed prop
 * is reflected into it while rendering, with no effect and no report, and the
 * setter writes first, then reports, only when the value really moves.
 *
 * `equal` compares by content where identity is not enough: a page that
 * writes a fresh array with the same entries on every render changes nothing,
 * and an echo of the reported value is a give-back.
 */
export function useControllable<T>(
  prop: T,
  onChange: ((value: T) => void) | undefined,
  equal: (a: T, b: T) => boolean = Object.is,
): [T, (next: T) => void] {
  const [value, setValue] = useState(prop);
  const [lastProp, setLastProp] = useState(prop);
  if (!equal(prop, lastProp)) {
    setLastProp(prop);
    setValue(prop);
  }
  const set = useCallback(
    (next: T) => {
      if (equal(value, next)) return;
      setValue(next);
      onChange?.(next);
    },
    [value, onChange, equal],
  );
  return [value, set];
}

/** The same entries in the same order. */
export const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a === b || (a.length === b.length && a.every((entry, index) => entry === b[index]));

/** The same entries, whatever order each side keeps them in. */
export const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a === b || (a.length === b.length && a.every((entry) => b.includes(entry)));
