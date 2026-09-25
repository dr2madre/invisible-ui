import { pinInput as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { onLocaleChange, t } from "../internal/i18n";

export type PinInputType = core.PinInputType;

const lengthAttr = (el: Element): number => {
  const value = Number(el.getAttribute("length"));
  return Number.isInteger(value) && value > 0 ? value : 6;
};

/**
 * `<ds-pin-input>` — a verification-code input as a custom element: a row of
 * single-character cells in a labelled group.
 *
 * Light DOM: each cell is a real `<input>`. The core owns per-cell entry,
 * advancing, Backspace, arrow and Home/End movement, paste distribution and
 * character filtering. The cells carry no `name`: the combined code reaches
 * the form through a hidden input under `name`. Each cell's accessible name
 * comes from the catalog in the element's locale.
 *
 * Attributes: `label` (required), `value`, `length` (number of cells, default 6), `type`
 * (numeric|alphanumeric), `mask`, `disabled`, `invalid`, `success`, `name`.
 * Properties: `value` (string).
 * Emits: bubbling `change` CustomEvent with `detail.value` on every edit, and
 * `complete` CustomEvent with `detail.value` once every cell is filled.
 */
export class DsPinInput extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "value",
    "length",
    "type",
    "mask",
    "disabled",
    "invalid",
    "success",
    "name",
  ];

  #root: HTMLDivElement | null = null;
  #cells: HTMLInputElement[] = [];
  #hidden: HTMLInputElement | null = null;
  #state: core.PinInputState | null = null;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue = "";
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#root) this.#update();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "value");
    if (!this.#root) this.#render();
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#cells[0] ?? null,
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
    return this.#state ? core.value(this.#state) : (this.getAttribute("value") ?? "");
  }
  set value(next: string) {
    this.setAttribute("value", next ?? "");
  }

  #render() {
    const root = document.createElement("div");
    root.className = "pin-input";
    this.appendChild(root);
    this.#root = root;

    const value = this.getAttribute("value") ?? "";
    this.#defaultValue = value;
    this.#state = core.initialState({
      id: nextId("ds-pin-input"),
      value,
      length: lengthAttr(this),
    });
  }

  #sync() {
    const s = this.#state!;
    const length = lengthAttr(this);
    const value = this.getAttribute("value") ?? "";
    // The value the element just reported comes back as an echo, and an echo
    // is not a new reset default (ADR 0012).
    if (value !== core.value(s)) this.#defaultValue = value;
    this.#state = {
      ...s,
      length,
      values: core.splitValue(value, length),
      type: this.getAttribute("type") === "alphanumeric" ? "alphanumeric" : "numeric",
      mask: boolAttr(this, "mask"),
      disabled: boolAttr(this, "disabled"),
    };
    this.#update();
  }

  #setValues(values: string[]) {
    const current = this.#state!;
    // A handler that writes back the same cells is echoing, not changing.
    if (
      values.length === current.values.length &&
      values.every((cell, index) => cell === current.values[index])
    )
      return;
    const value = values.join("");
    this.#state = { ...current, values };
    this.#update();
    this.value = value;
    emit(this, "change", { value });
    // A listener that wrote its own value owns what the cells hold now:
    // completion is reported only for the value still there.
    const now = this.#state;
    if (core.value(now) === value && core.isComplete(now)) emit(this, "complete", { value });
  }

  #focus(index: number) {
    this.#cells[index]?.focus();
  }

  #update() {
    const s = this.#state!;
    const root = this.#root!;
    const invalid = boolAttr(this, "invalid");
    const api = core.connect({
      state: s,
      setValues: (values) => this.#setValues(values),
      focus: (index) => this.#focus(index),
      cellLabel: (index, length) => t(this, "pinInput.cell", { index: index + 1, length }),
    });

    applyProps(root, api.rootProps);
    root.setAttribute("aria-label", this.getAttribute("label") ?? "");
    root.toggleAttribute("data-invalid", invalid);
    root.toggleAttribute("data-success", !invalid && boolAttr(this, "success"));

    this.#syncHidden(core.value(s));

    while (this.#cells.length > s.length) this.#cells.pop()!.remove();
    while (this.#cells.length < s.length) {
      const cell = document.createElement("input");
      cell.className = "pin-input__cell";
      // The host reports the combined value; a cell's own events stop here.
      cell.addEventListener("input", (event) => event.stopPropagation());
      cell.addEventListener("change", (event) => event.stopPropagation());
      root.appendChild(cell);
      this.#cells.push(cell);
    }

    const restored = core.splitValue(this.#defaultValue, s.length);
    this.#cells.forEach((cell, index) => {
      applyProps(cell, api.getInputProps(index));
      cell.type = s.mask ? "password" : "text";
      if (invalid) cell.setAttribute("aria-invalid", "true");
      else cell.removeAttribute("aria-invalid");
      const char = s.values[index] ?? "";
      if (cell.value !== char) cell.value = char;
      // The real DOM default, so the browser's own reset agrees with ours.
      cell.defaultValue = restored[index] ?? "";
    });
  }

  #syncHidden(value: string) {
    const name = this.getAttribute("name");
    if (!name) {
      this.#hidden?.remove();
      this.#hidden = null;
      return;
    }
    if (!this.#hidden) {
      this.#hidden = document.createElement("input");
      this.#hidden.type = "hidden";
      this.#root!.prepend(this.#hidden);
    }
    this.#hidden.name = name;
    this.#hidden.value = value;
    this.#hidden.disabled = this.#state!.disabled;
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    const s = this.#state!;
    this.#state = { ...s, values: core.splitValue(this.#defaultValue, s.length) };
    this.value = this.#defaultValue;
    this.#update();
  }
}
