import type { ElementProps } from "@design-system/core";

/** Reading direction of the text an element sits in. */
export type Direction = "ltr" | "rtl";

type Handler = (event: unknown) => void;

/**
 * Give a control the keydown of the connection that matches its reading
 * direction. The direction is read when a key is pressed, so a `dir` set
 * anywhere above the component counts, with or without a `LocaleProvider`,
 * and the server never has to know it. `props` come from the left-to-right
 * connection; `rtl` builds the other one and picks the same control from it.
 */
export const keyedByDirection = (props: ElementProps, rtl: () => ElementProps): ElementProps => ({
  ...props,
  onKeyDown: (event: { currentTarget: Element }) => {
    const mirrored = getComputedStyle(event.currentTarget).direction === "rtl";
    ((mirrored ? rtl() : props).onKeyDown as Handler)(event);
  },
});

/** Focus the control inside `root` that carries `data-value={value}`. */
export const focusValue = (root: HTMLElement | null, value: string): void => {
  if (!root) return;
  for (const node of root.querySelectorAll<HTMLElement>("[data-value]")) {
    if (node.dataset.value === value) {
      node.focus();
      return;
    }
  }
};
