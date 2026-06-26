import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { ButtonGroupState } from "./types";

/** The public, framework-agnostic API for a connected button group. */
export interface ButtonGroupApi {
  /** Props for the group container (`role="group"`). */
  groupProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: ButtonGroupState;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect button-group state to prop getters. A button group is a labelled
 * `role="group"` container that orients its buttons; it carries no selection,
 * so there are no per-item props — the buttons inside keep their own behaviour.
 */
export function connect({ state, normalize = identityNormalize }: ConnectOptions): ButtonGroupApi {
  const { orientation, label } = state;

  return {
    groupProps: normalize({
      role: "group",
      "aria-label": label,
      // `aria-orientation` is not a supported attribute on role="group", so the
      // orientation is exposed only as a styling hook.
      "data-orientation": orientation,
    }),
  };
}
