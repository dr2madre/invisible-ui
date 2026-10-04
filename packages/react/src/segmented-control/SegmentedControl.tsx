import { useId, useRef, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { useRadioGroup, type RadioItem } from "../radio-group/use-radio-group";

/**
 * A segment, with an optional display `label` (falls back to `value`) and an
 * optional decorative `icon` (any element, e.g. an `<Icon>`).
 */
export type SegmentedControlItem = RadioItem & { label?: string; icon?: ReactNode };

export type SegmentedControlOrientation = "horizontal" | "vertical";

export interface SegmentedControlProps {
  items: SegmentedControlItem[];
  /** Initial (uncontrolled) or current (controlled) selected value. */
  value?: string | null;
  disabled?: boolean;
  /**
   * Layout and arrow-key axis. `horizontal` (default) is a segment bar;
   * `vertical` stacks the segments into a column (e.g. a sidebar). Each
   * segment's content stays a row (icon beside label) unless `stacked` is set.
   */
  orientation?: SegmentedControlOrientation;
  /**
   * Render only the icon for each segment, hiding the visible label (the label
   * still names the segment via `aria-label`). Items without an icon keep their
   * text.
   */
  iconOnly?: boolean;
  /**
   * Stack each segment's content vertically: icon on top, label below (e.g. an
   * iOS-style tab). Implies the label stays visible.
   */
  stacked?: boolean;
  /** Accessible name for the control (announced by screen readers). */
  label: string;
  /** Visually hide the label (kept for assistive tech). */
  hideLabel?: boolean;
  /** Form field name; the selected value is submitted under it. */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

/**
 * SegmentedControl — a single-select group built on native
 * `<input type="radio">` items sharing a `name`, laid out as a horizontal (or
 * vertical) bar of segments. The browser provides single selection, roving
 * tabindex, arrow-key navigation, focus and form participation.
 *
 * Items may carry an optional `label`; the `value` is used when omitted. The
 * control needs an accessible name via `label`. Colors are themeable via
 * `--ds-segment-*`.
 */
export function SegmentedControl({
  items,
  value = null,
  disabled = false,
  orientation = "horizontal",
  iconOnly = false,
  stacked = false,
  label,
  hideLabel = false,
  name,
  onValueChange,
}: SegmentedControlProps) {
  const labelId = `ds-segmented-${useId()}-label`;
  const rootRef = useRef<HTMLDivElement>(null);
  const api = useRadioGroup({ items, value, disabled, orientation, name, onValueChange, rootRef });

  return (
    <div className="segmented-field">
      <span
        className={cx("segmented-field__label", hideLabel && "segmented-field__label--hidden")}
        id={labelId}
      >
        {label}
      </span>
      <div
        ref={rootRef}
        {...api.rootProps}
        className={cx("segmented", orientation === "vertical" && "segmented--vertical")}
        aria-labelledby={labelId}
      >
        {items.map((item) => {
          const showLabel = stacked || !iconOnly || !item.icon;
          const text = item.label ?? item.value;
          return (
            <label
              key={item.value}
              className={cx(
                "segment",
                !showLabel && "segment--icon-only",
                stacked && "segment--stacked",
                (disabled || item.disabled) && "segment--disabled",
              )}
            >
              <input
                {...api.getItemProps(item.value)}
                className="segment__input"
                aria-label={showLabel ? undefined : text}
              />
              {item.icon ? (
                <span className="segment__icon" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              {showLabel ? <span className="segment__label">{text}</span> : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
