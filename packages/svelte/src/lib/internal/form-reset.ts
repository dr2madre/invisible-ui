import { formReset as core } from "@design-system/core";
import type { Action } from "svelte/action";

/** An element that can name its form owner. */
type Associated = Element & { form: HTMLFormElement | null };

/**
 * The owner to listen for: the node itself when it is form-associated (so a
 * `form` attribute is honoured), else the form it sits in. Read again when
 * the reset arrives, so a control moved between forms follows the new one.
 *
 * Not the first form-associated descendant: a composite's parts come and go
 * with `name`, and one of them could name a different owner than the control
 * the user sees.
 */
const associated = (node: HTMLElement): Associated | null => {
  if ("form" in node) return node as unknown as Associated;
  const enclosing = node.closest("form");
  return enclosing ? ({ form: enclosing } as Associated) : null;
};

/**
 * Put the machine back when the owning form resets (ADR 0012). The parameter
 * is called with no arguments after the native restore, unless the consumer
 * cancelled the event; it reads the current prop, so the default follows the
 * prop after mount.
 */
export const formReset: Action<HTMLElement, () => void> = (node, restore) => {
  let current = restore;
  const stop = core.onFormReset(
    node.ownerDocument,
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
