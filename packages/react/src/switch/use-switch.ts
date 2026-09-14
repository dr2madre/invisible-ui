import { switchControl as core } from "@design-system/core";
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { useFormDefault, useFormReset } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export interface UseSwitchOptions {
  /** Initial (uncontrolled) or current (controlled) checked value. */
  checked?: boolean;
  disabled?: boolean;
  /** Called whenever the on/off value changes. */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * The native input this state renders on. Given it, the control carries the
   * DOM default a form reset restores, and puts its own state back when its
   * form is reset, silently (ADR 0012). Without it nothing changes: a reset
   * reaches no control that cannot say which form it belongs to.
   */
  controlRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Connect the headless Switch to React. Same shape as {@link useCheckbox}: the
 * hook owns the resolved state, the core owns the behaviour, and an externally
 * controlled `checked` is mirrored without an effect.
 */
export function useSwitch({
  checked = false,
  disabled = false,
  onCheckedChange,
  controlRef,
}: UseSwitchOptions = {}): core.SwitchApi {
  const [value, setValue] = useState(checked);
  const [lastProp, setLastProp] = useState(checked);
  const [defaultChecked, setDefaultChecked] = useState(checked);

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
      node.defaultChecked = defaultChecked;
    },
    [defaultChecked],
  );
  useFormReset(anchor, () => setValue(defaultChecked));

  const setChecked = useCallback(
    (next: boolean) => {
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
