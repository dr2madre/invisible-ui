import {
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  syncAttribute,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
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
 * `disabled`, `width` (wrap|fill|fixed), `name`, `required`, `error`, `title`.
 * Emits: bubbling `change` CustomEvent with `detail.value`.
 */
export class DsSelect extends HTMLElementBase {
  static observedAttributes = [
    "value",
    "disabled",
    "error",
    "label",
    "name",
    "required",
    "placeholder",
    "hide-label",
    "width",
    "title",
  ];

  #select: HTMLSelectElement | null = null;
  #error: HTMLSpanElement | null = null;
  #root: HTMLDivElement | null = null;
  #label: HTMLLabelElement | null = null;
  #errorId = nextId("ds-select-error");
  #items: SelectItem[] = [];
  #itemsAssigned = false;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue: string | null = null;
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "items");
    if (!this.#select) this.#render();
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#select,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
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
    this.#itemsAssigned = true;
    if (!this.#select) return;
    this.#renderOptions();
    // The rebuilt options start unselected. A value the new list still offers
    // is reapplied; one it no longer offers is dropped, which removes the
    // attribute and syncs through attributeChangedCallback.
    if (this.value != null && !items.some((item) => item.value === this.value)) this.value = null;
    else this.#sync();
  }

  #render() {
    // A property assigned before the element connected (or before its
    // definition loaded) is the consumer's list; the light-DOM <option>
    // children are the declarative source only when none was assigned. An
    // assigned empty list is a list, so the flag tracks the assignment itself.
    if (!this.#itemsAssigned) {
      this.#items = Array.from(this.querySelectorAll("option")).map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || option.value,
        disabled: option.disabled,
      }));
    }
    this.textContent = "";

    const id = nextId("ds-select");
    const root = document.createElement("div");
    root.className = "select";

    const label = document.createElement("label");
    label.className = "select__label";
    label.htmlFor = id;

    const control = document.createElement("span");
    control.className = "select__control";

    const select = document.createElement("select");
    select.className = "select__native";
    select.id = id;
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
    this.#root = root;
    this.#label = label;
    this.#renderOptions();
  }

  /** Shared by the option rebuild and the sync, which both write it. */
  #placeholderText() {
    return this.getAttribute("placeholder") ?? "Select…";
  }

  #renderOptions() {
    const select = this.#select!;
    select.textContent = "";

    // Placeholder: a hidden, disabled option holding the empty value.
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.hidden = true;
    placeholder.textContent = this.#placeholderText();
    select.appendChild(placeholder);

    for (const item of this.#items) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label ?? item.value;
      option.disabled = item.disabled ?? false;
      select.appendChild(option);
    }
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    const restored = this.#defaultValue;
    this.#select!.value = restored ?? "";
    this.value = restored;
    this.#sync();
  }

  #sync() {
    const select = this.#select!;
    select.disabled = boolAttr(this, "disabled");
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // choice, and an echo is not a new default (ADR 0012).
    if ((this.value ?? "") !== select.value) this.#defaultValue = this.value;

    this.#root!.dataset.width = this.getAttribute("width") ?? "wrap";
    this.#label!.textContent = this.getAttribute("label") ?? "";
    this.#label!.classList.toggle("select__label--hidden", boolAttr(this, "hide-label"));

    const name = this.getAttribute("name");
    if (name) select.name = name;
    else select.removeAttribute("name");
    select.required = boolAttr(this, "required");
    syncAttribute(this, select, "title");

    // The placeholder option is rebuilt by #renderOptions, so refresh its text
    // here too — the attribute can change without the item list moving.
    const placeholder = select.querySelector<HTMLOptionElement>("option[value='']");
    if (placeholder) placeholder.textContent = this.#placeholderText();

    // The real DOM default first, then the selection: writing `selected` on a
    // fresh option list moves the selection with it, so the value has to be
    // asserted after. The placeholder is never a default: a form with no
    // selection sends nothing for this control.
    for (const option of select.options)
      option.defaultSelected = option.value === this.#defaultValue;
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
