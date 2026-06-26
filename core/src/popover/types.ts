/**
 * A popover — a non-modal floating panel anchored to a trigger (WAI-ARIA: a
 * disclosure whose trigger advertises `aria-haspopup="dialog"` + `aria-expanded`
 * and controls the panel). Positioning and focus are DOM concerns owned by the
 * adapter; this pure primitive only owns the open state and the ARIA wiring.
 */

export interface PopoverState {
  /** Whether the panel is open. */
  open: boolean;
  /** Base id linking the trigger and the content. */
  id: string;
}

export interface PopoverContext {
  /** Initial / controlled open state. Defaults to `false`. */
  open?: boolean;
  /** Base id used to link parts. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
