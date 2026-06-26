import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { LabelState } from "./types";

/** The public, framework-agnostic API for a connected label. */
export interface LabelApi {
  /** Props for the label element (`<label>`). */
  rootProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: LabelState;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect label state to prop getters. A label associates with a form control
 * via `for`/`id`. On a native `<label>` the browser handles click-to-focus; we
 * additionally prevent text selection when the label is clicked more than once
 * (double-click), matching common form-label behaviour.
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): LabelApi {
  return {
    rootProps: normalize({
      for: state.for ?? undefined,
      id: state.id ?? undefined,
      onMouseDown: (event: Event) => {
        const mouse = event as MouseEvent;
        // Only prevent the default selection on a secondary+ click, so a
        // single click (which may move focus into the control) is unaffected.
        if (!mouse.defaultPrevented && mouse.detail > 1) mouse.preventDefault();
      },
    }),
  };
}
