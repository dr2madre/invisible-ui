import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { toggleValue } from "./state";
import type { CheckboxGroupState } from "./types";

/** The public, framework-agnostic API for a connected checkbox group. */
export interface CheckboxGroupApi {
  /** The selected values. */
  value: string[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /** Whether a given value is selected. */
  isChecked(value: string): boolean;
  /** Toggle a value (ignored when the group or item is disabled). */
  toggle(value: string): void;
  /** Props for the group container (a native `<fieldset>`). */
  rootProps: ElementProps;
  /** Props for a single item — a native `<input type="checkbox">`, by value. */
  getItemProps(value: string): ElementProps;
}

export interface ConnectOptions {
  state: CheckboxGroupState;
  /** Request a new selection; the adapter owns how state updates. */
  setValue: (value: string[]) => void;
  /** Shared form field name applied to every item. */
  name?: string;
  normalize?: Normalize;
}

/**
 * Connect checkbox-group state to props for a native `<fieldset>` of
 * `<input type="checkbox">` items. The browser owns the checkbox role, Space
 * activation, focus and form participation (every checked item submits its
 * value under the shared `name`); the headless layer only owns the selection.
 */
export function connect({
  state,
  setValue,
  name,
  normalize = identityNormalize,
}: ConnectOptions): CheckboxGroupApi {
  const { value, items, disabled } = state;

  const isItemDisabled = (itemValue: string) =>
    disabled || (items.find((i) => i.value === itemValue)?.disabled ?? false);

  const isChecked = (itemValue: string) => value.includes(itemValue);

  const toggle = (itemValue: string) => {
    if (isItemDisabled(itemValue)) return;
    setValue(toggleValue(value, itemValue));
  };

  return {
    value,
    disabled,
    isChecked,
    toggle,
    rootProps: normalize({
      // A native <fieldset> exposes role="group"; `disabled` cascades to inputs.
      disabled: disabled || undefined,
      "data-disabled": disabled ? "" : undefined,
    }),
    getItemProps: (itemValue: string) => {
      const itemDisabled = isItemDisabled(itemValue);
      return normalize({
        type: "checkbox",
        name,
        value: itemValue,
        disabled: itemDisabled || undefined,
        "data-state": isChecked(itemValue) ? "checked" : "unchecked",
        "data-disabled": itemDisabled ? "" : undefined,
        "data-value": itemValue,
        onChange: () => toggle(itemValue),
      });
    },
  };
}
