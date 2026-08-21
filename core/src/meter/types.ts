/** Internal, fully-resolved state of a meter. */
export interface MeterState {
  /** Current measured value. */
  value: number;
  /** Minimum value. */
  min: number;
  /** Maximum value. */
  max: number;
  /** Upper bound of the "low" range, or `null` when unset. */
  low: number | null;
  /** Lower bound of the "high" range, or `null` when unset. */
  high: number | null;
  /**
   * Where the good end of the scale is. For battery or a score the good end is
   * the top; for disk usage or error rate it is the bottom. Defaults to `max`,
   * so a meter that says nothing keeps reading "more is better".
   */
  optimum: number;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a meter. */
export interface MeterContext {
  /** Current measured value. Defaults to `0`. */
  value?: number;
  /** Minimum value. Defaults to `0`. */
  min?: number;
  /** Maximum value. Defaults to `100`. */
  max?: number;
  /** Upper bound of the "low" range (values at or below are `low`). */
  low?: number;
  /** Lower bound of the "high" range (values at or above are `high`). */
  high?: number;
  /**
   * Where the good end of the scale is. Defaults to `max`. Set it near `min`
   * for a measure where less is better, such as disk usage.
   */
  optimum?: number;
  /** Base id. Auto-generated when omitted. */
  id?: string;
}
