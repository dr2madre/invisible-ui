import type { DomProps } from "@design-system/core";
import type { Action } from "svelte/action";

/**
 * Apply a component's `rootDomProps` to its element.
 *
 * These are live DOM *properties* the core declares because HTML has no
 * attribute for them (`input.indeterminate`), so they cannot be rendered
 * declaratively. The action is deliberately generic: it assigns whatever the
 * core declares and reassigns on update, so a component gaining a new such
 * property needs no change here — and none can be silently forgotten.
 */
export const domProps: Action<HTMLElement, DomProps> = (node, props = {}) => {
  const apply = (next: DomProps) => {
    for (const [key, value] of Object.entries(next)) {
      (node as unknown as Record<string, unknown>)[key] = value;
    }
  };

  apply(props);

  return {
    update: apply,
  };
};
