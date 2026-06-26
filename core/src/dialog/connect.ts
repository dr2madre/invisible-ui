import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { contentId, descriptionId, titleId, triggerId } from "./state";
import type { DialogState } from "./types";

/** The public, framework-agnostic API for a connected dialog. */
export interface DialogApi {
  open: boolean;
  /** Open the dialog. */
  openDialog(): void;
  /** Close the dialog. */
  closeDialog(): void;
  /** Toggle the dialog. */
  toggle(): void;
  /** Props for the trigger element. */
  triggerProps: ElementProps;
  /** Props for the dialog panel (`role="dialog"`, `aria-modal`). */
  contentProps: ElementProps;
  /** Props for the title element (names the dialog). */
  titleProps: ElementProps;
  /** Props for the description element (describes the dialog). */
  descriptionProps: ElementProps;
  /** Props for a close button inside the dialog. */
  closeProps: ElementProps;
}

export interface ConnectOptions {
  state: DialogState;
  /** Request the open state to change; the adapter owns how state updates. */
  setOpen: (open: boolean) => void;
  /** Whether a description element is present (wires `aria-describedby`). */
  describedBy?: boolean;
  /** Whether Escape closes the dialog. Default `true`. */
  closeOnEscape?: boolean;
  normalize?: Normalize;
}

/**
 * Connect dialog state to prop getters following the WAI-ARIA dialog (modal)
 * pattern (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). The trigger
 * advertises the dialog; the panel is `role="dialog"`/`"alertdialog"` with
 * `aria-modal="true"`, named by its title (`aria-labelledby`) and optionally
 * described (`aria-describedby`), and closes on Escape. Portal, focus trap and
 * scroll lock are layered on by the adapter.
 */
export function connect({
  state,
  setOpen,
  describedBy = false,
  closeOnEscape = true,
  normalize = identityNormalize,
}: ConnectOptions): DialogApi {
  const { open, id, role } = state;

  const openDialog = () => {
    if (!open) setOpen(true);
  };
  const closeDialog = () => {
    if (open) setOpen(false);
  };
  const toggle = () => setOpen(!open);

  return {
    open,
    openDialog,
    closeDialog,
    toggle,
    triggerProps: normalize({
      id: triggerId(id),
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-controls": open ? contentId(id) : undefined,
      "data-state": open ? "open" : "closed",
      onClick: () => toggle(),
    }),
    contentProps: normalize({
      id: contentId(id),
      role,
      "aria-modal": true,
      "aria-labelledby": titleId(id),
      "aria-describedby": describedBy ? descriptionId(id) : undefined,
      tabindex: -1,
      "data-state": open ? "open" : "closed",
      onKeyDown: (event: Event) => {
        if (closeOnEscape && (event as KeyboardEvent).key === "Escape") {
          event.preventDefault();
          closeDialog();
        }
      },
    }),
    titleProps: normalize({ id: titleId(id) }),
    descriptionProps: normalize({ id: descriptionId(id) }),
    closeProps: normalize({ onClick: () => closeDialog() }),
  };
}
