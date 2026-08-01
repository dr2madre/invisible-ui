import { boolAttr, emit, nextId, upgradeProperty } from "../internal/base";
import { chevronIcon } from "../internal/icons";

export interface SelectItem {
  value: string;
  label?: string;
  disabled?: boolean;
}

/**
 * `<ds-select>` — the styled **native** `<select>` (ADR 0003) as a custom
 * element.
 *
 * Options come from light-DOM `<option>` children — the most HTML-native API
 * possible, ideal for no-build pages and server-rendered (HTMX-style) HTML:
 *
 * ```html
 * <ds-select label="Fruit" name="fruit">
 *   <option value="apple">Apple</option>
 *   <option value="fig" disabled>Fig</option>
 * </ds-select>
 * ```
 *
 * …or from the `items` property (`{value, label?, disabled?}[]`).
 *
 * Attributes: `label` (required), `hide-label`, `value`, `placeholder`,
 * `disabled`, `width` (wrap|fill|fixed), `name`, `required`, `error`.
 * Emits: bubbling `change` CustomEvent with `detail.value`.
 */
export class DsSelect extends HTMLElement {
  static observedAttributes = ["value", "disabled", "error"];

  #select: HTMLSelectElement | null = null;
  #error: HTMLSpanElement | null = null;
  #errorId = nextId("ds-select-error");
  #items: SelectItem[] = [];

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "items");
    if (!this.#select) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#select) this.#sync();
  }

  get value(): string | null {
    return this.getAttribute("value");
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  get items(): SelectItem[] {
    return this.#items;
  }
  set items(items: SelectItem[]) {
    this.#items = items;
    if (this.#select) this.#renderOptions();
  }

  #render() {
    // Light-DOM <option> children are the declarative item source.
    this.#items = Array.from(this.querySelectorAll("option")).map((option) => ({
      value: option.value,
      label: option.textContent?.trim() || option.value,
      disabled: option.disabled,
    }));
    this.textContent = "";

    const id = nextId("ds-select");
    const root = document.createElement("div");
    root.className = "select";
    root.dataset.width = this.getAttribute("width") ?? "wrap";

    const label = document.createElement("label");
    label.className = boolAttr(this, "hide-label")
      ? "select__label select__label--hidden"
      : "select__label";
    label.htmlFor = id;
    label.textContent = this.getAttribute("label") ?? "";

    const control = document.createElement("span");
    control.className = "select__control";

    const select = document.createElement("select");
    select.className = "select__native";
    select.id = id;
    const name = this.getAttribute("name");
    if (name) select.name = name;
    select.required = boolAttr(this, "required");
    select.addEventListener("change", (event) => {
      event.stopPropagation();
      const next = select.value;
      if (next === "") return;
      this.value = next;
      emit(this, "change", { value: next });
    });

    const chevron = document.createElement("span");
    chevron.className = "select__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML = chevronIcon();

    control.append(select, chevron);

    const error = document.createElement("span");
    error.className = "select__error";
    error.id = this.#errorId;
    error.hidden = true;

    root.append(label, control, error);
    this.appendChild(root);
    this.#select = select;
    this.#error = error;
    this.#renderOptions();
  }

  #renderOptions() {
    const select = this.#select!;
    select.textContent = "";

    // Placeholder: a hidden, disabled option holding the empty value.
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.hidden = true;
    placeholder.textContent = this.getAttribute("placeholder") ?? "Select…";
    select.appendChild(placeholder);

    for (const item of this.#items) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label ?? item.value;
      option.disabled = item.disabled ?? false;
      select.appendChild(option);
    }
  }

  #sync() {
    const select = this.#select!;
    select.disabled = boolAttr(this, "disabled");
    select.value = this.value ?? "";
    select.classList.toggle("select__native--placeholder", this.value == null);

    const error = this.getAttribute("error");
    if (error) {
      select.setAttribute("aria-invalid", "true");
      select.setAttribute("aria-describedby", this.#errorId);
      select.setAttribute("data-invalid", "");
      this.#error!.hidden = false;
      this.#error!.textContent = error;
    } else {
      select.removeAttribute("aria-invalid");
      select.removeAttribute("aria-describedby");
      select.removeAttribute("data-invalid");
      this.#error!.hidden = true;
    }
  }
}
