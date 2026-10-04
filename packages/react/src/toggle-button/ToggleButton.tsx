import { useRef, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { useToggleButton } from "./use-toggle-button";

export interface ToggleButtonProps {
  /**
   * Whether the button is pressed: the initial value, or the current one when
   * it changes between renders (e.g. a filter chip driven by a list).
   */
  pressed?: boolean;
  disabled?: boolean;
  /**
   * Show a leading checkmark when pressed (the filter-chip look). The check
   * reveals the selected state explicitly, the way a checkbox does.
   */
  check?: boolean;
  /** Accessible name; required when the content is icon-only. */
  label?: string;
  /** Form field name; when pressed, submits `value` under it. */
  name?: string;
  /** Value submitted under `name` when pressed. */
  value?: string;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
  /** The button's content. */
  children?: ReactNode;
}

const CHECK = (
  <svg
    className="toggle__check"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * ToggleButton — an independent on/off control (e.g. Bold in a toolbar), built
 * on a native `<input type="checkbox">` styled to look like a button. The
 * browser owns the checkbox role, Space activation, focus and form
 * participation; this layer adds the button surface and the on/off styling.
 *
 * Use `Switch` for a settings-style on/off control. Provide `label` when the
 * content is icon-only, so the control keeps an accessible name. Set `check`
 * for the filter-chip look. Themeable via `--ds-toggle-*`.
 */
export function ToggleButton({
  pressed = false,
  disabled = false,
  check = false,
  label,
  name,
  value = "on",
  onPressedChange,
  children,
}: ToggleButtonProps) {
  const ref = useRef<HTMLInputElement>(null);
  const api = useToggleButton({ pressed, disabled, onPressedChange, controlRef: ref });

  return (
    <label className={cx("toggle", disabled && "toggle--disabled")}>
      <input
        {...api.rootProps}
        ref={ref}
        className="toggle__input"
        checked={api.pressed}
        name={name}
        value={value}
        aria-label={label}
      />
      <span className="toggle__surface">
        {check && api.pressed ? CHECK : null}
        {children}
      </span>
    </label>
  );
}
