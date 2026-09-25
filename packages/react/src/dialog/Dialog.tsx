import type { ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { DialogHeader } from "./DialogHeader";
import { useDialog } from "./use-dialog";

/** How the dialog body spaces its direct children. */
export type DialogBodyLayout = "plain" | "stack";

export interface DialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's content. */
  trigger?: ReactNode;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Accessible title naming the dialog (required). */
  title: string;
  /**
   * Visually hide the title while keeping it as the dialog's accessible name.
   * The title text is always required; this only controls whether it is shown.
   */
  hideTitle?: boolean;
  /** Optional description, wired via `aria-describedby`. */
  description?: string;
  /** Accessible label for the close button. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /** Show the close button at the trailing end of the header. Default `true`. */
  closeButton?: boolean;
  /** Leading feedback icon, centered against the title block. */
  icon?: ReactNode;
  /** Content above the title, e.g. "Step 1 of 2". Carries no progress semantics. */
  headerMeta?: ReactNode;
  /** Leading ghost icon button (e.g. a back affordance). */
  headerLead?: ReactNode;
  /** Actions before the close button, on the title row. */
  headerActions?: ReactNode;
  /** Leading footer actions, e.g. Back. */
  footerLead?: ReactNode;
  /** Trailing action buttons in the footer. */
  footer?: ReactNode;
  /** Show a close/cancel button on the footer's leading edge. */
  footerClose?: boolean;
  /**
   * Body layout. `plain` (the default) leaves the body untouched. `stack`
   * spaces the direct children by `--ds-dialog-body-gap`, which saves a
   * workflow from inventing its own spacing between sections.
   */
  bodyLayout?: DialogBodyLayout;
  /**
   * CSS selector (within the panel) for the element to focus on open. When
   * omitted, focus lands on the panel itself — never on the close button.
   */
  initialFocus?: string;
  /** Whether pressing the backdrop closes. Default `true`. */
  closeOnOutsideClick?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The dialog body. */
  children?: ReactNode;
}

/**
 * Dialog — a styled modal window (WAI-ARIA dialog pattern).
 *
 * Behaviour and accessibility come from the headless dialog
 * (`@design-system/core`); modality comes from the native `<dialog>` element
 * via `showModal()` — top layer, inert background, `::backdrop` (ADR 0005) —
 * with body scroll lock, backdrop light-dismiss and focus management added by
 * the adapter.
 *
 * Layout: a grid panel with a fixed header and footer and a scrolling body.
 * The header is the one the whole dialog family shares; `closeButton` turns
 * its close button off. Themeable via `--ds-dialog-*`.
 */
export function Dialog({
  triggerVariant = "default",
  trigger,
  open = false,
  title,
  hideTitle = false,
  description,
  closeLabel,
  closeButton = true,
  icon,
  headerMeta,
  headerLead,
  headerActions,
  footerLead,
  footer,
  footerClose = false,
  bodyLayout = "plain",
  initialFocus,
  closeOnOutsideClick = true,
  onOpenChange,
  children,
}: DialogProps) {
  const { t } = useI18n();
  const {
    api,
    open: isOpen,
    triggerRef,
    panelRef,
  } = useDialog({
    open,
    describedBy: description !== undefined,
    initialFocus,
    closeOnOutsideClick,
    onOpenChange,
  });

  const resolvedCloseLabel = closeLabel ?? t("dialog.close");

  return (
    <>
      <Button variant={triggerVariant} {...api.triggerProps} ref={triggerRef}>
        {trigger ?? "Open"}
      </Button>

      {isOpen && (
        <dialog {...api.contentProps} ref={panelRef} className="dialog__panel">
          <DialogHeader
            title={title}
            hideTitle={hideTitle}
            subtitle={description}
            closeButton={closeButton}
            closeLabel={resolvedCloseLabel}
            titleProps={api.titleProps}
            subtitleProps={api.descriptionProps}
            closeProps={api.closeProps}
            icon={icon}
            lead={headerLead}
            meta={headerMeta}
            actions={headerActions}
          />

          <div className="dialog__body" data-layout={bodyLayout}>
            {children}
          </div>

          {/* One action bar: the leading group first, so source order matches
              focus order, then the trailing group. */}
          {(footer || footerLead || footerClose) && (
            <footer className="dialog__footer">
              {(footerLead || footerClose) && (
                <div className="dialog__footer-lead">
                  {footerLead}
                  {footerClose && (
                    <Button variant="ghost" {...api.closeProps}>
                      {resolvedCloseLabel}
                    </Button>
                  )}
                </div>
              )}
              {footer && <div className="dialog__footer-actions">{footer}</div>}
            </footer>
          )}
        </dialog>
      )}
    </>
  );
}
