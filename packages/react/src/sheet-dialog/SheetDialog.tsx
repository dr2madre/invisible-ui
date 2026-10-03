import { forwardRef, type ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { DialogHeader } from "../dialog/DialogHeader";
import { DialogStatus } from "../dialog/DialogStatus";
import { useDialogHandle, type DialogHandle } from "../dialog/use-dialog-handle";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";
import { useSheetDialog, type SheetDialogSide } from "./use-sheet-dialog";

export interface SheetDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's content. Defaults to the catalog's "Open". */
  trigger?: ReactNode;
  /**
   * Whether this component renders its own trigger button. Turn it off when
   * the button belongs somewhere this panel cannot reach, an application
   * header for instance: drive `open` yourself and name `returnFocusTo`, since
   * there is no trigger left for focus to go back to (ADR 0013).
   */
  renderTrigger?: boolean;
  /** CSS selector for the element focus returns to when there is no trigger. */
  returnFocusTo?: string;
  /** Which edge the panel is anchored to. */
  side?: SheetDialogSide;
  /**
   * Show a grab handle and enable the drag-to-dismiss gesture. Available on the
   * bottom and lateral sides (ignored on `side="top"`).
   */
  draggable?: boolean;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Accessible title naming the panel (required). */
  title: string;
  /** Optional description, wired via `aria-describedby`. */
  description?: string;
  /** Accessible label for the close button. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /** Show the close button at the trailing end of the header. */
  closeButton?: boolean;
  /**
   * CSS selector (within the panel) for the element to focus on open, e.g.
   * `"input"` to land on a form's first field.
   */
  initialFocus?: string;
  /** Leading feedback icon in the header. */
  icon?: ReactNode;
  /** Leading ghost button in the header, e.g. back. */
  headerLead?: ReactNode;
  /** Actions before the close button. */
  headerActions?: ReactNode;
  /** Footer actions. */
  footer?: ReactNode;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** The body. */
  children?: ReactNode;
}

/**
 * SheetDialog: a Dialog anchored to an edge of the viewport (the panel
 * pattern also called "side panel" or "drawer"). It is a dialog in every
 * sense: it runs on `useDialog`, so it keeps the native `<dialog>` +
 * `showModal()` (top layer, inert background), scroll lock, Escape, backdrop
 * and close-button dismissal, and focus restore.
 *
 * Over `Dialog` it adds edge anchoring (`side`), a slide-in animation and an
 * optional drag-to-dismiss gesture (`draggable`, on the bottom and lateral
 * sides): a grab handle the user can drag past a distance or velocity
 * threshold to close; anything less snaps home. The handle is a pointer
 * affordance, so keyboard users close with Escape or the close button.
 *
 * The regions are props: `trigger`, `children` (the body), `footer`, and the
 * header regions the dialog family shares: `icon`, `headerLead` and
 * `headerActions`. `description` shows as the subtitle. Themeable via
 * `--ds-dialog-*`; the panel extent via `--ds-sheet-dialog-size`.
 *
 * A ref holds the status area between the body and the footer (ADR 0016),
 * with the same contract as `Dialog`: `notify(options)`, `dismissNotice(id)`
 * and `clearNotices()`. Closing returns focus to `returnFocusTo` when it is
 * set, else to the element that had focus when the sheet opened, else to the
 * trigger.
 */
// Marked pure, so an import of another component leaves this one out.
export const SheetDialog = /* @__PURE__ */ forwardRef<DialogHandle, SheetDialogProps>(
  function SheetDialog(
    {
      triggerVariant = "default",
      trigger,
      renderTrigger = true,
      returnFocusTo,
      side = "right",
      draggable = false,
      open = false,
      title,
      description,
      closeLabel,
      closeButton = true,
      initialFocus,
      icon,
      headerLead,
      headerActions,
      footer,
      onOpenChange,
      children,
    },
    ref,
  ) {
    const { t } = useI18n();
    const sheet = useSheetDialog({
      open,
      side,
      describedBy: description !== undefined,
      initialFocus,
      returnFocusTo,
      onOpenChange,
    });
    useDialogHandle(ref, sheet);
    const { api, open: isOpen, triggerRef, panelRef, dragging, onHandlePointerDown } = sheet;

    return (
      <>
        {renderTrigger ? (
          <Button variant={triggerVariant} {...api.triggerProps} ref={triggerRef}>
            {trigger ?? t("dialog.trigger")}
          </Button>
        ) : null}

        {isOpen ? (
          <dialog
            {...api.contentProps}
            ref={panelRef}
            className={cx("sheet-dialog__panel", dragging && "sheet-dialog__panel--dragging")}
            data-side={side}
          >
            {draggable && side !== "top" ? (
              <div
                className="sheet-dialog__handle"
                aria-hidden="true"
                onPointerDown={onHandlePointerDown}
              />
            ) : null}
            <DialogHeader
              title={title}
              subtitle={description}
              closeButton={closeButton}
              closeLabel={closeLabel ?? t("sheetDialog.close")}
              titleProps={api.titleProps}
              subtitleProps={api.descriptionProps}
              closeProps={api.closeProps}
              icon={icon}
              lead={headerLead}
              actions={headerActions}
            />
            <div className="sheet-dialog__body">{children}</div>
            <DialogStatus {...sheet} />
            {footer ? <footer className="sheet-dialog__footer">{footer}</footer> : null}
          </dialog>
        ) : null}
      </>
    );
  },
);
