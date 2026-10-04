import { useRef, type RefObject } from "react";
import { useFormDefault, useResettable } from "./form-reset";

export interface CheckedState<T> {
  checked: T;
  setChecked: (next: T) => void;
}

/**
 * The resolved state of a native checkable input, shared by the checkbox, the
 * switch and the toggle button: it mirrors an externally controlled `checked`
 * without an effect, carries the DOM default a form reset restores, and puts
 * its own state back when its form is reset, silently (ADR 0012).
 */
export function useCheckedState<T>(
  checked: T,
  onCheckedChange: ((checked: T) => void) | undefined,
  controlRef: RefObject<HTMLInputElement | null> | undefined,
  /** Whether a value leaves the native input checked by default. */
  isChecked: (value: T) => boolean,
): CheckedState<T> {
  // The control answers for whichever form it is in; with no element to ask,
  // it belongs to none.
  const ownRef = useRef<HTMLInputElement | null>(null);
  const anchor = controlRef ?? ownRef;
  const [value, setChecked, defaultChecked] = useResettable(checked, onCheckedChange, anchor);
  useFormDefault(
    anchor,
    (node: HTMLInputElement) => {
      node.defaultChecked = isChecked(defaultChecked);
    },
    [defaultChecked],
  );

  return { checked: value, setChecked };
}
