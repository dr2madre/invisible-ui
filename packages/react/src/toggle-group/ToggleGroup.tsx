import type { ReactNode } from "react";
import { cx } from "../internal/cx";

export type ToggleGroupVariant = "separate" | "segmented";
export type ToggleGroupOrientation = "horizontal" | "vertical";

export interface ToggleGroupProps {
  /** Visual style. `separate` keeps each toggle's own style; `segmented` joins them. */
  variant?: ToggleGroupVariant;
  /** Layout axis. Purely visual: the group has no keyboard navigation of its own. */
  orientation?: ToggleGroupOrientation;
  /**
   * Let the toggles wrap onto multiple lines when they overflow the available
   * width (e.g. a row of filter chips in a narrow panel). Meaningful on a
   * horizontal `separate` group; ignored when `segmented`, which is one control.
   */
  wrap?: boolean;
  /**
   * Optional container name for screen readers (the group's `aria-label`). It
   * names the container, not the items; omit it when the toggles are unrelated.
   */
  label?: string;
  /** The `ToggleButton`s. */
  children?: ReactNode;
}

/**
 * ToggleGroup — a visual wrapper that arranges independent `ToggleButton`
 * children and gives them a shared look. It carries no selection state of its
 * own: each ToggleButton inside is a standalone on/off control that owns its
 * `pressed` state, label and form field.
 *
 * `separate` (default) keeps each toggle's style, spaced by a gap; `segmented`
 * joins them into one control with a single outer border and thin dividers.
 * The group is a `role="group"`, named by the optional `label`. Themeable via
 * `--ds-toggle-group-*`.
 */
export function ToggleGroup({
  variant = "separate",
  orientation = "horizontal",
  wrap = false,
  label,
  children,
}: ToggleGroupProps) {
  return (
    <div
      className={cx(
        "toggle-group",
        `toggle-group--${variant}`,
        wrap && variant === "separate" && "toggle-group--wrap",
      )}
      role="group"
      aria-label={label}
      data-orientation={orientation}
    >
      {children}
    </div>
  );
}
