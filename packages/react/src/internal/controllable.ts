import { useCallback, useState } from "react";

/**
 * A controllable mirror (ADR 0011): the prop seeds the state, a changed prop
 * is reflected into it while rendering, with no effect and no report, and the
 * setter writes first, then reports, only when the value really moves.
 */
export function useControllable<T>(
  prop: T,
  onChange: ((value: T) => void) | undefined,
): [T, (next: T) => void] {
  const [value, setValue] = useState(prop);
  const [lastProp, setLastProp] = useState(prop);
  if (prop !== lastProp) {
    setLastProp(prop);
    setValue(prop);
  }
  const set = useCallback(
    (next: T) => {
      if (Object.is(value, next)) return;
      setValue(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [value, set];
}
