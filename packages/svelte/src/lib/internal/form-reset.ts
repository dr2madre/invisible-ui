import { formReset as core } from "@design-system/core";
import type { Action } from "svelte/action";

/** An element that can name its form owner. */
type Associated = Element & { form: HTMLFormElement | null };

/**
 * The node itself when it can name its form, else the first descendant that
 * can. Resolved when the reset arrives, so a part that comes and goes (a
 * hidden input rendered only under `name`) is found in whatever state it is
 * in at that moment.
 */
const associated = (node: HTMLElement): Associated | null =>
  "form" in node
    ? (node as unknown as Associated)
    : node.querySelector<HTMLInputElement>("input, select, textarea, button");

/**
 * Put the machine back when the owning form resets (ADR 0012). The parameter
 * is called with no arguments after the native restore, unless the consumer
 * cancelled the event; it reads the current prop, so the default follows the
 * prop after mount.
 */
export const formReset: Action<HTMLElement, () => void> = (node, restore) => {
  let current = restore;
  const stop = core.onFormReset(
    () => associated(node),
    () => current(),
  );
  return {
    update(next: () => void) {
      current = next;
    },
    destroy: stop,
  };
};
