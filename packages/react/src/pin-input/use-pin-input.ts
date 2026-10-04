import { pinInput as core } from "@design-system/core";
import { useId, useRef, useState, type RefObject } from "react";
import { useI18n } from "../i18n/i18n";
import { useControlledDefault, useFormReset } from "../internal/form-reset";
import { inputEvent, normalizeProps } from "../normalize";

export type PinInputType = core.PinInputType;

export interface UsePinInputOptions {
  /** Initial (uncontrolled) or current (controlled) value; spread across the cells. */
  value?: string;
  /** Number of cells. Defaults to `6`. */
  length?: number;
  /** Allowed characters. Defaults to `numeric`. */
  type?: PinInputType;
  /** Render cells masked. */
  mask?: boolean;
  disabled?: boolean;
  /** Accessible name for a cell, by zero-based index. Defaults to the catalog. */
  cellLabel?: (index: number, length: number) => string;
  /** Called whenever the combined value changes. */
  onValueChange?: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
  /**
   * The element holding the cells, which `rootProps` go on. Given it, a reset
   * of its form puts the code back, silently (ADR 0012).
   */
  rootRef?: RefObject<HTMLElement | null>;
}

/**
 * Connect the headless PIN input (OTP / verification code) to React. Behaviour
 * and accessibility (per-cell entry, advance/backspace, arrows, paste
 * distribution, character filtering) live in the core; this hook owns the
 * per-cell values, moves DOM focus between the cells, and reports `onComplete`
 * once every cell is filled. Each cell's props carry its live `value`.
 */
export function usePinInput({
  value = "",
  length = 6,
  type,
  mask,
  disabled,
  cellLabel,
  onValueChange,
  onComplete,
  rootRef,
}: UsePinInputOptions = {}): core.PinInputApi {
  const id = `ds-pin-input-${useId()}`;
  const { t } = useI18n();
  // The per-cell array is the state: a blank cell in the middle of the code
  // has to survive, and the joined value would close that gap.
  const [values, setValues] = useState(() => core.splitValue(value, length));
  const joined = values.join("");
  const defaultValue = useControlledDefault(value, joined, (next) =>
    setValues(core.splitValue(next, length)),
  );
  // A changed cell count re-spreads the code the cells hold.
  const [lastLength, setLastLength] = useState(length);
  if (length !== lastLength) {
    setLastLength(length);
    setValues(core.splitValue(joined, length));
  }

  const own = useRef<HTMLElement | null>(null);
  const root = rootRef ?? own;
  useFormReset(root, () => setValues(core.splitValue(defaultValue, length)));

  const state = core.initialState({ value: joined, length, type, mask, disabled, id });
  const api = core.connect({
    state: { ...state, values },
    setValues: (next) => {
      // A different number of cells is always a change.
      if (next.length === values.length && next.every((cell, i) => cell === values[i])) return;
      setValues(next);
      const code = next.join("");
      onValueChange?.(code);
      if (core.isComplete({ ...state, values: next })) onComplete?.(code);
    },
    focus: (index) =>
      document.getElementById(id)?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus(),
    cellLabel:
      cellLabel ?? ((index, count) => t("pinInput.cell", { index: index + 1, length: count })),
    normalize: normalizeProps,
  });
  return {
    ...api,
    // The id scopes the focus movement to these cells.
    rootProps: { ...api.rootProps, id },
    getInputProps: (index) => ({ ...inputEvent(api.getInputProps(index)), value: values[index] }),
  };
}
