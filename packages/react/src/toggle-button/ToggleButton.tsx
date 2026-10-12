import { useRef, type ReactNode } from "react";
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
  /** Form field name; while pressed, `value` is submitted under it. */
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
 * ToggleButton: an independent on/off control (e.g. Bold in a toolbar), a
 * native `<button type="button">` carrying `aria-pressed` (WAI-ARIA button
 * pattern). The browser owns the button role, focus, and Enter and Space
 * activation. The accessible name never changes with the state; only
 * `aria-pressed` does.
 *
 * Form participation is provisional: while pressed and enabled, a hidden
 * input submits `value` under `name`, and a reset of the owning form puts the
 * default pressed value back without calling `onPressedChange`.
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
  const ref = useRef<HTMLButtonElement>(null);
  const api = useToggleButton({ pressed, disabled, onPressedChange, controlRef: ref });
  const hidden = api.getHiddenInputProps({ name, value });

  return (
    <button {...api.rootProps} ref={ref} className="toggle" aria-label={label}>
      <span className="toggle__surface">
        {check && api.pressed ? CHECK : null}
        {children}
      </span>
      {hidden ? <input {...hidden} /> : null}
    </button>
  );
}
