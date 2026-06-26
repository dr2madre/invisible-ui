/**
 * A hover card — a non-modal floating card revealed when a trigger (typically a
 * link) is hovered or focused (Radix "Hover Card" / Bits "Link Preview"). It is
 * supplementary content: focus is **not** moved into it and it carries no dialog
 * role. Positioning, the hover/focus open-close timing and dismissal are DOM
 * concerns owned by the adapter; this pure primitive owns only the open state
 * and the `data-state` wiring.
 */

export interface HoverCardState {
  /** Whether the card is open. */
  open: boolean;
  /** Base id linking the trigger and the content. */
  id: string;
}

export interface HoverCardContext {
  /** Initial / controlled open state. Defaults to `false`. */
  open?: boolean;
  /** Base id used to link parts. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
