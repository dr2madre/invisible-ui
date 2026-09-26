import { i18n, popover as popoverCore } from "@design-system/core";
import { DsCalendar, type CalendarEvent } from "../calendar/ds-calendar";
import { applyProps, boolAttr, definePart, HTMLElementBase, nextId } from "../internal/base";
import { attachFloating } from "../internal/floating";
import { watchFormReset } from "../internal/form-reset";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { localeScope, localized, onLocaleChange } from "../internal/i18n";
import { calendarIcon, smallCloseIcon } from "../internal/icons";

export type DateStyle = "full" | "long" | "medium" | "short";

const DATE_STYLES: DateStyle[] = ["full", "long", "medium", "short"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** An ISO `YYYY-MM-DD` date, or `null` for anything else (the empty string included). */
export const asDate = (value: string | null | undefined) =>
  value && ISO_DATE.test(value) ? value : null;

/** Midnight local time, so `Intl` shows the same calendar day as the ISO date. */
export const dt = (iso: string) => new Date(`${iso}T00:00:00`);

/** The catalog keys a picker names its parts with. */
export interface PickerMessages {
  label: i18n.MessageKey;
  placeholder: i18n.MessageKey;
  clear: i18n.MessageKey;
}

/**
 * The field and popup the date pickers share: a readonly combobox that opens a
 * `<ds-calendar>` in a dialog popup (the headless popover), positioned against
 * the field and kept inside the viewport. The subclass owns the value, what the
 * field shows, and how a pick in the calendar changes it.
 *
 * Enter, Space, ArrowDown and a click open the popup. Focus moves to the
 * calendar's focused day; Escape and a pick close it and put focus back on the
 * field. A press outside, or focus leaving both parts, closes it in place.
 */
export abstract class PickerField extends HTMLElementBase {
  protected abstract readonly messages: PickerMessages;
  /** Whether the field holds a date (drives the icon and the clear button). */
  protected abstract hasValue(): boolean;
  /** The text the field shows, formatted for the locale. */
  protected abstract displayText(format: Intl.DateTimeFormat): string;
  /** Names and values for the hidden inputs that carry the value into a form. */
  protected abstract formFields(): Array<{ name: string | null; value: string }>;
  /** Set the calendar up for the current value before it opens. */
  protected abstract configureCalendar(calendar: DsCalendar): void;
  /** Handle the calendar's report of a pick; `true` closes the popup. */
  protected abstract onCalendarPick(event: CustomEvent): boolean;
  /** Empty the value, as the user asked, and report it. */
  protected abstract clearValue(): void;
  /** Put the value back to its default, telling nobody (form reset). */
  protected abstract restore(): void;
  /** Read the value attributes after they change. */
  protected abstract syncValue(): void;
  /** Extra classes for the input and the popup. */
  protected inputClass = "";
  protected popupClass = "";

  #root: HTMLDivElement | null = null;
  #hiddenBox: HTMLInputElement[] = [];
  #field: HTMLDivElement | null = null;
  #icon: HTMLSpanElement | null = null;
  #input: HTMLInputElement | null = null;
  #clear: HTMLButtonElement | null = null;
  #panel: HTMLDivElement | null = null;
  #calendar: DsCalendar | null = null;
  #popoverId = popoverCore.initialState({ id: nextId("ds-date-picker") }).id;
  #open = false;
  #restoreFocus = false;
  #stopOpen: (() => void) | null = null;
  #stopFormReset: (() => void) | null = null;
  #stopGhostClicks: (() => void) | null = null;
  #events: CalendarEvent[] = [];
  #prices: Record<string, string> = {};

  constructor() {
    super();
    onLocaleChange(this, () => this.render());
  }

  connectedCallback() {
    if (!this.#root) this.#build();
    this.syncValue();
    this.render();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#input,
      () => {
        this.restore();
        this.render();
      },
    );
    this.#stopGhostClicks ??= ignoreGhostClicks(this.#input!);
  }

  disconnectedCallback() {
    this.#close(false);
    this.#stopFormReset?.();
    this.#stopFormReset = null;
    this.#stopGhostClicks?.();
    this.#stopGhostClicks = null;
  }

  attributeChangedCallback() {
    if (!this.#root) return;
    this.syncValue();
    // A control turned off closes its popup: nothing on the page answers it.
    if (boolAttr(this, "disabled")) this.#close(false);
    this.render();
  }

  get events(): CalendarEvent[] {
    return this.#events;
  }
  set events(next: CalendarEvent[]) {
    this.#events = Array.isArray(next) ? next : [];
    if (this.#calendar) this.#calendar.events = this.#events;
  }

  get prices(): Record<string, string> {
    return this.#prices;
  }
  set prices(next: Record<string, string>) {
    this.#prices = next && typeof next === "object" ? next : {};
    if (this.#calendar) this.#calendar.prices = this.#prices;
  }

  /** Whether the popup is open. */
  get open(): boolean {
    return this.#open;
  }

  /** The resolved BCP-47 locale for the field's date format. */
  protected get locale(): string {
    const tag = this.getAttribute("locale");
    return tag ? i18n.canonicalLocale(tag) : localeScope(this).locale;
  }

  protected get fieldLabel(): string {
    return localized(this, "label", this.messages.label);
  }

  /** Close the popup after a pick, with focus back on the field. */
  protected closeAfterPick() {
    this.#close(true);
  }

  #build() {
    this.textContent = "";
    const root = document.createElement("div");
    root.className = "date-picker";

    const field = document.createElement("div");
    field.className = "date-picker__field";

    const icon = document.createElement("span");
    icon.className = "date-picker__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = calendarIcon();

    const input = document.createElement("input");
    input.className = ["date-picker__input", this.inputClass].filter(Boolean).join(" ");
    input.type = "text";
    input.setAttribute("role", "combobox");
    input.readOnly = true;
    // A readonly field gets no click from the keyboard, so these keys open it.
    input.addEventListener("keydown", (event) => {
      if (!["Enter", " ", "ArrowDown"].includes(event.key) || this.#open || input.disabled) return;
      event.preventDefault();
      this.#show();
    });

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "date-picker__clear";
    clear.innerHTML = smallCloseIcon();
    clear.addEventListener("click", () => {
      this.clearValue();
      this.render();
      // The button goes away with the value; focus stays in the control.
      input.focus();
    });

    field.append(icon, input);
    root.append(field);
    this.appendChild(root);

    this.#root = root;
    this.#field = field;
    this.#icon = icon;
    this.#input = input;
    this.#clear = clear;
  }

  #popoverApi() {
    return popoverCore.connect({
      state: { open: this.#open, id: this.#popoverId },
      label: this.fieldLabel,
      setOpen: (open) => (open ? this.#show() : this.#close(this.#restoreFocus)),
    });
  }

  /** Bring the DOM in line with the value and the attributes. */
  protected render() {
    if (!this.#root) return;
    const disabled = boolAttr(this, "disabled");
    const root = this.#root;
    root.classList.toggle("date-picker--disabled", disabled);

    // Hidden inputs exist only to carry the value into a native form.
    const fields = this.formFields().filter((entry) => entry.name);
    while (this.#hiddenBox.length > fields.length) this.#hiddenBox.pop()!.remove();
    fields.forEach((entry, index) => {
      let hidden = this.#hiddenBox[index];
      if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        root.insertBefore(hidden, this.#field);
        this.#hiddenBox.push(hidden);
      }
      hidden.name = entry.name!;
      hidden.value = entry.value;
      // A disabled control sends nothing, like every native one.
      hidden.disabled = disabled;
    });

    const has = this.hasValue();
    this.#icon!.classList.toggle("date-picker__icon--active", has);

    const input = this.#input!;
    applyProps(input, this.#popoverApi().triggerProps);
    input.disabled = disabled;
    input.setAttribute("aria-label", this.fieldLabel);
    input.placeholder = localized(this, "placeholder", this.messages.placeholder);
    const style = this.getAttribute("date-style") as DateStyle;
    const format = i18n.dateTimeFormat(this.locale, {
      dateStyle: DATE_STYLES.includes(style) ? style : "medium",
    });
    const text = this.displayText(format);
    if (input.value !== text) input.value = text;

    const clear = this.#clear!;
    clear.setAttribute("aria-label", localized(this, "clear-label", this.messages.clear));
    if (boolAttr(this, "clearable") && has && !disabled) {
      if (!clear.isConnected) this.#field!.appendChild(clear);
    } else {
      clear.remove();
    }

    if (this.#panel) applyProps(this.#panel, this.#popoverApi().contentProps);
  }

  /** Forward the attributes the calendar shares with the picker. */
  protected forwardToCalendar(calendar: DsCalendar) {
    for (const name of ["min", "max", "week-starts-on", "locale"]) {
      const value = this.getAttribute(name);
      if (value == null) calendar.removeAttribute(name);
      else calendar.setAttribute(name, value);
    }
    calendar.setAttribute("label", this.fieldLabel);
  }

  #show() {
    if (this.#open || boolAttr(this, "disabled") || !this.#root) return;
    this.#open = true;
    const input = this.#input!;

    definePart("ds-calendar", DsCalendar);
    const calendar = new DsCalendar();
    this.forwardToCalendar(calendar);
    this.configureCalendar(calendar);
    calendar.events = this.#events;
    calendar.prices = this.#prices;
    // The calendar's own events are details of the picker, never its news.
    for (const type of ["change", "range-change", "focus-change", "view-change"]) {
      calendar.addEventListener(type, (event) => {
        event.stopPropagation();
        if (type !== "change" && type !== "range-change") return;
        const done = this.onCalendarPick(event as CustomEvent);
        this.render();
        if (done) this.closeAfterPick();
      });
    }

    const panel = document.createElement("div");
    panel.className = ["date-picker__popover", this.popupClass].filter(Boolean).join(" ");
    panel.appendChild(calendar);
    this.#root.appendChild(panel);
    this.#panel = panel;
    this.#calendar = calendar;
    this.render();

    const stopFloating = attachFloating(input, panel, { placement: "bottom-start", offset: 6 });
    // Only a keyboard dismissal sends focus back to the field. Capture phase:
    // the flag must be set before the core's close handler runs.
    this.#restoreFocus = false;
    panel.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") this.#restoreFocus = true;
      },
      true,
    );
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !this.#field!.contains(target)) this.#close(false);
    };
    this.ownerDocument.addEventListener("pointerdown", outside, true);
    this.ownerDocument.addEventListener("focusin", outside);
    this.#stopOpen = () => {
      stopFloating();
      this.ownerDocument.removeEventListener("pointerdown", outside, true);
      this.ownerDocument.removeEventListener("focusin", outside);
    };

    (panel.querySelector<HTMLElement>('[data-date][tabindex="0"]') ?? panel).focus();
  }

  #close(restoreFocus: boolean) {
    if (!this.#open) return;
    this.#open = false;
    this.#stopOpen?.();
    this.#stopOpen = null;
    this.#panel?.remove();
    this.#panel = null;
    this.#calendar = null;
    this.render();
    if (restoreFocus && this.#input?.isConnected) this.#input.focus();
  }
}
