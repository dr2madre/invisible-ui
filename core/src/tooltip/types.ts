/**
 * A tooltip — a small descriptive label shown on hover/focus of a trigger
 * (WAI-ARIA `role="tooltip"`, linked from the trigger via `aria-describedby`).
 * Timing (open/close delays), positioning and the hover/focus wiring are DOM
 * concerns owned by the adapter; this pure primitive owns the open state and
 * the ARIA linkage.
 */

export interface TooltipState {
  /** Whether the tooltip is visible. */
  open: boolean;
  /** Base id used to link the trigger and the tooltip. */
  id: string;
}

export interface TooltipContext {
  open?: boolean;
  id?: string;
  onOpenChange?: (open: boolean) => void;
}
