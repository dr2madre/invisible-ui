import { forwardRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { ButtonVariant } from "../button/use-button";
import { ChoiceActions, SimpleDialog } from "../dialog/SimpleDialog";
import { useDialog } from "../dialog/use-dialog";
import { useDialogHandle, type DialogHandle } from "../dialog/use-dialog-handle";
import { useOpening } from "../internal/opening";

export interface PromptDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's content. Defaults to the catalog's "Open". */
  trigger?: ReactNode;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Accessible title (required). */
  title: string;
  /** Optional supporting message shown under the title. */
  description?: string;
  /** Visible label for the input. */
  label: string;
  /** Initial value the input is seeded with on each open. */
  value?: string;
  placeholder?: string;
  /** Require a non-empty value: the confirm button stays disabled while blank. */
  required?: boolean;
  /**
   * Type-to-confirm: when set, the confirm button stays disabled until the
   * input matches this exact value, e.g. typing a file name to confirm its
   * deletion.
   */
  confirmValue?: string;
  /** Label of the confirming button; prefer naming the outcome ("Rename"). */
  confirmLabel?: string;
  /** Label of the cancelling button (also the Escape action). */
  cancelLabel?: string;
  /** Variant of the confirm button (`"danger"` for a destructive confirm). */
  confirmVariant?: ButtonVariant;
  /**
   * Interrupting urgency: switches the panel to `role="alertdialog"`, which
   * screen readers announce immediately. Nothing else changes (ADR 0005).
   */
  urgent?: boolean;
  /** Called with the entered value when confirmed (before the dialog closes). */
  onConfirm?: (value: string) => void;
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
 * PromptDialog: a styled modal that asks the user for a single value, the
 * accessible equivalent of `window.prompt()` (a platform "simple dialog", per
 * ADR 0005): everything ConfirmDialog has, plus a text input, focused on open
 * and seeded with `value` on each opening. The value is optional by default;
 * `required` makes it mandatory, `confirmValue` turns it into a
 * type-to-confirm gate, `urgent` switches to `role="alertdialog"` when the ask
 * must interrupt. `onConfirm(value)` runs with the entered text; Enter in the
 * field confirms too.
 *
 * It runs on `useDialog`: native `<dialog>` + `showModal()`, scroll lock,
 * focus restore. Themeable via `--ds-dialog-*`.
 *
 * A ref holds the status area (ADR 0016), with the same contract as `Dialog`:
 * `notify(options)`, `dismissNotice(id)` and `clearNotices()`.
 */
// Marked pure, so an import of another component leaves this one out.
export const PromptDialog = /* @__PURE__ */ forwardRef<DialogHandle, PromptDialogProps>(
  function PromptDialog(
    {
      triggerVariant = "default",
      trigger,
      open = false,
      title,
      description,
      label,
      value = "",
      placeholder = "",
      required = false,
      confirmValue,
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
      initialFocus: ".prompt-dialog__input",
      onOpenChange,
    });
    useDialogHandle(ref, dialog);
    const { open: isOpen, setOpen } = dialog;

    // Each opening starts from `value`.
    const [current, setCurrent] = useState(value);
    const opening = useOpening(isOpen);
    if (opening) setCurrent(value);

    const canConfirm =
      confirmValue != null ? current === confirmValue : !required || current.trim().length > 0;

    const confirm = () => {
      if (!canConfirm) return;
      onConfirm?.(current);
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      confirm();
    };

    return (
      <SimpleDialog
        kind="prompt-dialog"
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
            confirmDisabled={!canConfirm}
            onCancel={() => setOpen(false)}
            onConfirm={confirm}
          />
        }
      >
        <label className="prompt-dialog__field">
          <span className="prompt-dialog__label">{label}</span>
          <input
            className="prompt-dialog__input"
            type="text"
            autoComplete="off"
            placeholder={placeholder}
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
      </SimpleDialog>
    );
  },
);
