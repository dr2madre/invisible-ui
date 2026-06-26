import type { Action } from "svelte/action";

/**
 * Drive a checkbox's indeterminate state. `indeterminate` is a DOM *property*,
 * not an attribute, so it can't be set declaratively in markup — this action
 * keeps `input.indeterminate` in sync with the bound value.
 */
export const indeterminate: Action<HTMLInputElement, boolean> = (node, value = false) => {
  node.indeterminate = value;
  return {
    update(next: boolean) {
      node.indeterminate = next;
    },
  };
};
