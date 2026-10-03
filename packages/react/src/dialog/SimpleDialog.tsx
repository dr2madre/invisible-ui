import type { ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { DialogHeader } from "./DialogHeader";
import { DialogStatus } from "./DialogStatus";
import type { UseDialog } from "./use-dialog";

/** The class prefix of each simple dialog; its stylesheet is named after it. */
export type SimpleDialogKind = "alert-dialog" | "confirm-dialog" | "prompt-dialog";

interface SimpleDialogProps {
  kind: SimpleDialogKind;
  dialog: UseDialog;
  triggerVariant?: ButtonVariant;
  trigger?: ReactNode;
  title: string;
  description?: string;
  closeButton?: boolean;
  closeLabel?: string;
  icon?: ReactNode;
  /** Content between the description and the status area (the prompt's field). */
  children?: ReactNode;
  /** The footer's buttons, in focus order. */
  actions: ReactNode;
}

/**
 * The shell the Alert, Confirm and Prompt dialogs share (internal), ported
 * from the Svelte adapter with identical classes: the trigger, then, while
 * open, a native `<dialog>` with the family's header, the description, the
 * preset's own content, the status area (ADR 0016) and the actions. The
 * presets own their state and buttons; this renders the markup around them.
 */
export function SimpleDialog({
  kind,
  dialog,
  triggerVariant = "default",
  trigger,
  title,
  description,
  closeButton = false,
  closeLabel,
  icon,
  children,
  actions,
}: SimpleDialogProps) {
  const { t } = useI18n();
  const { api, open, triggerRef, panelRef } = dialog;

  return (
    <>
      <Button variant={triggerVariant} {...api.triggerProps} ref={triggerRef}>
        {trigger ?? t("dialog.trigger")}
      </Button>

      {open ? (
        <dialog {...api.contentProps} ref={panelRef} className={`${kind}__panel`}>
          <DialogHeader
            title={title}
            closeButton={closeButton}
            closeLabel={closeLabel ?? t("dialog.close")}
            titleProps={api.titleProps}
            closeProps={api.closeProps}
            icon={icon}
          />
          {description ? (
            <p {...api.descriptionProps} className={`${kind}__description`}>
              {description}
            </p>
          ) : null}
          {children}
          <DialogStatus {...dialog} />
          <footer className={`${kind}__actions`}>{actions}</footer>
        </dialog>
      ) : null}
    </>
  );
}

interface ChoiceActionsProps {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant: ButtonVariant;
  /** The confirm button waits for a valid value (the prompt's gate). */
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Cancel, then confirm (internal): the actions Confirm and Prompt share, with
 * the catalog's labels as defaults. Cancel comes first in focus order, as the
 * safe choice the dialog focuses on open.
 */
export function ChoiceActions({
  cancelLabel,
  confirmLabel,
  confirmVariant,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: ChoiceActionsProps) {
  const { t } = useI18n();
  return (
    <>
      <Button variant="ghost" onPress={onCancel}>
        {cancelLabel ?? t("dialog.cancel")}
      </Button>
      <Button variant={confirmVariant} disabled={confirmDisabled} onPress={onConfirm}>
        {confirmLabel ?? t("dialog.confirm")}
      </Button>
    </>
  );
}
