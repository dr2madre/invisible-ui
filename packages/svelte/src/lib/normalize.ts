import type { Normalize } from "@design-system/core";

/**
 * Svelte applies element props to the DOM directly (via the `use:` action),
 * so no key remapping is needed — normalization is the identity function.
 */
export const normalizeProps: Normalize = (props) => props;
