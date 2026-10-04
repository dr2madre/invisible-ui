import { useId, useRef } from "react";
import { cx } from "../internal/cx";
import { useRadioGroup, type RadioGroupOrientation, type RadioItem } from "./use-radio-group";

/** An item, with an optional display label (falls back to `value`). */
export type RadioGroupItem = RadioItem & { label?: string };

export interface RadioGroupProps {
  items: RadioGroupItem[];
  /** Initial (uncontrolled) or current (controlled) selected value. */
  value?: string | null;
  disabled?: boolean;
  /** Layout and arrow-key axis. Defaults to `vertical`. */
  orientation?: RadioGroupOrientation;
  /** Accessible name for the group (announced by screen readers). */
  label: string;
  /** Form field name; the selected value is submitted under it. */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}

/**
 * RadioGroup — the styled radio group built on native `<input type="radio">`
 * items sharing a `name`. The browser provides single selection, roving
 * tabindex, arrow-key navigation, focus and form participation (the selected
 * value is submitted under `name`); this layer adds the dot indicator and a
 * vertical or horizontal layout.
 *
 * Items may carry an optional `label`; the `value` is used when omitted. The
 * group needs an accessible name via `label`. Colors are themeable via
 * `--ds-radio-*`.
 */
export function RadioGroup({
  items,
  value = null,
  disabled = false,
  orientation = "vertical",
  label,
  name,
  onValueChange,
}: RadioGroupProps) {
  const labelId = `ds-radio-group-${useId()}-label`;
  const rootRef = useRef<HTMLDivElement>(null);
  const api = useRadioGroup({ items, value, disabled, orientation, name, onValueChange, rootRef });

  return (
    <div className="radio-field">
      <span className="radio-field__label" id={labelId}>
        {label}
      </span>
      <div ref={rootRef} className="radio-group" {...api.rootProps} aria-labelledby={labelId}>
        {items.map((item) => (
          <label
            key={item.value}
            className={cx("radio", (disabled || item.disabled) && "radio--disabled")}
          >
            <input {...api.getItemProps(item.value)} className="radio__input" />
            <span className="radio__dot" aria-hidden="true" />
            <span className="radio__label">{item.label ?? item.value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
