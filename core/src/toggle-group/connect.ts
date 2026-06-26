import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { firstEnabled, lastEnabled, nextEnabled, prevEnabled, toggleValue } from "./state";
import type { ToggleGroupState } from "./types";

/** The public, framework-agnostic API for a connected toggle group. */
export interface ToggleGroupApi {
  /** Currently pressed item values. */
  value: string[];
  disabled: boolean;
  /** Replace the pressed set. */
  setValue(value: string[]): void;
  /** Toggle a single item (ignored when the group or item is disabled). */
  toggle(value: string): void;
  /** Props for the group container (`role="group"`). */
  rootProps: ElementProps;
  /** Props for a single toggle item, by value (`<button aria-pressed>`). */
  getItemProps(value: string): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: ToggleGroupState;
  /** Request a new pressed set; the adapter owns how state updates. */
  setValue: (value: string[]) => void;
  /** Move DOM focus to the item with the given value (adapter-provided). */
  focus?: (value: string) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect toggle-group state to prop getters: a group of toggle buttons
 * (`aria-pressed`) with roving tabindex and arrow-key movement (toolbar-style —
 * focus moves with arrows, activation is via click/Enter/Space). Single or
 * multiple selection.
 */
export function connect({
  state,
  setValue,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): ToggleGroupApi {
  const { value, items, disabled, orientation } = state;

  const isItemDisabled = (v: string) =>
    disabled || (items.find((i) => i.value === v)?.disabled ?? false);

  const toggle = (v: string) => {
    if (isItemDisabled(v)) return;
    setValue(toggleValue(state, v));
  };

  // The single tab stop: the first pressed item, else the first enabled one.
  const firstPressed = items.find((i) => value.includes(i.value))?.value ?? null;
  const tabStop = firstPressed ?? firstEnabled(items);

  const moveFocus = (target: string | null) => {
    if (target != null) focus?.(target);
  };

  const [nextKey, prevKey] =
    orientation === "horizontal" ? ["ArrowRight", "ArrowLeft"] : ["ArrowDown", "ArrowUp"];

  return {
    value,
    disabled,
    setValue,
    toggle,
    rootProps: normalize({
      role: "group",
      // `aria-orientation` is not valid on role="group"; orientation only drives
      // arrow-key direction (below) and styling (`data-orientation`).
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
    }),
    getItemProps: (v: string) => {
      const pressed = value.includes(v);
      const itemDisabled = isItemDisabled(v);
      return normalize({
        type: "button",
        "aria-pressed": pressed,
        disabled: itemDisabled || undefined,
        tabindex: itemDisabled ? undefined : v === tabStop ? 0 : -1,
        "data-state": pressed ? "on" : "off",
        "data-disabled": itemDisabled ? "" : undefined,
        "data-value": v,
        onClick: () => toggle(v),
        onKeyDown: (event: Event) => {
          const key = (event as KeyboardEvent).key;
          switch (key) {
            case nextKey:
              event.preventDefault();
              moveFocus(nextEnabled(items, v));
              break;
            case prevKey:
              event.preventDefault();
              moveFocus(prevEnabled(items, v));
              break;
            case "Home":
              event.preventDefault();
              moveFocus(firstEnabled(items));
              break;
            case "End":
              event.preventDefault();
              moveFocus(lastEnabled(items));
              break;
          }
        },
      });
    },
  };
}
