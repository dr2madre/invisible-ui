import { checkbox as core } from "@design-system/core";
import { useCallback, useMemo, useState } from "react";
import { normalizeProps } from "../normalize";

export type CheckedState = core.CheckedState;

export interface UseCheckboxOptions {
  /** Initial (uncontrolled) or current (controlled) checked value. */
  checked?: CheckedState;
  disabled?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: CheckedState) => void;
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
}: UseCheckboxOptions = {}): core.CheckboxApi {
  const [value, setValue] = useState<CheckedState>(checked);
  const [lastProp, setLastProp] = useState<CheckedState>(checked);

  // Sync an externally-controlled value without an effect (no extra render).
  if (checked !== lastProp) {
    setLastProp(checked);
    setValue(checked);
  }

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
