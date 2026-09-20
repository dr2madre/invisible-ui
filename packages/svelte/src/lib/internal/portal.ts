import type { Action } from "svelte/action";

/**
 * Svelte action that relocates a node to a portal target on mount and removes
 * it on destroy. Lets modal overlays (Dialog, Alert Dialog, Sheet, Drawer)
 * escape ancestor `overflow`/`transform` and stacking contexts. The default
 * target is the open dialog the node sits in, else `document.body`.
 * SSR-safe — a no-op when there is no `document`.
 */
export const portal: Action<HTMLElement, HTMLElement | undefined> = (node, target) => {
  if (typeof document === "undefined") return {};

  // An overlay left in the body while a modal dialog is open can be seen but
  // not clicked, so it goes into the dialog the control sits in. The dialog
  // does not have to be open yet: this runs while its content is still
  // mounting.
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
