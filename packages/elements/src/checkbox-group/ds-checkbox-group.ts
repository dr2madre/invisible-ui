import { checkboxGroup as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { checkIcon } from "../internal/icons";

/**
 * `<ds-checkbox-group>` — several checkboxes under one legend, as a custom
 * element.
 *
 * Light DOM: a real `<fieldset>` with real `<input type="checkbox">` items, so
 * the browser owns the grouping semantics, focus and form participation (every
 * checked value is submitted under the shared `name`). The core owns which
 * values are selected.
 *
 * Items come from light-DOM `<option>` children, the same declarative source
 * `<ds-select>` reads. The selected values are a comma-separated `value`
 * attribute, and the `value` property reads and writes them as an array:
 *
 * ```html
 * <ds-checkbox-group label="Toppings" name="toppings" value="olive,caper">
 *   <option value="olive">Olive</option>
 *   <option value="caper">Caper</option>
 * </ds-checkbox-group>
 * ```
 *
 * The `<option>` children are the declarative starting point, read once and
 * consumed: they are not a live source. Replace the set through the `items`
 * property, the same escape hatch `<ds-select>` offers.
 *
 * Attributes: `label` (required), `value`, `name`, `disabled`.
 * Properties: `value` (string[]), `items`.
 * Emits: bubbling `change` CustomEvent with `detail.value` (string[]).
 */
export class DsCheckboxGroup extends HTMLElementBase {
  static observedAttributes = ["value", "disabled", "label", "name"];

  #fieldset: HTMLFieldSetElement | null = null;
  #legend: HTMLLegendElement | null = null;
  #items: core.CheckboxGroupItem[] = [];
  #inputs = new Map<string, HTMLInputElement>();

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "items");
    if (!this.#fieldset) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#fieldset) this.#sync();
  }

  get value(): string[] {
    const raw = this.getAttribute("value");
    if (!raw) return [];
    return raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  set value(next: string[]) {
    this.setAttribute("value", next.join(","));
  }

  get items(): core.CheckboxGroupItem[] {
    return this.#items;
  }
  set items(items: core.CheckboxGroupItem[]) {
    this.#items = items;
    if (this.#fieldset) {
      this.#renderItems();
      this.#sync();
    }
  }

  #render() {
    this.#items = Array.from(this.querySelectorAll("option")).map((option) => ({
      value: option.value,
      label: option.textContent?.trim() || option.value,
      disabled: option.disabled,
    }));
    for (const option of Array.from(this.querySelectorAll("option"))) option.remove();

    const fieldset = document.createElement("fieldset");
    fieldset.className = "checkbox-group";

    const legend = document.createElement("legend");
    legend.className = "checkbox-group__label";
    fieldset.appendChild(legend);

    this.appendChild(fieldset);
    this.#fieldset = fieldset;
    this.#legend = legend;
    this.#renderItems();
  }

  #renderItems() {
    const fieldset = this.#fieldset!;
    for (const label of Array.from(fieldset.querySelectorAll(".checkbox-group__item"))) {
      label.remove();
    }
    this.#inputs.clear();

    for (const item of this.#items) {
      const label = document.createElement("label");
      label.className = "checkbox-group__item";

      const input = document.createElement("input");
      input.className = "checkbox__input";

      // The same painted box as the standalone checkbox, so one stylesheet
      // covers both and they render identically.
      const box = document.createElement("span");
      box.className = "checkbox";
      box.setAttribute("aria-hidden", "true");
      box.innerHTML = checkIcon("checkbox__glyph checkbox__check");

      const text = document.createElement("span");
      text.className = "field__label";
      text.textContent = item.label ?? item.value;

      // The host re-emits a CustomEvent with a typed detail; stop the native
      // change here so listeners on the host don't receive the event twice.
      input.addEventListener("change", (event) => event.stopPropagation());

      label.append(input, box, text);
      fieldset.appendChild(label);
      this.#inputs.set(item.value, input);
    }
  }

  #sync() {
    const fieldset = this.#fieldset!;
    const disabled = boolAttr(this, "disabled");

    this.#legend!.textContent = this.getAttribute("label") ?? "";

    const api = core.connect({
      state: core.initialState({ items: this.#items, value: this.value, disabled }),
      name: this.getAttribute("name") ?? undefined,
      setValue: (next) => {
        this.value = next;
        emit(this, "change", { value: next });
      },
    });

    applyProps(fieldset, api.rootProps);

    for (const item of this.#items) {
      const input = this.#inputs.get(item.value)!;
      applyProps(input, api.getItemProps(item.value));
      input.checked = api.isChecked(item.value);
      input
        .closest("label")
        ?.classList.toggle("checkbox-group__item--disabled", disabled || !!item.disabled);
    }
  }
}
