import { progress as core } from "@design-system/core";
import { useId } from "react";
import { normalizeProps } from "../normalize";

export interface UseProgressOptions {
  /** Current value; `null` for work of unknown length. Defaults to `0`. */
  value?: number | null;
  /** Defaults to `0`. */
  min?: number;
  /** Defaults to `100`. */
  max?: number;
  /** Base id. Generated when omitted. */
  id?: string;
}

/**
 * Connect the headless progress bar (WAI-ARIA progressbar pattern) to React:
 * `rootProps` carry the role and the ARIA value, `indicatorProps` the state
 * hooks for the fill, and `percentage` sizes it. The props are derived from
 * the options on every render, so there is no state to keep in sync. The
 * element still needs an accessible name (`aria-label`).
 */
export function useProgress({
  value = 0,
  min,
  max,
  id,
}: UseProgressOptions = {}): core.ProgressApi {
  const generatedId = `ds-progress-${useId()}`;
  return core.connect({
    state: core.initialState({ value, min, max, id: id ?? generatedId }),
    normalize: normalizeProps,
  });
}
