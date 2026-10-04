import { tabs as core } from "@design-system/core";
import { useCallback, useId, useMemo } from "react";
import { useControllable } from "../internal/controllable";
import { keyedByDirection, type Direction } from "../internal/roving";
import { normalizeProps } from "../normalize";

export type ActivationMode = core.ActivationMode;
export type TabItem = core.TabItem;
export type TabsOrientation = core.Orientation;

export interface UseTabsOptions {
  /** Ordered list of tabs. */
  items: TabItem[];
  /** Initial (uncontrolled) or current (controlled) selected value. `null` falls back to the first enabled tab. */
  value?: string | null;
  /** Layout orientation (affects `aria-orientation` and the arrow keys). */
  orientation?: TabsOrientation;
  /**
   * `automatic` (default): arrow keys move focus and select. `manual`: arrow
   * keys move focus only; Enter or Space selects the focused tab.
   */
  activationMode?: ActivationMode;
  /** Called whenever the user selects a tab. */
  onValueChange?: (value: string) => void;
}

export interface UseTabs {
  /** The connected API; spread `rootProps`, `getTabProps` and `getPanelProps`. */
  api: core.TabsApi;
  /** The selected tab value, or `null` when no tab is enabled. */
  value: string | null;
}

/**
 * Connect the headless tabs (WAI-ARIA tabs pattern) to React: roving tabindex,
 * arrow, Home and End navigation, automatic or manual activation. In
 * right-to-left text the left and right arrows follow the visual order.
 *
 * The prop getters can be spread anywhere, so the strip may sit in a header
 * beside other controls while the panels fill the rest of the page. `value`
 * is a controllable mirror (ADR 0011); a value that names no tab falls back
 * to the first enabled one, silently.
 */
export function useTabs({
  items,
  value: valueProp = null,
  orientation = "horizontal",
  activationMode = "automatic",
  onValueChange,
}: UseTabsOptions): UseTabs {
  const id = `ds-tabs-${useId()}`;
  const [selected, setSelected] = useControllable(valueProp, undefined);
  const value =
    selected != null && items.some((item) => item.value === selected)
      ? selected
      : core.firstEnabled(items);

  const connect = useCallback(
    (direction: Direction) =>
      core.connect({
        state: { value, items, orientation, activationMode, id },
        setValue: (next) => {
          if (next === value) return;
          setSelected(next);
          onValueChange?.(next);
        },
        focus: (target) => document.getElementById(core.tabId(id, target))?.focus(),
        direction,
        normalize: normalizeProps,
      }),
    [value, items, orientation, activationMode, id, setSelected, onValueChange],
  );

  const api = useMemo(() => {
    const ltr = connect("ltr");
    return {
      ...ltr,
      getTabProps: (tab: string) =>
        keyedByDirection(ltr.getTabProps(tab), () => connect("rtl").getTabProps(tab)),
    };
  }, [connect]);

  return { api, value };
}
