import type { ReactNode } from "react";
import { HazardGlyph, Icon, PlusGlyph } from "../icon/Icon";
import { useButton, type ButtonVariant } from "./use-button";

export interface ButtonProps {
  /**
   * Semantic variant, surfaced as `data-variant`:
   * `default` (baseline) · `primary` (the action that moves the flow forward) ·
   * `secondary` (alternative emphasized action) · `ghost` (low emphasis) ·
   * `danger` (destructive — shows a hazard icon so meaning never rests on
   * colour alone, WCAG 1.4.1).
   */
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  /** Called when the button is activated. */
  onPress?: (event: Event) => void;
  /** Show a leading icon. Defaults on for `danger` (the hazard cue). */
  leftIcon?: boolean;
  /** Show a trailing icon. */
  rightIcon?: boolean;
  /** Replace the built-in leading glyph. */
  left?: ReactNode;
  /** Replace the built-in trailing glyph. */
  right?: ReactNode;
  /**
   * Icon-only button: square, no text — pass a single icon as `children` and an
   * `ariaLabel`.
   */
  iconOnly?: boolean;
  /**
   * Accessible name. Required for icon-only buttons; for buttons with visible
   * text the text is the name and this is unnecessary.
   */
  ariaLabel?: string;
  children?: ReactNode;
}

/**
 * Button — the styled, batteries-included button. Behaviour and accessibility
 * come from the headless Button (`@design-system/core`); this layer adds the
 * semantic variants and icon affordances.
 *
 * Colours and sizing are themeable via `--ds-button-*`.
 */
export function Button({
  variant = "default",
  disabled = false,
  type = "button",
  onPress,
  leftIcon,
  rightIcon = false,
  left,
  right,
  iconOnly = false,
  ariaLabel,
  children,
}: ButtonProps) {
  const api = useButton({ variant, disabled, type, onPress });

  // Icon-only buttons carry their single glyph as children, so they never get
  // the automatic leading/trailing icon (which would double up with it).
  const showLeft = !iconOnly && ((leftIcon ?? variant === "danger") || left != null);
  const showRight = !iconOnly && (rightIcon || right != null);

  if (import.meta.env?.DEV && !ariaLabel && (iconOnly || children == null)) {
    console.warn(
      "[ds] Button has no accessible name: provide visible text (children) or an `ariaLabel` for icon-only buttons.",
    );
  }

  return (
    <button
      {...api.rootProps}
      className={iconOnly ? "button button--icon-only" : "button"}
      aria-label={ariaLabel}
    >
      {showLeft && (
        <span className="button__icon">
          {left ?? <Icon>{variant === "danger" ? <HazardGlyph /> : <PlusGlyph />}</Icon>}
        </span>
      )}

      {children}

      {showRight && (
        <span className="button__icon">
          {right ?? (
            <Icon>
              <PlusGlyph />
            </Icon>
          )}
        </span>
      )}
    </button>
  );
}
