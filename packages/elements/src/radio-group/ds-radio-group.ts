import { radioGroup as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";

/** A radio in the group. The label is what the item shows. */
export type RadioGroupItem = core.RadioItem & { label: string };

/**
 * `<ds-radio-group>` — a group of radios as a custom element.
 *
 * Light DOM: real `<input type="radio">` items share a `name`, so the browser
 * owns single selection, the roving tabindex, arrow keys, focus and form
 * participation. The core owns the selection model and the group's ARIA.
 *
 * Items come from light-DOM `<option>` children, the same declarative source
 * `<ds-select>` reads:
 *
 * ```html
 * <ds-radio-group label="Plan" name="plan" value="pro">
 *   <option value="free">Free</option>
 *   <option value="pro">Pro</option>
 *   <option value="team" disabled>Team</option>
 * </ds-radio-group>
 * ```
 *
 * The `<option>` children are the declarative starting point, read once and
 * consumed: they are not a live source. Replace the set through the `items`
 * property, the same escape hatch `<ds-select>` offers.
 *
 * Attributes: `label` (required), `value`, `name`, `orientation`, `disabled`.
 * Properties: `value`, `items`.
 * Emits: bubbling `change` CustomEvent with `detail.value`.
 */
export class DsRadioGroup extends HTMLElementBase {
  static observedAttributes = ["value", "disabled", "orientation", "label", "name"];

  #group: HTMLElement | null = null;
  #legend: HTMLElement | null = null;
  #items: RadioGroupItem[] = [];
  #itemsAssigned = false;
  #inputs = new Map<string, HTMLInputElement>();
  #labelId = nextId("ds-radio-group-label");

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "items");
    if (!this.#group) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#group) this.#sync();
  }

  get value(): string | null {
    return this.getAttribute("value");
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  get items(): RadioGroupItem[] {
    return this.#items;
  }
  set items(items: RadioGroupItem[]) {
    this.#items = items;
    this.#itemsAssigned = true;
    if (this.#group) {
      this.#renderItems();
      this.#sync();
    }
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
    for (const option of Array.from(this.querySelectorAll("option"))) option.remove();

    const field = document.createElement("div");
    field.className = "radio-field";

    const legend = document.createElement("span");
    legend.className = "radio-field__label";
    legend.id = this.#labelId;

    const group = document.createElement("div");
    group.className = "radio-group";
    group.setAttribute("aria-labelledby", this.#labelId);

    field.append(legend, group);
    this.appendChild(field);
    this.#group = group;
    this.#legend = legend;
    this.#renderItems();
  }

  #renderItems() {
    const group = this.#group!;
    for (const label of Array.from(group.querySelectorAll(".radio"))) label.remove();
    this.#inputs.clear();

    for (const item of this.#items) {
      const label = document.createElement("label");
      label.className = "radio";

      const input = document.createElement("input");
      input.className = "radio__input";

      const dot = document.createElement("span");
      dot.className = "radio__dot";
      dot.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "radio__label";
      text.textContent = item.label;

      // The host re-emits a CustomEvent with a typed detail; stop the native
      // change here so listeners on the host don't receive the event twice.
      input.addEventListener("change", (event) => event.stopPropagation());

      label.append(input, dot, text);
      group.appendChild(label);
      this.#inputs.set(item.value, input);
    }
  }

  #sync() {
    const group = this.#group!;
    const disabled = boolAttr(this, "disabled");
    const orientation =
      this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical";

    this.#legend!.textContent = this.getAttribute("label") ?? "";

    const api = core.connect({
      state: core.initialState({
        items: this.#items,
        value: this.value ?? undefined,
        orientation,
        disabled,
      }),
      name: this.getAttribute("name") ?? undefined,
      setValue: (next) => {
        this.value = next;
        emit(this, "change", { value: next });
      },
    });

    applyProps(group, api.rootProps);
    group.setAttribute("aria-labelledby", this.#labelId);
    group.dataset.orientation = orientation;

    for (const item of this.#items) {
      const input = this.#inputs.get(item.value)!;
      applyProps(input, api.getItemProps(item.value));
      input.checked = api.value === item.value;
      input.closest("label")?.classList.toggle("radio--disabled", disabled || !!item.disabled);
    }
  }
}
