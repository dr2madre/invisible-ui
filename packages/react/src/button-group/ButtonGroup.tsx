import { buttonGroup as core } from "@design-system/core";
import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { normalizeProps } from "../normalize";

export type ButtonGroupOrientation = core.Orientation;
export type ButtonGroupAlign = "start" | "center" | "end" | "stretch";

export interface ButtonGroupProps {
  /** Accessible name for the group. */
  label: string;
  orientation?: ButtonGroupOrientation;
  /** Visually merge the buttons into one bar (vs. spacing them apart). */
  attached?: boolean;
  /**
   * Cross-axis alignment of the items. Defaults to `center` so a taller sibling
   * (e.g. a Select with a label) never stretches the buttons; use `end` to line
   * buttons up with a labelled control's input row, or `stretch` for equal heights.
   */
  align?: ButtonGroupAlign;
  /** The buttons. */
  children?: ReactNode;
}

const ALIGN_ITEMS: Record<ButtonGroupAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

/**
 * ButtonGroup: the styled grouping of related action buttons. Semantics (a
 * labelled `role="group"` with an orientation) come from the headless button
 * group (`@design-system/core`); this layer lays the buttons out and, when
 * `attached`, joins them into a single segmented bar by collapsing the inner
 * corners and shared borders.
 *
 * Place `Button`s (or any `<button>`) as children. The group holds no
 * selection: each button stays an independent action and an independent tab
 * stop. Give it an accessible `label`. Spacing is themeable via
 * `--ds-button-group-*`.
 */
export function ButtonGroup({
  label,
  orientation = "horizontal",
  attached = true,
  align = "center",
  children,
}: ButtonGroupProps) {
  const { groupProps } = core.connect({
    state: core.initialState({ label, orientation }),
    normalize: normalizeProps,
  });
  return (
    <div
      {...groupProps}
      className={cx(
        "button-group",
        attached && "button-group--attached",
        orientation === "vertical" && "button-group--vertical",
      )}
      // The shared sheet leaves alignment to the adapter, as the others do.
      style={{ alignItems: ALIGN_ITEMS[align] }}
    >
      {children}
    </div>
  );
}
