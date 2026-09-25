import { textField as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { closeIcon, searchIcon } from "../internal/icons";

/**
 * `<ds-search-field>` — a native search input with clear and submit actions in
 * one visual control. The actions remain real buttons in the surrounding form.
 *
 * Attributes: `label` (required), `hide-label`, `value`, `placeholder`,
 * `disabled`, `readonly`, `required`, `name`, `autocomplete`, `clear-label`,
 * `submit-label`, `no-submit` (drops the submit button for a filter that
 * applies as you type).
 * Properties: `value`.
 * Emits: bubbling `input` and `change` CustomEvents, both with `detail.value`.
 */
export class DsSearchField extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "hide-label",
    "value",
    "placeholder",
    "disabled",
    "readonly",
    "required",
    "name",
    "autocomplete",
    "clear-label",
    "submit-label",
    "no-submit",
  ];

  #root: HTMLDivElement | null = null;
  #label: HTMLLabelElement | null = null;
  #input: HTMLInputElement | null = null;
  #clear: HTMLButtonElement | null = null;
  #submit: HTMLButtonElement | null = null;
  #icon: HTMLSpanElement | null = null;
  #fieldId = "";
  #defaultValue = "";
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "value");
    if (!this.#root) this.#render();
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#input,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get value(): string {
    return this.#input?.value ?? this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
    if (this.#input) this.#input.value = next;
  }

  #render() {
    const root = document.createElement("div");
    root.className = "search-field";

    const label = document.createElement("label");
    label.className = "search-field__label";

    const control = document.createElement("div");
    control.className = "search-field__control";

    const input = document.createElement("input");
    input.className = "search-field__input";
    input.type = "search";
    input.value = this.getAttribute("value") ?? "";
    this.#defaultValue = input.value;
    input.addEventListener("input", (event) => {
      event.stopPropagation();
      this.setAttribute("value", input.value);
      emit(this, "input", { value: input.value });
    });
    input.addEventListener("change", (event) => {
      event.stopPropagation();
      emit(this, "change", { value: input.value });
    });

    const clear = document.createElement("button");
    clear.className = "search-field__action search-field__clear";
    clear.type = "button";
    clear.innerHTML = closeIcon();
    clear.addEventListener("click", () => this.#clearValue());

    const submit = document.createElement("button");
    submit.className = "search-field__action search-field__submit";
    submit.type = "submit";
    submit.innerHTML = searchIcon();

    const icon = document.createElement("span");
    icon.className = "search-field__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = searchIcon();

    control.append(icon, input, clear, submit);
    root.append(label, control);
    this.appendChild(root);

    this.#root = root;
    this.#label = label;
    this.#input = input;
    this.#clear = clear;
    this.#submit = submit;
    this.#icon = icon;
  }

  #sync() {
    const root = this.#root!;
    const label = this.#label!;
    const input = this.#input!;
    const clear = this.#clear!;
    const submit = this.#submit!;
    const disabled = boolAttr(this, "disabled");
    const readOnly = boolAttr(this, "readonly");
    const required = boolAttr(this, "required");
    const value = this.getAttribute("value") ?? "";

    if (value !== input.value) this.#defaultValue = value;
    this.#fieldId ||= core.initialState().id;
    const api = core.connect({
      state: core.initialState({
        id: this.#fieldId,
        value,
        disabled,
        readOnly,
        required,
      }),
      setValue: (next) => this.setAttribute("value", next),
    });

    applyProps(label, api.labelProps);
    label.classList.toggle("search-field__label--hidden", boolAttr(this, "hide-label"));
    label.textContent = this.getAttribute("label") ?? "";
    if (required) {
      const marker = document.createElement("span");
      marker.className = "search-field__required";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = " *";
      label.appendChild(marker);
    }

    applyProps(input, api.controlProps);
    input.type = "search";
    input.name = this.getAttribute("name") ?? "";
    input.placeholder = this.getAttribute("placeholder") ?? "";
    const autocomplete = this.getAttribute("autocomplete");
    if (autocomplete != null) input.setAttribute("autocomplete", autocomplete);
    else input.removeAttribute("autocomplete");
    if (input.value !== value) input.value = value;
    input.defaultValue = this.#defaultValue;

    root.classList.toggle("search-field--disabled", disabled);
    clear.hidden = value.length === 0 || disabled || readOnly;
    clear.disabled = disabled || readOnly;
    clear.setAttribute("aria-label", this.getAttribute("clear-label") ?? "Clear search");
    // Without a submit button the glyph only marks the field as a search.
    const noSubmit = boolAttr(this, "no-submit");
    root.classList.toggle("search-field--no-submit", noSubmit);
    this.#icon!.hidden = !noSubmit;
    submit.hidden = noSubmit;
    submit.disabled = disabled;
    submit.setAttribute("aria-label", this.getAttribute("submit-label") ?? "Search");
  }

  #clearValue() {
    const input = this.#input!;
    if (input.disabled || input.readOnly || input.value === "") return;
    input.value = "";
    this.setAttribute("value", "");
    emit(this, "input", { value: "" });
    input.focus();
  }

  #restore() {
    if (this.#input) this.#input.value = this.#defaultValue;
    this.setAttribute("value", this.#defaultValue);
    this.#sync();
  }
}
