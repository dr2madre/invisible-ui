import type { ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import { useDialog } from "./use-dialog";

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
  /** Leading feedback icon, centered against the title block. */
  icon?: ReactNode;
  /** Leading ghost icon button (e.g. a back affordance). */
  headerLead?: ReactNode;
  /** Trailing action buttons in the footer. */
  footer?: ReactNode;
  /** Show a close/cancel button on the footer's leading edge. */
  footerClose?: boolean;
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
 * Themeable via `--ds-dialog-*`.
 */
export function Dialog({
  triggerVariant = "default",
  trigger,
  open = false,
  title,
  hideTitle = false,
  description,
  closeLabel,
  icon,
  headerLead,
  footer,
  footerClose = false,
  initialFocus,
  closeOnOutsideClick = true,
  onOpenChange,
  children,
}: DialogProps) {
  const { t } = useI18n();
  const { api, open: isOpen, triggerRef, panelRef } = useDialog({
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
          <header className="dialog__header">
            {icon && <div className="dialog__header-icon">{icon}</div>}
            {headerLead && <div className="dialog__header-lead">{headerLead}</div>}

            <h2
              {...api.titleProps}
              className={hideTitle ? "dialog__title dialog__title--hidden" : "dialog__title"}
            >
              {title}
            </h2>

            {description !== undefined && (
              <p {...api.descriptionProps} className="dialog__subtitle">
                {description}
              </p>
            )}

            <button
              {...api.closeProps}
              className="dialog__close"
              type="button"
              aria-label={resolvedCloseLabel}
            >
              <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className="dialog__body">{children}</div>

          {(footer || footerClose) && (
            <footer className="dialog__footer">
              {footerClose && (
                <Button variant="ghost" {...api.closeProps}>
                  {resolvedCloseLabel}
                </Button>
              )}
              {footer && <div className="dialog__footer-actions">{footer}</div>}
            </footer>
          )}
        </dialog>
      )}
    </>
  );
}
