import { accordion as core } from "@design-system/core";
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

export type AccordionType = core.AccordionType;
export type AccordionItem = core.AccordionItem;

export interface UseAccordionOptions {
  /** Ordered list of items. */
  items: AccordionItem[];
  /** Controlled expanded values. Defaults to none. */
  value?: string[];
  /** `single` (default): one open at a time. `multiple`: many. */
  type?: AccordionType;
  /** For `single`: allow collapsing the open item. Defaults to `true`. */
  collapsible?: boolean;
  /** Whether the whole accordion is disabled. */
  disabled?: boolean;
  /** Arrow-key axis for moving between headers. Defaults to `vertical`. */
  orientation?: core.Orientation;
  /** Called whenever the expanded set changes. */
  onValueChange?: (value: string[]) => void;
}

export interface UseAccordion {
  /** Reactive connected API; spread `rootProps` / `getItemProps` / `getTriggerProps` / `getPanelProps`. */
  api: ComputedRef<core.AccordionApi>;
  /** The expanded item values. */
  value: ComputedRef<string[]>;
  /** Template ref for the container; scopes focus movement between headers. */
  rootRef: Ref<HTMLElement | null>;
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v) => b.includes(v));

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
let instanceCount = 0;

/**
 * Connect the headless accordion (WAI-ARIA accordion pattern) to Vue: single
 * or multiple expansion, arrow-key movement between headers. Behaviour and
 * accessibility live in `@design-system/core`; this composable owns the
 * resolved state, derives the connected props with `computed(connect)`, and
 * moves DOM focus inside the container (`rootRef`).
 */
export function useAccordion(options: MaybeRefOrGetter<UseAccordionOptions>): UseAccordion {
  const id = `ds-accordion-${++instanceCount}`;
  const resolved = computed(() => toValue(options));

  const value = ref<string[]>(resolved.value.value ?? []);

  // Mirror an externally controlled value (compared as a set, so a parent
  // re-creating an equal array does not clobber an internal update).
  watch(
    () => resolved.value.value,
    (next) => {
      if (next && !sameSet(next, value.value)) value.value = next;
    },
  );

  const setValue = (next: string[]) => {
    if (sameSet(value.value, next)) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  const rootRef = ref<HTMLElement | null>(null);
  const focus = (target: string) => {
    const el = rootRef.value
      ? Array.from(rootRef.value.querySelectorAll<HTMLElement>("[data-value]")).find(
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
        type: resolved.value.type ?? "single",
        collapsible: resolved.value.collapsible ?? true,
        disabled: resolved.value.disabled ?? false,
        orientation: resolved.value.orientation ?? "vertical",
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
    rootRef,
  };
}
