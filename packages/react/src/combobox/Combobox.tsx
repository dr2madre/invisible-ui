import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useCombobox, type ComboboxItem } from "./use-combobox";

/** A combobox option, optionally carrying a leading icon (an SVG path `d`). */
export interface ComboboxOption extends ComboboxItem {
  icon?: string;
}

export interface ComboboxProps {
  /** Accessible name for the control. */
  label: string;
  /** Options. Each may carry a leading `icon`; with the search hidden, the
   *  control mirrors the selected option's icon. */
  items: ComboboxOption[];
  value?: string | null;
  /**
   * With `searchable={false}` the input becomes read-only and the list always
   * shows every option — a select-only combobox: the advanced Select (styled
   * popup, per-option icons) without the autocomplete.
   */
  searchable?: boolean;
  /**
   * Width behaviour: `fixed` (default) uses `--ds-combobox-width`, `wrap` fits
   * the longest option, `fill` takes 100% of the container.
   */
  width?: "wrap" | "fill" | "fixed";
  /** Input placeholder. Defaults to the catalog's "Search…". */
  placeholder?: string;
  disabled?: boolean;
  /** Clear button accessible name. Defaults to the catalog's "Clear". */
  clearLabel?: string;
  /** Text shown when no option matches. Defaults to the catalog's "No results". */
  emptyText?: string;
  /** Form field name — the selected option's value is submitted under it. */
  name?: string;
  onValueChange?: (value: string | null) => void;
  onInputValueChange?: (text: string) => void;
  /** Leading icon shown when `searchable={false}` and no option icon applies. */
  icon?: ReactNode;
}

/**
 * Combobox — a styled editable autocomplete (WAI-ARIA editable combobox), and
 * the design system's **advanced select**.
 *
 * Behaviour and accessibility come from the headless combobox
 * (`@design-system/core`); this adapter owns the DOM concerns — filtering,
 * popup positioning (flip/shift via Floating UI), close-on-outside-pointer and
 * keeping the active option in view. DOM focus stays on the input; the
 * highlighted option travels through `aria-activedescendant`.
 *
 * Use it over `Select` whenever options need to be *drawn* (icons, rich
 * content) or searched — see
 * `docs/adr/0003-native-select-advanced-combobox.md`. Themeable via
 * `--ds-combobox-*` (and the shared `--ds-select-*` listbox tokens).
 */
export function Combobox({
  label,
  items,
  value = null,
  searchable = true,
  width = "fixed",
  placeholder,
  disabled = false,
  clearLabel,
  emptyText,
  name,
  onValueChange,
  onInputValueChange,
  icon,
}: ComboboxProps) {
  const { t } = useI18n();

  const combobox = useCombobox({
    items,
    value,
    disabled,
    // Select-only mode never filters: the read-only input is a trigger, so the
    // list must always show every option (keyboard opening included).
    filter: searchable ? undefined : (all) => all,
    onValueChange,
    onInputValueChange,
  });

  const {
    api,
    items: visible,
    inputValue,
    value: selectedValue,
    open,
    inputRef,
    listboxRef,
    controlRef,
    floatingStyles,
    onInputChange,
    onInputPointerDown,
    openAll,
    setOpen,
  } = combobox;

  const resolvedPlaceholder = placeholder ?? t("combobox.placeholder");
  const resolvedClearLabel = clearLabel ?? t("combobox.clear");
  const resolvedEmptyText = emptyText ?? t("combobox.empty");

  const selected = items.find((item) => item.value === selectedValue);
  const hasIcons = items.some((item) => item.icon);
  const clearHidden = !inputValue || disabled;

  // The listbox is portalled to the body, so it must not render before mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The chevron toggles the list (showing all options when opening), so a
  // selected value can be changed without clearing it first. iOS Safari can
  // synthesize a duplicate "ghost" click; ignore one that lands right after the
  // last so the list doesn't open then immediately close.
  const [lastToggle, setLastToggle] = useState(-Infinity);
  const toggle = (event: MouseEvent) => {
    if (event.timeStamp - lastToggle < 350) return;
    setLastToggle(event.timeStamp);
    if (open) setOpen(false);
    else openAll();
  };

  const listbox = (
    <ul
      {...api.listboxProps}
      ref={listboxRef}
      className="combobox__listbox"
      style={floatingStyles}
    >
      {visible.length > 0 ? (
        visible.map((item) => {
          // The hook filters plain core items; the icon lives on the prop list.
          const optionIcon = items.find((i) => i.value === item.value)?.icon;
          return (
            <li key={item.value} {...api.getOptionProps(item.value)} className="combobox__option">
              <span className="combobox__check" aria-hidden="true">
                <Icon size="100%" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </Icon>
              </span>
              {hasIcons && (
                <span className="combobox__option-icon" aria-hidden="true">
                  {optionIcon && (
                    <Icon size="100%">
                      <path d={optionIcon} />
                    </Icon>
                  )}
                </span>
              )}
              <span className="combobox__option-label">{item.label ?? item.value}</span>
            </li>
          );
        })
      ) : (
        <li className="combobox__empty" role="option" aria-selected="false" aria-disabled="true">
          {resolvedEmptyText}
        </li>
      )}
    </ul>
  );

  return (
    <div className="combobox" data-width={width}>
      {name && <input type="hidden" name={name} value={selectedValue ?? ""} />}

      <label {...api.labelProps} className="combobox__label">
        {label}
      </label>

      <div
        ref={controlRef}
        className={
          disabled ? "combobox__control combobox__control--disabled" : "combobox__control"
        }
      >
        {searchable ? (
          <span className="combobox__search" aria-hidden="true">
            <Icon size="100%">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Icon>
          </span>
        ) : (
          (icon || selected?.icon) && (
            <span className="combobox__search" aria-hidden="true">
              {icon ??
                (selected?.icon && (
                  <Icon size="100%">
                    <path d={selected.icon} />
                  </Icon>
                ))}
            </span>
          )
        )}

        <input
          {...api.inputProps}
          ref={inputRef}
          className={
            searchable ? "combobox__input" : "combobox__input combobox__input--select-only"
          }
          type="text"
          placeholder={resolvedPlaceholder}
          readOnly={!searchable}
          disabled={disabled}
          value={inputValue}
          onChange={onInputChange}
          onPointerDown={onInputPointerDown}
        />

        {/* Invisible sizer: with width="wrap" the longest option (or the
            placeholder) sets a stable control width. */}
        <span className="combobox__sizer" aria-hidden="true">
          {items.map((item) => (
            <span key={item.value}>{item.label ?? item.value}</span>
          ))}
          <span>{resolvedPlaceholder}</span>
        </span>

        {/* The clear button always occupies its slot (hidden when empty) so the
            input width stays stable instead of jumping as text is typed. */}
        <button
          {...api.clearProps}
          className={
            clearHidden ? "combobox__clear combobox__clear--hidden" : "combobox__clear"
          }
          aria-label={resolvedClearLabel}
          tabIndex={clearHidden ? -1 : 0}
          aria-hidden={clearHidden ? "true" : undefined}
        >
          <Icon size="100%">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </Icon>
        </button>

        <button
          className="combobox__chevron"
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close options" : "Show options"}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggle}
        >
          <Icon size="100%">
            <polyline points="6 9 12 15 18 9" />
          </Icon>
        </button>
      </div>

      {mounted && createPortal(listbox, document.body)}
    </div>
  );
}
