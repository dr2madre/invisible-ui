import { tabs as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type ActivationMode = core.ActivationMode;
export type TabItem = core.TabItem;

export interface UseTabsOptions {
  /** Ordered list of tabs. */
  items: TabItem[];
  /** Controlled selected value; `null` falls back to the first enabled tab. */
  value?: string | null;
  /** Layout orientation (affects `aria-orientation` and arrow keys). */
  orientation?: core.Orientation;
  /**
   * `automatic` (default): arrow keys move focus and select. `manual`: arrow
   * keys move focus only; Enter/Space selects the focused tab.
   */
  activationMode?: ActivationMode;
  /** Called whenever the selected tab changes. */
  onValueChange?: (value: string) => void;
}

export interface UseTabs {
  /** Reactive connected API; spread `rootProps` / `getTabProps` / `getPanelProps`. */
  api: ComputedRef<core.TabsApi>;
  /** The selected tab value (or `null`). */
  value: ComputedRef<string | null>;
  /** Template ref for the tab list; scopes focus movement during arrow navigation. */
  listRef: Ref<HTMLElement | null>;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect the headless tabs (WAI-ARIA tabs pattern) to Vue: roving tabindex,
 * arrow/Home/End navigation, automatic or manual activation. Behaviour and
 * accessibility live in `@design-system/core`; this composable owns the
 * resolved state, derives the connected props with `computed(connect)`, and
 * moves DOM focus inside the tab list (`listRef`).
 */
export function useTabs(options: MaybeRefOrGetter<UseTabsOptions>): UseTabs {
  const id = useStableId("ds-tabs");
  const resolved = computed(() => toValue(options));

  // Default to the first enabled tab so a panel is always shown.
  const value = ref<string | null>(resolved.value.value ?? core.firstEnabled(resolved.value.items));

  // Mirror an externally controlled value.
  watch(
    () => resolved.value.value,
    (next) => {
      value.value = next ?? core.firstEnabled(resolved.value.items);
    },
  );

  // Keep the selection valid when the tab list changes.
  watch(
    () => resolved.value.items,
    (items) => {
      if (!items.some((item) => item.value === value.value)) {
        value.value = core.firstEnabled(items);
      }
    },
  );

  const setValue = (next: string) => {
    if (value.value === next) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  const listRef = ref<HTMLElement | null>(null);
  const focus = (target: string) => {
    const el = listRef.value
      ? Array.from(listRef.value.querySelectorAll<HTMLElement>("[data-value]")).find(
          (node) => node.dataset.value === target,
        )
      : null;
    el?.focus();
  };

  const api = computed(() =>
    core.connect({
      state: {
        value: value.value,
        items: resolved.value.items,
        orientation: resolved.value.orientation ?? "horizontal",
        activationMode: resolved.value.activationMode ?? "automatic",
        id,
      },
      setValue,
      focus,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    value: computed(() => value.value),
    listRef,
  };
}
