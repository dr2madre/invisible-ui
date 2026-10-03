import { forwardRef, type ReactNode } from "react";
import type { ButtonVariant } from "../button/use-button";
import { ChoiceActions, SimpleDialog } from "../dialog/SimpleDialog";
import { useDialog } from "../dialog/use-dialog";
import { useDialogHandle, type DialogHandle } from "../dialog/use-dialog-handle";

export interface ConfirmDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's content. Defaults to the catalog's "Open". */
  trigger?: ReactNode;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Accessible title naming the confirmation (required). */
  title: string;
  /** Optional supporting message. */
  description?: string;
  /** Label of the confirming button. Defaults to the catalog's "Confirm". */
  confirmLabel?: string;
  /** Label of the cancelling button (also the Escape action). Defaults to "Cancel". */
  cancelLabel?: string;
  /** Variant of the confirm button (`"danger"` for a destructive confirm). */
  confirmVariant?: ButtonVariant;
  /**
   * Interrupting urgency: switches the panel to `role="alertdialog"`, which
   * screen readers announce immediately. Nothing else changes (ADR 0005).
   */
  urgent?: boolean;
  /** Called when the confirm button is pressed (before the dialog closes). */
  onConfirm?: () => void;
  /** Whether pressing the backdrop cancels and closes. Defaults to `true`. */
  closeOnOutsideClick?: boolean;
  /** Show a close button at the trailing end of the header; it closes like Escape. */
  closeButton?: boolean;
  /** Accessible label for the close button. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /** Leading feedback icon in the header. */
  icon?: ReactNode;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * ConfirmDialog: a styled modal to verify or accept before proceeding, the
 * accessible equivalent of `window.confirm()` (a platform "simple dialog", per
 * ADR 0005). Cancel stops the process, confirm proceeds; focus starts on
 * Cancel, the safe choice. Set `urgent` when the choice must interrupt
 * (`role="alertdialog"`). For a message with nothing to cancel use
 * `AlertDialog`; to ask for a value use `PromptDialog`.
 *
 * It runs on `useDialog`: native `<dialog>` + `showModal()`, scroll lock,
 * focus restore. A `title` is required; `description` is optional. Themeable
 * via `--ds-dialog-*`.
 *
 * A ref holds the status area (ADR 0016), with the same contract as `Dialog`:
 * `notify(options)`, `dismissNotice(id)` and `clearNotices()`.
 */
// Marked pure, so an import of another component leaves this one out.
export const ConfirmDialog = /* @__PURE__ */ forwardRef<DialogHandle, ConfirmDialogProps>(
  function ConfirmDialog(
    {
      triggerVariant = "default",
      trigger,
      open = false,
      title,
      description,
      confirmLabel,
      cancelLabel,
      confirmVariant = "primary",
      urgent = false,
      onConfirm,
      closeOnOutsideClick = true,
      closeButton = false,
      closeLabel,
      icon,
      onOpenChange,
    },
    ref,
  ) {
    const dialog = useDialog({
      open,
      role: urgent ? "alertdialog" : "dialog",
      describedBy: Boolean(description),
      closeOnOutsideClick,
      // Focus the safe choice (Cancel) first.
      initialFocus: ".confirm-dialog__actions button",
      onOpenChange,
    });
    useDialogHandle(ref, dialog);
    const { setOpen } = dialog;

    return (
      <SimpleDialog
        kind="confirm-dialog"
        dialog={dialog}
        triggerVariant={triggerVariant}
        trigger={trigger}
        title={title}
        description={description}
        closeButton={closeButton}
        closeLabel={closeLabel}
        icon={icon}
        actions={
          <ChoiceActions
            cancelLabel={cancelLabel}
            confirmLabel={confirmLabel}
            confirmVariant={confirmVariant}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              onConfirm?.();
              setOpen(false);
            }}
          />
        }
      />
    );
  },
);
