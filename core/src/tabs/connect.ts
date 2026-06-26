import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { firstEnabled, lastEnabled, nextEnabled, panelId, prevEnabled, tabId } from "./state";
import type { TabsState } from "./types";

/** The public, framework-agnostic API for a connected tabs widget. */
export interface TabsApi {
  /** The selected tab value, or `null`. */
  value: string | null;
  /** Select a tab (ignored when the tab is disabled). */
  setValue(value: string): void;
  /** Props for the tab list container (`role="tablist"`). */
  rootProps: ElementProps;
  /** Props for a tab trigger, by value (`role="tab"`). */
  getTabProps(value: string): ElementProps;
  /** Props for a tab panel, by value (`role="tabpanel"`). */
  getPanelProps(value: string): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: TabsState;
  /** Request a new selected value; the adapter owns how state updates. */
  setValue: (value: string) => void;
  /** Move DOM focus to the tab with the given value (adapter-provided). */
  focus?: (value: string) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect tabs state to prop getters following the WAI-ARIA tabs pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): a tablist of tabs linked to
 * panels, roving tabindex, and arrow/Home/End navigation with automatic or
 * manual activation.
 */
export function connect({
  state,
  setValue,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): TabsApi {
  const { value, items, orientation, activationMode, id } = state;

  const isDisabled = (v: string) => items.find((i) => i.value === v)?.disabled ?? false;

  const select = (v: string) => {
    if (isDisabled(v)) return;
    setValue(v);
  };

  const tabStop = value ?? firstEnabled(items);

  const goTo = (target: string | null) => {
    if (target == null) return;
    focus?.(target);
    if (activationMode === "automatic") select(target);
  };

  const [nextKey, prevKey] =
    orientation === "vertical" ? ["ArrowDown", "ArrowUp"] : ["ArrowRight", "ArrowLeft"];

  return {
    value,
    setValue: select,
    rootProps: normalize({
      role: "tablist",
      "aria-orientation": orientation,
      "data-orientation": orientation,
    }),
    getTabProps: (v: string) => {
      const selected = value === v;
      const disabled = isDisabled(v);
      return normalize({
        role: "tab",
        id: tabId(id, v),
        "aria-selected": selected,
        "aria-controls": panelId(id, v),
        "aria-disabled": disabled || undefined,
        tabindex: disabled ? undefined : v === tabStop ? 0 : -1,
        "data-state": selected ? "active" : "inactive",
        "data-disabled": disabled ? "" : undefined,
        "data-value": v,
        onClick: () => select(v),
        onKeyDown: (event: Event) => {
          const key = (event as KeyboardEvent).key;
          switch (key) {
            case nextKey:
              event.preventDefault();
              goTo(nextEnabled(items, v));
              break;
            case prevKey:
              event.preventDefault();
              goTo(prevEnabled(items, v));
              break;
            case "Home":
              event.preventDefault();
              goTo(firstEnabled(items));
              break;
            case "End":
              event.preventDefault();
              goTo(lastEnabled(items));
              break;
            case "Enter":
            case " ":
              event.preventDefault();
              select(v);
              break;
          }
        },
      });
    },
    getPanelProps: (v: string) => {
      const selected = value === v;
      return normalize({
        role: "tabpanel",
        id: panelId(id, v),
        "aria-labelledby": tabId(id, v),
        tabindex: 0,
        hidden: !selected,
        "data-state": selected ? "active" : "inactive",
      });
    },
  };
}
