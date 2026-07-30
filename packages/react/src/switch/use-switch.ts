import { switchControl as core } from "@design-system/core";
import { useCallback, useMemo, useState } from "react";
import { normalizeProps } from "../normalize";

export interface UseSwitchOptions {
  /** Initial (uncontrolled) or current (controlled) checked value. */
  checked?: boolean;
  disabled?: boolean;
  /** Called whenever the on/off value changes. */
  onCheckedChange?: (checked: boolean) => void;
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
}: UseSwitchOptions = {}): core.SwitchApi {
  const [value, setValue] = useState(checked);
  const [lastProp, setLastProp] = useState(checked);

  if (checked !== lastProp) {
    setLastProp(checked);
    setValue(checked);
  }

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
