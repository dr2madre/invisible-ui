import type { ElementProps, Normalize } from "@design-system/core";

/**
 * DOM attribute names the core emits that React spells differently. The core
 * already speaks React's event dialect (`onClick`, `onChange`, `onKeyDown`, …),
 * so handlers pass straight through and only a few attributes need renaming.
 *
 * `for` and `class` are guards: no component in the PoC set emits them, but a
 * future primitive might, and silently dropping them would be a bug.
 */
const RENAME: Record<string, string> = {
  tabindex: "tabIndex",
  for: "htmlFor",
  class: "className",
  readonly: "readOnly",
  maxlength: "maxLength",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
};

/**
 * The React seam: map the core's generic prop bag onto JSX props.
 *
 * Near-identity by design. Unlike the Svelte adapter — which applies props to
 * the DOM by hand through a `use:` action and must therefore bookkeep event
 * listeners and coerce booleans to `"true"`/`"false"` — React owns
 * serialisation: `aria-*` booleans, `data-*` and event handlers are all handled
 * by the renderer. `undefined` values are dropped so React omits the attribute
 * rather than rendering it empty.
 */
export const normalizeProps: Normalize = <T extends ElementProps>(props: T): T => {
  const out: ElementProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    out[RENAME[key] ?? key] = value;
  }

  return out as T;
};
