import { formReset as core } from "@design-system/core";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "./layout-effect";

/**
 * Mirror a controlled prop without an effect, and track the default a form
 * reset restores.
 *
 * When the prop moves, `sync` hands it to the control's own state. The default
 * follows the prop too, except when the prop only hands back what the control
 * already holds (`current`): that is the page echoing a user change, and an
 * echo is not a new default (ADR 0012).
 */
export function useControlledDefault<T>(
  prop: T,
  current: T,
  sync: (prop: T) => void,
  equal: (a: T, b: T) => boolean = (a, b) => a === b,
): T {
  const [lastProp, setLastProp] = useState(prop);
  const [defaultValue, setDefaultValue] = useState(prop);
  if (prop !== lastProp) {
    setLastProp(prop);
    sync(prop);
    if (!equal(current, prop)) setDefaultValue(prop);
  }
  return defaultValue;
}

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
  useIsomorphicLayoutEffect(() => {
    latest.current = { anchor, restore };
  });

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
  // The list is compared here rather than handed to React, which cannot check
  // a dependency list it does not see written out.
  const applied = useRef<readonly unknown[] | null>(null);

  useEffect(() => {
    const current = deps === undefined ? null : [ref, ...deps];
    if (current && applied.current && sameDeps(applied.current, current)) return;
    applied.current = current;
    const node = ref.current;
    if (node) apply(node);
  });
}

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}
