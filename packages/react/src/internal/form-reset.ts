import { formReset as core } from "@design-system/core";
import { useEffect, useRef, type RefObject } from "react";

/** An element that can name the form it belongs to. */
type Anchored = Element & { form: HTMLFormElement | null };

/**
 * Put a control back to its current default when its form is reset, quietly:
 * a reset is not a user change, so no callback fires (ADR 0012).
 *
 * The restore is read from a ref, so a component whose restore closes over
 * fresh state does not resubscribe on every render.
 */
export function useFormReset(anchor: RefObject<Anchored | null>, restore: () => void): void {
  const latest = useRef(restore);
  latest.current = restore;

  useEffect(
    () =>
      core.onFormReset(
        document,
        () => anchor.current,
        () => latest.current(),
      ),
    [anchor],
  );
}

/**
 * Write the DOM default a form reset restores: the `checked` and `value`
 * attributes React only sets when the element first renders, and the
 * `selected` attribute on a native option.
 *
 * React owns `checked` and `value` as properties on a controlled element and
 * never touches the defaults again, so a page that changes them leaves the
 * browser's own reset pointing at the value the element first had.
 */
export function useFormDefault(
  ref: RefObject<Element | null>,
  apply: (node: never) => void,
  deps: readonly unknown[],
): void {
  const latest = useRef(apply);
  latest.current = apply;

  useEffect(() => {
    const node = ref.current;
    if (node) latest.current(node as never);
    // The caller lists what the default is made of; `apply` itself is read
    // from the ref, so a fresh closure every render does not re-run this.
  }, [ref, ...deps]);
}
