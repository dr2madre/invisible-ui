import type { DomProps } from "@design-system/core";
import { toValue, watchEffect, type MaybeRefOrGetter, type Ref } from "vue";

/**
 * Apply a component's `rootDomProps` to its element.
 *
 * These are live DOM *properties* the core declares because HTML has no
 * attribute for them (`input.indeterminate`), so a template cannot express
 * them. The composable is deliberately generic: it assigns whatever the core
 * declares and reassigns when it changes, so a component gaining a new such
 * property needs no change here, and none can be silently forgotten.
 *
 * The effect flushes `post` so it runs after the DOM is patched: a native
 * checkbox clears `indeterminate` on toggle, and the reassignment must land on
 * the settled element.
 */
export function useDomProps(
  target: Ref<Element | null | undefined>,
  props: MaybeRefOrGetter<DomProps>,
): void {
  watchEffect(
    () => {
      const node = target.value;
      const bag = toValue(props);
      if (!node) return;

      for (const [key, value] of Object.entries(bag)) {
        (node as unknown as Record<string, unknown>)[key] = value;
      }
    },
    { flush: "post" },
  );
}
