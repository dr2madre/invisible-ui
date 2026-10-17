import { toggleGroup as core } from "@invisible-ui/core";
import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "../internal/cx";

export type ToggleGroupVariant = "separate" | "segmented";
export type ToggleGroupOrientation = "horizontal" | "vertical";

export interface ToggleGroupProps {
  /** Visual style. `separate` keeps each toggle's own style; `segmented` joins them. */
  variant?: ToggleGroupVariant;
  /** Layout axis, and the arrow keys that move focus when the group roves. */
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
 * ToggleGroup: arranges independent `ToggleButton` children and gives them a
 * shared look. It carries no selection state of its own: each ToggleButton
 * inside is a standalone on/off control that owns its `pressed` state, label
 * and form field.
 *
 * Keyboard: with three or more toggles the group is one tab stop, and the
 * arrow keys (Left and Right, mirrored in right-to-left text, or Up and Down
 * when vertical) move focus between the enabled toggles, wrapping, with Home
 * and End for the ends. With one or two toggles each is its own tab stop.
 * Inside a `Toolbar` the toolbar's navigation applies and the group adds
 * none. Moving focus never changes a toggle; when the focused toggle is
 * removed, focus goes to its neighbour.
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
  const rootRef = useRef<HTMLDivElement>(null);
  // The axis is read when a key arrives, so a new one needs no new subscription.
  const orientationRef = useRef(orientation);
  useEffect(() => {
    orientationRef.current = orientation;
  }, [orientation]);

  // The keyboard rule, applied once the group is in the page: toggles added,
  // removed or disabled later are followed by the core. Client-only: the
  // server renders no tabindex.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return core.manage(root, { orientation: () => orientationRef.current });
  }, []);

  return (
    <div
      ref={rootRef}
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
