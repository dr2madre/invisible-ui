import { formReset as core } from "@design-system/core";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "./layout-effect";

/**
 * Mirror a controlled prop without an effect, and track the default a form
 * reset restores.
 *
 * When the prop moves, `sync` hands it to the control's own state. The default
 * follows the prop too, except when the prop only hands back what the control
 * already holds (`current`): that is the page echoing a user change, and an
 * echo is not a new default (ADR 0012). The prop is compared with `equal`
 * too, so a page that writes a fresh array with the same entries on every
 * render changes nothing.
 */
export function useControlledDefault<T>(
  prop: T,
  current: T,
  sync: (prop: T) => void,
  equal: (a: T, b: T) => boolean = Object.is,
): T {
  const [lastProp, setLastProp] = useState(prop);
  const [defaultValue, setDefaultValue] = useState(prop);
  if (!equal(prop, lastProp)) {
    setLastProp(prop);
    sync(prop);
    if (!equal(current, prop)) setDefaultValue(prop);
  }
  return defaultValue;
}

/**
 * The value a control keeps of its own, with everything ADR 0011 and ADR 0012
 * ask of it: the prop seeds it and is mirrored into it while rendering, the
 * setter writes first and reports after, and a reset of the anchor's form puts
 * the current default back without reporting.
 */
export function useResettable<T>(
  prop: T,
  onChange: ((value: T) => void) | undefined,
  anchor: RefObject<Element | null>,
  equal?: (a: T, b: T) => boolean,
): [value: T, setValue: (next: T) => void, defaultValue: T] {
  const [value, setValue] = useState(prop);
  const defaultValue = useControlledDefault(prop, value, setValue, equal);
  useFormReset(anchor, () => setValue(defaultValue));
  const set = useCallback(
    (next: T) => {
      setValue(next);
      onChange?.(next);
    },
    [onChange],
  );
  return [value, set, defaultValue];
}

/** An element that can name the form it belongs to. */
type Anchored = Element & { form: HTMLFormElement | null };

/**
 * The owner a control answers for: the element's own when it is
 * form-associated, so a `form` attribute is honoured, else the form around it.
 */
const owner = (node: Element | null): Anchored | null =>
  node && ("form" in node ? (node as Anchored) : ({ form: node.closest("form") } as Anchored));

/**
 * Put a control back to its current default when its form is reset, quietly:
 * a reset is not a user change, so no callback fires (ADR 0012).
 *
 * The restore and the anchor are both read from refs, so a component whose
 * restore closes over fresh state, or whose ref is a different object each
 * render, stays subscribed: resubscribing would drop a restore already waiting
 * on its timer.
 */
export function useFormReset(anchor: RefObject<Element | null>, restore: () => void): void {
  const latest = useRef({ anchor, restore });
  useIsomorphicLayoutEffect(() => {
    latest.current = { anchor, restore };
  });

  useEffect(
    () =>
      core.onFormReset(
        document,
        () => owner(latest.current.anchor.current),
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
 * are handed; a text box or a range does not, because React keeps its default
 * in step with the value it renders, so a control holding one of those passes
 * no dependency list and writes its default after every render. React writes
 * it once more when it settles a controlled input after the event that changed
 * it, after this effect has run, so that write is answered a microtask later.
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
    if (!node) return;
    apply(node);
    if (!current) queueMicrotask(() => apply(node));
  });
}

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Write the `checked` default of every native box inside `root` that a group
 * renders: a radio group's radios, a checkbox group's boxes. React cannot
 * render it next to a live `checked`, so it is written here.
 */
export function useCheckedDefaults(
  root: RefObject<Element | null>,
  isDefault: (value: string) => boolean,
  deps: readonly unknown[],
): void {
  useFormDefault(
    root,
    (node) => {
      for (const input of node.querySelectorAll("input")) {
        input.defaultChecked = isDefault(input.value);
      }
    },
    deps,
  );
}
