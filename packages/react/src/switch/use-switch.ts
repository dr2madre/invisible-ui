import { switchControl as core } from "@design-system/core";
import { useMemo, type RefObject } from "react";
import { useCheckedState } from "../internal/checked-state";
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
  const { checked: value, setChecked } = useCheckedState<boolean>(
    checked,
    onCheckedChange,
    controlRef,
    (value) => value,
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
