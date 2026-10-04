import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/i18n";
import { CloseGlyph, Icon } from "../icon/Icon";
import { usePopover } from "../popover/use-popover";
import { cx } from "./cx";
import { usePortalHost } from "./portal-host";

export interface PickerFieldProps {
  /** Holds the form-reset anchor of the picker that renders the field. */
  rootRef: RefObject<HTMLDivElement | null>;
  label: string;
  placeholder: string;
  clearLabel: string;
  /** The value as the field shows it, formatted for the locale. */
  text: string;
  /** Whether a date is chosen (drives the icon). */
  active: boolean;
  /** Whether the clear button shows while the field is enabled. */
  clearable: boolean;
  disabled: boolean;
  inputClass?: string;
  popupClass?: string;
  /** The values a form submits, one hidden input per named entry. */
  fields: { name: string | undefined; value: string | null }[];
  /** Empty the value, as the user asked, and report it. */
  onClear: () => void;
  /** The calendar; `done` closes the popup and puts focus back on the field. */
  children: (done: () => void) => ReactNode;
}

/** The calendar's focused day takes focus when the popup opens. */
const FOCUSED_DAY = '[data-date][tabindex="0"]';

/** A readonly field gets no click from the keyboard, so these keys open it. */
const OPEN_KEYS = new Set(["Enter", " ", "ArrowDown"]);

/**
 * The field and popup DatePicker and DateRangePicker share: a readonly
 * combobox that opens a calendar in a dialog popup (the headless popover),
 * positioned against the field. A click, Enter, Space or ArrowDown opens it,
 * and focus moves to the calendar's focused day. A pick that finishes the
 * value and Escape close it with focus back on the field; a press outside, or
 * focus leaving both parts, closes it in place. Inside a dialog the popup
 * renders in the dialog (ADR 0016).
 */
export function PickerField({
  rootRef,
  label,
  placeholder,
  clearLabel,
  text,
  active,
  clearable,
  disabled,
  inputClass,
  popupClass,
  fields,
  onClear,
  children,
}: PickerFieldProps) {
  const { locale, dir } = useI18n();
  const { api, open, setOpen, triggerRef, panelRef } = usePopover<HTMLInputElement>({
    placement: "bottom-start",
    label,
    initialFocus: FOCUSED_DAY,
  });
  const host = usePortalHost(triggerRef);
  // A control turned off shows no popup: nothing on the page answers it.
  const shown = open && !disabled;

  // Found by id, so the calendar can be handed this while rendering.
  const triggerId = api.triggerProps.id as string;
  const done = () => {
    setOpen(false);
    document.getElementById(triggerId)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!OPEN_KEYS.has(event.key) || shown || disabled) return;
    event.preventDefault();
    setOpen(true);
  };

  return (
    <div ref={rootRef} className={cx("date-picker", disabled && "date-picker--disabled")}>
      {fields.map(({ name, value }) =>
        name ? (
          <input
            key={name}
            type="hidden"
            name={name}
            value={value ?? ""}
            // A disabled control sends nothing, like every native one.
            disabled={disabled || undefined}
          />
        ) : null,
      )}
      <div className="date-picker__field">
        <span
          className={cx("date-picker__icon", active && "date-picker__icon--active")}
          aria-hidden="true"
        >
          <Icon size="1.1rem">{CALENDAR_GLYPH}</Icon>
        </span>
        <input
          {...api.triggerProps}
          ref={triggerRef}
          className={cx("date-picker__input", inputClass)}
          type="text"
          role="combobox"
          readOnly
          disabled={disabled}
          aria-label={label}
          placeholder={placeholder}
          value={text}
          onKeyDown={onKeyDown}
        />
        {clearable && !disabled ? (
          <button
            className="date-picker__clear"
            type="button"
            aria-label={clearLabel}
            onClick={() => {
              onClear();
              // The button goes away with the value; focus stays in the control.
              triggerRef.current?.focus();
            }}
          >
            <Icon size="0.9rem">
              <CloseGlyph />
            </Icon>
          </button>
        ) : null}
      </div>
      {shown && host
        ? createPortal(
            <div
              {...api.contentProps}
              ref={panelRef}
              className={cx("date-picker__popover", popupClass)}
              lang={locale}
              dir={dir}
            >
              {children(done)}
            </div>,
            host,
          )
        : null}
    </div>
  );
}

const CALENDAR_GLYPH = (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>
);
