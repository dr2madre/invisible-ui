import { useRef, type ReactNode } from "react";
import { Icon } from "../icon/Icon";
import { useDomProps } from "../use-dom-props";
import { useCheckbox, type CheckedState } from "./use-checkbox";

export interface CheckboxProps {
  /** Accessible, visible label (required). Override with `children` for rich content. */
  label: string;
  checked?: CheckedState;
  disabled?: boolean;
  /** Form field name — the value is submitted under it when checked. */
  name?: string;
  /** Value submitted with the form when checked. Defaults to the native `"on"`. */
  value?: string;
  /** Mark the control required for native form validation. */
  required?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: CheckedState) => void;
  children?: ReactNode;
}

/**
 * Checkbox — the styled checkbox built on a **native** `<input type="checkbox">`.
 * The browser provides the checkbox role, Space activation, focus and form
 * participation; this layer adds the box, the check / dash glyphs and the
 * visible label, and keeps the tri-state model
 * (`true` / `false` / `"indeterminate"`).
 *
 * The input is wrapped in a `<label>`, so pressing the box or the text toggles
 * it with no extra wiring. Themeable via `--ds-checkbox-*`.
 */
export function Checkbox({
  label,
  checked = false,
  disabled = false,
  name,
  value = "on",
  required = false,
  onCheckedChange,
  children,
}: CheckboxProps) {
  const api = useCheckbox({ checked, disabled, onCheckedChange });
  const ref = useRef<HTMLInputElement>(null);

  // Properties HTML has no attribute for (here: `indeterminate`) are declared
  // by the core and applied generically — nothing component-specific here.
  useDomProps(ref, api.rootDomProps);

  return (
    <label className={disabled ? "field field--disabled" : "field"}>
      <input
        {...api.rootProps}
        ref={ref}
        className="checkbox__input"
        name={name}
        value={value}
        required={required}
        checked={api.checked === true}
      />
      <span className="checkbox" aria-hidden="true">
        <Icon className="checkbox__glyph checkbox__check" size="100%" strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </Icon>
        <Icon className="checkbox__glyph checkbox__dash" size="100%" strokeWidth={3}>
          <line x1="5" y1="12" x2="19" y2="12" />
        </Icon>
      </span>
      <span className="field__label">{children ?? label}</span>
    </label>
  );
}
