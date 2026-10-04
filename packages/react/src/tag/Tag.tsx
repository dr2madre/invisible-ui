import type { ReactNode } from "react";
import { useI18n } from "../i18n/i18n";

export type TagStatus = "neutral" | "info" | "success" | "warning" | "danger" | "selected";

export interface TagProps {
  /** Status colour. */
  status?: TagStatus;
  /** A soft tinted surface (default) or a solid, filled chip. */
  variant?: "soft" | "solid";
  size?: "sm" | "md";
  /** Render a remove button. */
  removable?: boolean;
  /** Name of the remove button. Defaults to the catalog's "Remove". */
  removeLabel?: string;
  /** Called when the remove button is pressed. */
  onRemove?: () => void;
  /** Decorative leading icon. */
  icon?: ReactNode;
  /** Trailing content, such as a `Count`. */
  trailing?: ReactNode;
  /** The tag text. */
  children?: ReactNode;
}

const REMOVE_GLYPH = (
  <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
    <path
      d="M4 4l8 8M12 4l-8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Tag: a small coloured chip that labels or sorts content. It carries a
 * status colour, its text, an optional leading `icon` and `trailing` content
 * (a `Count`, for example), and can be removable.
 *
 * Distinct from `Label`, the form label, and from `Count`, which a Tag may
 * hold.
 *
 * Accessibility: the chip is presentational and its meaning is its text, so
 * the status never rests on colour alone. The remove button is named by
 * `removeLabel` and its glyph is decorative.
 *
 * Colours are themeable (`--ds-tag-*`), falling back to the status tokens.
 */
export function Tag({
  status = "neutral",
  variant = "soft",
  size = "md",
  removable = false,
  removeLabel,
  onRemove,
  icon,
  trailing,
  children,
}: TagProps) {
  const { t } = useI18n();
  return (
    <span className="tag" data-status={status} data-variant={variant} data-size={size}>
      {icon ? (
        <span className="tag__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="tag__label">{children}</span>
      {trailing ? <span className="tag__trailing">{trailing}</span> : null}
      {removable ? (
        <button
          type="button"
          className="tag__remove"
          aria-label={removeLabel ?? t("tag.remove")}
          onClick={() => onRemove?.()}
        >
          {REMOVE_GLYPH}
        </button>
      ) : null}
    </span>
  );
}
