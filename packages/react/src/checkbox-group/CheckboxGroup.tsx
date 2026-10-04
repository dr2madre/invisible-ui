import { useRef } from "react";
import { CheckGlyph, Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { useCheckboxGroup, type CheckboxGroupItem } from "./use-checkbox-group";

export interface CheckboxGroupProps {
  items: CheckboxGroupItem[];
  /** Initial (uncontrolled) or current (controlled) selected values. */
  value?: string[];
  disabled?: boolean;
  /** Accessible name for the group (required; rendered as the legend). */
  label: string;
  /** Shared form field name; each checked item submits its value under it. */
  name?: string;
  /** Called whenever the selected values change. */
  onValueChange?: (value: string[]) => void;
}

/**
 * CheckboxGroup — the styled multi-select checkbox group built on a native
 * `<fieldset>` of `<input type="checkbox">` items. The browser provides the
 * group and checkbox roles, Space activation, focus and form participation;
 * this layer adds the box, the check glyph and the labels.
 *
 * A group `label` is required (rendered as the `<legend>`); each item carries
 * an optional `label` (falls back to `value`). Pass `name` to submit every
 * checked item's value under a shared field. Themeable via `--ds-checkbox-*`.
 */
export function CheckboxGroup({
  items,
  value,
  disabled = false,
  label,
  name,
  onValueChange,
}: CheckboxGroupProps) {
  const rootRef = useRef<HTMLFieldSetElement>(null);
  const api = useCheckboxGroup({ items, value, disabled, name, onValueChange, rootRef });

  return (
    <fieldset ref={rootRef} className="checkbox-group" {...api.rootProps}>
      <legend className="checkbox-group__label">{label}</legend>
      {items.map((item) => (
        <label
          key={item.value}
          className={cx(
            "checkbox-group__item",
            (disabled || item.disabled) && "checkbox-group__item--disabled",
          )}
        >
          <input {...api.getItemProps(item.value)} className="checkbox__input" />
          {/* The standalone Checkbox's box, so `checkbox.css` paints both. */}
          <span className="checkbox" aria-hidden="true">
            <Icon className="checkbox__glyph checkbox__check" size="100%" strokeWidth={3}>
              <CheckGlyph />
            </Icon>
          </span>
          <span className="field__label">{item.label ?? item.value}</span>
        </label>
      ))}
    </fieldset>
  );
}
