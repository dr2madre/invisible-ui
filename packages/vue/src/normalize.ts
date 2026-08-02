import type { ElementProps, Normalize } from "@design-system/core";

/**
 * The Vue seam: map the core's generic prop bag onto `h()` vnode props.
 *
 * Near-identity by design. Vue's renderer already speaks the core's dialect on
 * both sides: attributes keep their DOM spelling (`tabindex`, `class`, `for`)
 * and event handlers are camelCase vnode props (`onClick`, `onChange`,
 * `onKeyDown`), which is exactly what `connect()` emits. So, unlike the React
 * seam (which renames a handful of attributes) or the Svelte seam (which
 * applies props to the DOM by hand and bookkeeps listeners), this one only
 * drops `undefined` values, keeping the vnode props clean and the diffing
 * predictable. It exists as a named function so the adapter has one place to
 * add a rename if a future core primitive ever needs one, and so every adapter
 * hands `connect()` an explicit `normalize`.
 */
export const normalizeProps: Normalize = <T extends ElementProps>(props: T): T => {
  const out: ElementProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    out[key] = value;
  }

  return out as T;
};
