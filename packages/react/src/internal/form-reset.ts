import { formReset as core } from "@design-system/core";
import { useEffect, useRef, type RefObject } from "react";

/** An element that can name the form it belongs to. */
type Anchored = Element & { form: HTMLFormElement | null };

/**
 * Put a control back to its current default when its form is reset, quietly:
 * a reset is not a user change, so no callback fires (ADR 0012).
 *
 * The restore and the anchor are both read from refs, so a component whose
 * restore closes over fresh state, or whose ref is a different object each
 * render, stays subscribed: resubscribing would drop a restore already waiting
 * on its timer.
 */
export function useFormReset(anchor: RefObject<Anchored | null>, restore: () => void): void {
  const latest = useRef({ anchor, restore });
  latest.current = { anchor, restore };

  useEffect(
    () =>
      core.onFormReset(
        document,
        () => latest.current.anchor.current,
        () => latest.current.restore(),
      ),
    [],
  );
}

/**
 * Write the DOM default a form reset restores: the `checked` and `value`
 * attributes, and the `selected` attribute on a native option.
 *
 * React writes those attributes when an element first renders, from the value
 * it is given, and a controlled element's value can move afterwards without
 * them. A checkbox, a switch and a select's options keep whatever default they
 * are handed; a text box does not, because React keeps its default in step
 * with the value it renders, so a control holding one of those passes no
 * dependency list and writes its default after every render.
 */
export function useFormDefault<T extends Element>(
  ref: RefObject<T | null>,
  apply: (node: T) => void,
  deps?: readonly unknown[],
): void {
  const latest = useRef(apply);
  latest.current = apply;

  useEffect(
    () => {
      const node = ref.current;
      if (node) latest.current(node);
    },
    deps === undefined ? undefined : [ref, ...deps],
  );
}
