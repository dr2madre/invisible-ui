import type { Action } from "svelte/action";

/**
 * Svelte action that relocates a node to a portal target (default
 * `document.body`) on mount and removes it on destroy. Lets modal overlays
 * (Dialog, Alert Dialog, Sheet, Drawer) escape ancestor `overflow`/`transform`
 * and stacking contexts. SSR-safe — a no-op when there is no `document`.
 */
export const portal: Action<HTMLElement, HTMLElement | undefined> = (node, target) => {
  if (typeof document === "undefined") return {};

  const mount = (dest: HTMLElement) => dest.appendChild(node);
  mount(target ?? document.body);

  return {
    update(next: HTMLElement | undefined) {
      mount(next ?? document.body);
    },
    destroy() {
      node.parentNode?.removeChild(node);
    },
  };
};
