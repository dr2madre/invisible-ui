import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { RadioGroupState } from "./types";

/** The public, framework-agnostic API for a connected radio group. */
export interface RadioGroupApi {
  /** The selected value, or `null`. */
  value: string | null;
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /** Select a value (ignored when the group or item is disabled). */
  setValue(value: string): void;
  /** Props for the group container (`role="radiogroup"`). */
  rootProps: ElementProps;
  /** Props for a single item — a native `<input type="radio">`, by value. */
  getItemProps(value: string): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: RadioGroupState;
  /** Request a new selected value; the adapter owns how state updates. */
  setValue: (value: string) => void;
  /** Shared form/group name applied to every radio input. */
  name?: string;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect radio group state to props for a `role="radiogroup"` of **native**
 * `<input type="radio">` items sharing a `name`. The browser owns single
 * selection, roving tabindex, arrow-key navigation and form participation; the
 * headless layer only owns the controlled value.
 */
export function connect({
  state,
  setValue,
  name,
  normalize = identityNormalize,
}: ConnectOptions): RadioGroupApi {
  const { value, items, orientation, disabled } = state;

  const isItemDisabled = (itemValue: string) =>
    disabled || (items.find((i) => i.value === itemValue)?.disabled ?? false);

  const select = (itemValue: string) => {
    if (isItemDisabled(itemValue)) return;
    setValue(itemValue);
  };

  return {
    value,
    disabled,
    setValue: select,
    rootProps: normalize({
      role: "radiogroup",
      "aria-orientation": orientation,
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
    }),
    getItemProps: (itemValue: string) => {
      const itemDisabled = isItemDisabled(itemValue);
      return normalize({
        type: "radio",
        name,
        value: itemValue,
        disabled: itemDisabled || undefined,
        "data-state": value === itemValue ? "checked" : "unchecked",
        "data-disabled": itemDisabled ? "" : undefined,
        "data-value": itemValue,
        onChange: () => select(itemValue),
      });
    },
  };
}
