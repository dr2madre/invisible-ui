import { formReset as core } from "@invisible-ui/core";

/** An element that can name the form it belongs to. */
type Anchored = Element & { form: HTMLFormElement | null };

/**
 * Put a control back to its current default when its form is reset, quietly:
 * a reset is not a user change, so no event of the element's own is sent
 * (ADR 0012).
 *
 * The anchor is the native element the component renders. The browser knows
 * which form that element belongs to, and it is read when the reset happens,
 * so a control that has since been moved follows the form it is in now.
 */
export function watchFormReset(
  host: HTMLElement,
  anchor: () => Anchored | null,
  restore: () => void,
): () => void {
  return core.onFormReset(host.ownerDocument, anchor, restore);
}
