import { i18n } from "@invisible-ui/core";
import type { Action } from "svelte/action";
import type { Readable } from "svelte/store";

// Where each portalled node was declared, next to the control that opens it.
const origins = new WeakMap<HTMLElement, Element | null>();

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

  origins.set(node, node.parentElement);
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

export interface FollowDirectionOptions {
  /** The direction to use when the page cannot be read: the i18n context's. */
  fallback: "ltr" | "rtl";
  /** The open state of a popup that stays mounted, read again each time it opens. */
  open?: boolean | Readable<boolean>;
}

/**
 * Svelte action that writes onto a portalled popup the direction of the place
 * it was declared, next to the control that opens it. A `dir` on a plain
 * wrapper around the control then counts, as it does for the control itself.
 * The direction is read on mount and each time `open` turns true.
 */
export const followDirection: Action<HTMLElement, FollowDirectionOptions> = (node, initial) => {
  let options = initial;
  let stop: (() => void) | undefined;
  const apply = () => {
    const origin = origins.has(node) ? origins.get(node) : node.parentElement;
    node.dir = i18n.elementDirection(origin) ?? options.fallback;
  };
  const watch = () => {
    stop?.();
    stop = undefined;
    const { open } = options;
    if (open !== undefined && typeof open !== "boolean") {
      stop = open.subscribe((value) => {
        if (value) apply();
      });
    } else if (open !== false) apply();
  };
  watch();
  return {
    update(next) {
      options = next;
      watch();
    },
    destroy() {
      stop?.();
    },
  };
};
