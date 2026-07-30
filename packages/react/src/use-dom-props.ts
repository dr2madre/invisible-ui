import type { DomProps } from "@design-system/core";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Apply a component's `rootDomProps` to its element.
 *
 * These are live DOM *properties* the core declares because HTML has no
 * attribute for them (`input.indeterminate`), so JSX cannot express them. The
 * hook is deliberately generic: it assigns whatever the core declares and
 * reassigns when it changes, so a component gaining a new such property needs
 * no change here — and none can be silently forgotten.
 */
export function useDomProps(ref: RefObject<Element | null>, props: DomProps): void {
  // The bag is a fresh object every render, so the effect keys off its
  // *contents*; the ref carries the values themselves without widening deps.
  const latest = useRef(props);
  latest.current = props;
  const signature = JSON.stringify(props);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    for (const [key, value] of Object.entries(latest.current)) {
      (node as unknown as Record<string, unknown>)[key] = value;
    }
  }, [ref, signature]);
}
