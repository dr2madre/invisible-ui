import { forwardRef, type ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { SimpleDialog } from "../dialog/SimpleDialog";
import { useDialog } from "../dialog/use-dialog";
import { useDialogHandle, type DialogHandle } from "../dialog/use-dialog-handle";
import { useI18n } from "../i18n/i18n";

export interface AlertDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's content. Defaults to the catalog's "Open". */
  trigger?: ReactNode;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Accessible title naming the alert (required). */
  title: string;
  /** The message to acknowledge (required). */
  description: string;
  /**
   * Label of the single acknowledging button. Defaults to the catalog's "OK";
   * prefer naming the outcome in context ("Done", "Close", "I understood").
   */
  dismissLabel?: string;
  /** Called when the alert is acknowledged (button, Escape or backdrop). */
  onDismiss?: () => void;
  /**
   * Whether pressing the backdrop acknowledges and closes. Defaults to `true`;
   * set `false` to require an explicit button press (e.g. "I understood").
   */
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
 * AlertDialog: a styled modal acknowledgement, the accessible equivalent of
 * `window.alert()` (the platform's first "simple dialog", per ADR 0005). It
 * interrupts to communicate an important message (`role="alertdialog"`, so
 * screen readers announce it immediately), and there is nothing to cancel:
 * one button takes note and closes. Escape and a backdrop press are
 * equivalent to the button, and `onDismiss` runs for all three.
 *
 * It runs on `useDialog`: native `<dialog>` + `showModal()`, scroll lock,
 * focus restore. A `title` and `description` are both required. For a choice
 * that can stop a process use `ConfirmDialog`; to ask for a value use
 * `PromptDialog`. Themeable via `--ds-dialog-*`.
 *
 * A ref holds the status area (ADR 0016), with the same contract as `Dialog`:
 * `notify(options)`, `dismissNotice(id)` and `clearNotices()`.
 */
// Marked pure, so an import of another component leaves this one out.
export const AlertDialog = /* @__PURE__ */ forwardRef<DialogHandle, AlertDialogProps>(
  function AlertDialog(
    {
      triggerVariant = "default",
      trigger,
      open = false,
      title,
      description,
      dismissLabel,
      onDismiss,
      closeOnOutsideClick = true,
      closeButton = false,
      closeLabel,
      icon,
      onOpenChange,
    },
    ref,
  ) {
    const { t } = useI18n();
    const dialog = useDialog({
      open,
      role: "alertdialog",
      describedBy: true,
      closeOnOutsideClick,
      // Focus the only action: taking note.
      initialFocus: ".alert-dialog__actions button",
      onOpenChange: (next) => {
        onOpenChange?.(next);
        // Every way of closing an acknowledgement is the acknowledgement.
        if (!next) onDismiss?.();
      },
    });
    useDialogHandle(ref, dialog);
    const { setOpen } = dialog;

    return (
      <SimpleDialog
        kind="alert-dialog"
        dialog={dialog}
        triggerVariant={triggerVariant}
        trigger={trigger}
        title={title}
        description={description}
        closeButton={closeButton}
        closeLabel={closeLabel}
        icon={icon}
        actions={
          <Button variant="primary" onPress={() => setOpen(false)}>
            {dismissLabel ?? t("dialog.dismiss")}
          </Button>
        }
      />
    );
  },
);
