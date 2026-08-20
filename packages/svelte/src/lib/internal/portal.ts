import type { Action } from "svelte/action";

/**
 * Svelte action that relocates a node to a portal target (default
 * `document.body`) on mount and removes it on destroy. Lets modal overlays
 * (Dialog, Alert Dialog, Sheet, Drawer) escape ancestor `overflow`/`transform`
 * and stacking contexts. SSR-safe — a no-op when there is no `document`.
 */
export const portal: Action<HTMLElement, HTMLElement | undefined> = (node, target) => {
  if (typeof document === "undefined") return {};

  // A modal dialog paints in the browser's top layer, above everything in the
  // body. An overlay that belongs to a control inside the dialog has to stay
  // in that same layer, or it shows through but cannot be clicked.
  const host = node.parentElement?.closest("dialog") ?? document.body;

  const mount = (dest: HTMLElement) => dest.appendChild(node);
  mount(target ?? host);

  return {
    update(next: HTMLElement | undefined) {
      mount(next ?? host);
    },
    destroy() {
      node.parentNode?.removeChild(node);
    },
  };
};
