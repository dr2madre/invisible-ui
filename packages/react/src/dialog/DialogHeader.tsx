import type { ReactNode } from "react";

type Props = Record<string, unknown>;

export interface DialogHeaderProps {
  /** Title naming the dialog; always rendered, hidden visually on request. */
  title: string;
  hideTitle?: boolean;
  /** Optional subtitle under the title. */
  subtitle?: string;
  closeButton: boolean;
  /** Accessible name of the close button. */
  closeLabel: string;
  /** Wiring from the dialog's headless API. */
  titleProps: Props;
  subtitleProps?: Props;
  closeProps?: Props;
  icon?: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

/**
 * The header every dialog in the family shares (internal), ported from the
 * Svelte adapter's DialogHeader with identical classes. When nothing in it is
 * visible (a hidden title and no close button), it takes no space and only
 * names the dialog.
 */
export function DialogHeader({
  title,
  hideTitle = false,
  subtitle,
  closeButton,
  closeLabel,
  titleProps,
  subtitleProps,
  closeProps,
  icon,
  lead,
  meta,
  actions,
}: DialogHeaderProps) {
  const empty =
    hideTitle && !closeButton && subtitle === undefined && !icon && !lead && !meta && !actions;

  return (
    <header className={empty ? "dialog-header dialog-header--empty" : "dialog-header"}>
      {icon && <div className="dialog-header__icon">{icon}</div>}
      {lead && <div className="dialog-header__lead">{lead}</div>}
      {/* Consumer content above the title, e.g. "Step 1 of 2". It carries no
          progress semantics of its own. */}
      {meta && <div className="dialog-header__meta">{meta}</div>}
      <h2
        {...titleProps}
        className={
          hideTitle ? "dialog-header__title dialog-header__title--hidden" : "dialog-header__title"
        }
      >
        {title}
      </h2>
      {subtitle !== undefined && (
        <p {...subtitleProps} className="dialog-header__subtitle">
          {subtitle}
        </p>
      )}
      {actions && <div className="dialog-header__actions">{actions}</div>}
      {closeButton && (
        <button
          {...closeProps}
          className="dialog-header__close"
          type="button"
          aria-label={closeLabel}
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
      )}
    </header>
  );
}
