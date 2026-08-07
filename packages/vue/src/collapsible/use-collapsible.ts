import { collapsible as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export interface UseCollapsibleOptions {
  /** Initial (uncontrolled) or current (controlled) open state. */
  open?: boolean;
  /** Whether the collapsible is disabled. */
  disabled?: boolean;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

export interface UseCollapsible {
  /** Reactive connected API; spread `rootProps` / `triggerProps` / `contentProps`. */
  api: ComputedRef<core.CollapsibleApi>;
  /** Whether the content is expanded. */
  open: ComputedRef<boolean>;
  /** Set the open state (ignored while disabled). */
  setOpen: (open: boolean) => void;
  /** Toggle the open state (ignored while disabled). */
  toggle: () => void;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect the headless collapsible (WAI-ARIA disclosure pattern) to Vue: one
 * trigger button showing or hiding one content region. Behaviour and
 * accessibility (`aria-expanded` / `aria-controls` wiring, disabled handling,
 * the `hidden` content) live in `@design-system/core`; this composable owns the
 * resolved state and derives the connected props with `computed(connect)`.
 */
export function useCollapsible(
  options: MaybeRefOrGetter<UseCollapsibleOptions> = {},
): UseCollapsible {
  const id = useStableId("ds-collapsible");
  const resolved = computed(() => toValue(options));

  const open = ref(resolved.value.open ?? false);

  // Mirror an externally controlled `open`.
  watch(
    () => resolved.value.open ?? false,
    (next) => {
      open.value = next;
    },
  );

  const setOpen = (next: boolean) => {
    if (open.value === next) return;
    open.value = next;
    resolved.value.onOpenChange?.(next);
  };

  const api = computed(() =>
    core.connect({
      state: { open: open.value, disabled: resolved.value.disabled ?? false, id },
      setOpen,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    open: computed(() => open.value),
    setOpen,
    toggle: () => api.value.toggle(),
  };
}
