import { checkbox as core } from "@design-system/core";
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { useFormDefault, useFormReset } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export type CheckedState = core.CheckedState;

export interface UseCheckboxOptions {
  /** Initial (uncontrolled) or current (controlled) checked value. */
  checked?: CheckedState;
  disabled?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: CheckedState) => void;
  /**
   * The native input this state renders on. Given it, the control carries the
   * DOM default a form reset restores, and puts its own state back when its
   * form is reset, silently (ADR 0012). Without it nothing changes: a reset
   * reaches no control that cannot say which form it belongs to.
   */
  controlRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Connect the headless Checkbox to React.
 *
 * The hook owns the resolved state (`useState`) and hands the core a setter;
 * `connect()` is recomputed per render via `useMemo`, so the handlers in the
 * returned prop bag always close over current state. That is the whole reason
 * the React seam needs no listener bookkeeping, unlike the Svelte adapter's
 * `createPropsAction`.
 *
 * `checked` is treated as *controlled* when it changes between renders: the
 * component mirrors the prop, matching the Svelte adapter's reactive `$:` sync.
 */
export function useCheckbox({
  checked = false,
  disabled = false,
  onCheckedChange,
  controlRef,
}: UseCheckboxOptions = {}): core.CheckboxApi {
  const [value, setValue] = useState<CheckedState>(checked);
  const [lastProp, setLastProp] = useState<CheckedState>(checked);
  const [defaultChecked, setDefaultChecked] = useState<CheckedState>(checked);

  // Sync an externally-controlled value without an effect (no extra render).
  if (checked !== lastProp) {
    setLastProp(checked);
    // The default a reset restores follows the prop, except when the prop
    // only hands back what the control already holds: that is the page
    // echoing a click, and an echo is not a new default (ADR 0012).
    if (checked !== value) setDefaultChecked(checked);
    setValue(checked);
  }

  // The control answers for whichever form it is in; with no element to ask,
  // it belongs to none.
  const ownRef = useRef<HTMLInputElement | null>(null);
  const anchor = controlRef ?? ownRef;
  useFormDefault(
    anchor,
    (node: HTMLInputElement) => {
      node.defaultChecked = defaultChecked === true;
    },
    [defaultChecked],
  );
  useFormReset(anchor, () => setValue(defaultChecked));

  const setChecked = useCallback(
    (next: CheckedState) => {
      setValue(next);
      onCheckedChange?.(next);
    },
    [onCheckedChange],
  );

  return useMemo(
    () =>
      core.connect({
        state: { checked: value, disabled },
        setChecked,
        normalize: normalizeProps,
      }),
    [value, disabled, setChecked],
  );
}
