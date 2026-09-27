import { useCallback, useRef, useState, type RefObject } from "react";
import { useControlledDefault, useFormDefault, useFormReset } from "./form-reset";

export interface CheckedState<T> {
  checked: T;
  setChecked: (next: T) => void;
}

/**
 * The resolved state of a native checkable input, shared by the checkbox and
 * the switch: it mirrors an externally controlled `checked` without an effect,
 * carries the DOM default a form reset restores, and puts its own state back
 * when its form is reset, silently (ADR 0012).
 */
export function useCheckedState<T>(
  checked: T,
  onCheckedChange: ((checked: T) => void) | undefined,
  controlRef: RefObject<HTMLInputElement | null> | undefined,
  /** Whether a value leaves the native input checked by default. */
  isChecked: (value: T) => boolean,
): CheckedState<T> {
  const [value, setValue] = useState<T>(checked);
  const defaultChecked = useControlledDefault(checked, value, setValue);

  // The control answers for whichever form it is in; with no element to ask,
  // it belongs to none.
  const ownRef = useRef<HTMLInputElement | null>(null);
  const anchor = controlRef ?? ownRef;
  useFormDefault(
    anchor,
    (node: HTMLInputElement) => {
      node.defaultChecked = isChecked(defaultChecked);
    },
    [defaultChecked],
  );
  useFormReset(anchor, () => setValue(defaultChecked));

  const setChecked = useCallback(
    (next: T) => {
      setValue(next);
      onCheckedChange?.(next);
    },
    [onCheckedChange],
  );

  return { checked: value, setChecked };
}
