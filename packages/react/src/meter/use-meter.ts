import { meter as core } from "@design-system/core";
import { useId } from "react";
import { normalizeProps } from "../normalize";

export interface UseMeterOptions {
  /** Current measured value. Defaults to `0`. */
  value?: number;
  /** Defaults to `0`. */
  min?: number;
  /** Defaults to `100`. */
  max?: number;
  /** Upper bound of the "low" band. */
  low?: number;
  /** Lower bound of the "high" band. */
  high?: number;
  /** Where the good end of the scale is. Defaults to `max`. */
  optimum?: number;
  /** Base id. Generated when omitted. */
  id?: string;
}

/**
 * Connect the headless meter (WAI-ARIA meter pattern) to React: a gauge of a
 * value within a known range. `rootProps` carry the role and the ARIA value,
 * `indicatorProps` the band and the quality the fill is coloured by, and
 * `percentage` sizes it. The props are derived from the options on every
 * render, so a changed value or range always shows. The element still needs
 * an accessible name (`aria-label`).
 */
export function useMeter(options: UseMeterOptions = {}): core.MeterApi {
  const generatedId = `ds-meter-${useId()}`;
  return core.connect({
    state: core.initialState({ ...options, id: options.id ?? generatedId }),
    normalize: normalizeProps,
  });
}
