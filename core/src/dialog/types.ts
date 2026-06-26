/**
 * A dialog — a modal overlay window (WAI-ARIA dialog / alertdialog pattern): a
 * trigger advertises `aria-haspopup="dialog"` + `aria-expanded` and controls a
 * `role="dialog"` (or `"alertdialog"`) panel with `aria-modal="true"`, named by
 * its title and optionally described by its description. The modal DOM concerns
 * — portal, focus trap, scroll lock, backdrop — are owned by the adapter; this
 * pure primitive only owns the open state and the ARIA wiring.
 */

/** The dialog's accessibility role. */
export type DialogRole = "dialog" | "alertdialog";

export interface DialogState {
  /** Whether the dialog is open. */
  open: boolean;
  /** Base id linking the trigger, panel, title and description. */
  id: string;
  /** `"dialog"` (default) or `"alertdialog"`. */
  role: DialogRole;
}

export interface DialogContext {
  /** Initial / controlled open state. Defaults to `false`. */
  open?: boolean;
  /** Base id used to link parts. Auto-generated when omitted. */
  id?: string;
  /** Accessibility role. Defaults to `"dialog"`. */
  role?: DialogRole;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
