import type { ElementProps } from "@design-system/core";

/**
 * Core props for a Svelte spread: Svelte names DOM events in lower case, so
 * `onClick` becomes `onclick`, and an undefined prop is left out.
 */
export const toSvelte = (props: ElementProps): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(props)
      .filter(([, prop]) => prop !== undefined)
      .map(([key, prop]) => [/^on[A-Z]/.test(key) ? key.toLowerCase() : key, prop]),
  );
