import type { ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { useSwitch } from "./use-switch";

export interface SwitchProps {
  /** Accessible, visible label (required). Override with `children` for rich content. */
  label: string;
  checked?: boolean;
  disabled?: boolean;
  /** Form field name — the value is submitted under it when on. */
  name?: string;
  /** Value submitted with the form when on. Defaults to the native `"on"`. */
  value?: string;
  /** Mark the control required for native form validation. */
  required?: boolean;
  /** Show ON/OFF text inside the track (a wider, labelled variant). */
  onOff?: boolean;
  /** Track text when on / off (only with `onOff`). Defaults to the catalog's "ON" / "OFF". */
  onText?: string;
  offText?: string;
  /** Called whenever the on/off value changes. */
  onCheckedChange?: (checked: boolean) => void;
  children?: ReactNode;
}

/**
 * Switch — the styled switch built on a native
 * `<input type="checkbox" role="switch">`. The browser provides Space
 * activation, focus and form participation; `role="switch"` makes screen
 * readers announce on/off, which is clearer than a checkbox for settings.
 *
 * Prefer this over a checkbox for instant on/off settings. Themeable via
 * `--ds-switch-*`.
 */
export function Switch({
  label,
  checked = false,
  disabled = false,
  name,
  value = "on",
  required = false,
  onOff = false,
  onText,
  offText,
  onCheckedChange,
  children,
}: SwitchProps) {
  const api = useSwitch({ checked, disabled, onCheckedChange });
  const { t } = useI18n();

  return (
    <label className={disabled ? "field field--disabled" : "field"}>
      <input
        {...api.rootProps}
        className="switch__input"
        name={name}
        value={value}
        required={required}
        checked={api.checked}
      />
      <span className={onOff ? "switch switch--onoff" : "switch"} aria-hidden="true">
        {onOff && (
          <>
            <span className="switch__on">{onText ?? t("switch.on")}</span>
            <span className="switch__off">{offText ?? t("switch.off")}</span>
          </>
        )}
      </span>
      <span className="field__label">{children ?? label}</span>
    </label>
  );
}
