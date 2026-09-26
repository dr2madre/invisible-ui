import { radioGroup as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { pathIcon } from "../internal/icons";

/**
 * A segment. `label` falls back to `value`; `icon` is the path data (`d`) of a
 * 24×24 stroke glyph, the same form `<ds-tabs>` takes.
 */
export type SegmentedControlItem = core.RadioItem & { label?: string; icon?: string };

export type SegmentedControlOrientation = core.Orientation;

/**
 * `<ds-segmented-control>` — a single-select bar of segments as a custom
 * element.
 *
 * Light DOM: each segment is a real `<input type="radio">` sharing one `name`,
 * so the browser owns single selection, the roving tabindex, arrow keys, focus
 * and form participation. The core owns the selection model and the group's
 * ARIA, the same as `<ds-radio-group>`.
 *
 * Items come from light-DOM `<option>` children, read once and consumed. An
 * option's `data-icon` carries the segment's icon path:
 *
 * ```html
 * <ds-segmented-control label="View" name="view" value="list">
 *   <option value="list">List</option>
 *   <option value="board">Board</option>
 * </ds-segmented-control>
 * ```
 *
 * Replace the set through the `items` property.
 *
 * Attributes: `label` (required), `value`, `name`, `orientation`
 * (horizontal|vertical), `disabled`, `icon-only`, `stacked`, `hide-label`.
 * Properties: `value`, `items`.
 * Emits: bubbling `change` CustomEvent with `detail.value`.
 */
export class DsSegmentedControl extends HTMLElementBase {
  static observedAttributes = [
    "value",
    "disabled",
    "orientation",
    "label",
    "name",
    "icon-only",
    "stacked",
    "hide-label",
  ];

  #group: HTMLElement | null = null;
  #legend: HTMLElement | null = null;
  #items: SegmentedControlItem[] = [];
  #itemsAssigned = false;
  #inputs = new Map<string, HTMLInputElement>();
  #labelId = nextId("ds-segmented-label");
  /** Groups the radios when the page gives no `name`. */
  #fallbackName = nextId("ds-segmented");
  /** What a form reset restores: the last value set from outside. */
  #defaultValue: string | null = null;
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "items");
    if (!this.#group) this.#render();
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#inputs.values().next().value ?? null,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback(name: string) {
    if (!this.#group) return;
    // The segment content depends on these, so the segments are rebuilt.
    if (name === "icon-only" || name === "stacked") this.#renderItems();
    this.#sync();
  }

  get value(): string | null {
    return this.getAttribute("value");
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  get items(): SegmentedControlItem[] {
    return this.#items;
  }
  set items(items: SegmentedControlItem[]) {
    this.#items = Array.isArray(items) ? items : [];
    this.#itemsAssigned = true;
    if (this.#group) {
      this.#renderItems();
      this.#sync();
    }
  }

  #render() {
    // An assigned list, even an empty one, wins over the declarative children.
    if (!this.#itemsAssigned) {
      this.#items = Array.from(this.querySelectorAll("option")).map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || undefined,
        icon: option.dataset.icon || undefined,
        disabled: option.disabled,
      }));
    }
    for (const option of Array.from(this.querySelectorAll("option"))) option.remove();

    const field = document.createElement("div");
    field.className = "segmented-field";

    const legend = document.createElement("span");
    legend.className = "segmented-field__label";
    legend.id = this.#labelId;

    const group = document.createElement("div");
    group.className = "segmented";
    group.setAttribute("aria-labelledby", this.#labelId);

    field.append(legend, group);
    this.appendChild(field);
    this.#group = group;
    this.#legend = legend;
    this.#renderItems();
  }

  #renderItems() {
    const group = this.#group!;
    const iconOnly = boolAttr(this, "icon-only");
    const stacked = boolAttr(this, "stacked");
    // A rebuild must keep what the page shows, which may be a choice the
    // value attribute has not caught up with.
    const shown = this.#shown();
    group.replaceChildren();
    this.#inputs.clear();

    for (const item of this.#items) {
      const text = item.label ?? item.value;
      const showLabel = stacked || !iconOnly || !item.icon;

      const segment = document.createElement("label");
      segment.className = "segment";
      segment.classList.toggle("segment--icon-only", iconOnly && !!item.icon && !stacked);
      segment.classList.toggle("segment--stacked", stacked);

      const input = document.createElement("input");
      input.className = "segment__input";
      if (!showLabel) input.setAttribute("aria-label", text);
      input.checked = shown === item.value;
      // The host re-emits a CustomEvent with a typed detail; stop the native
      // change here so listeners on the host don't receive the event twice.
      input.addEventListener("change", (event) => event.stopPropagation());
      segment.appendChild(input);

      if (item.icon) {
        const icon = document.createElement("span");
        icon.className = "segment__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.appendChild(pathIcon(item.icon));
        segment.appendChild(icon);
      }
      if (showLabel) {
        const label = document.createElement("span");
        label.className = "segment__label";
        label.textContent = text;
        segment.appendChild(label);
      }

      group.appendChild(segment);
      this.#inputs.set(item.value, input);
    }
  }

  #shown(): string | null {
    return [...this.#inputs].find(([, input]) => input.checked)?.[0] ?? null;
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    const restored = this.#defaultValue;
    for (const [value, input] of this.#inputs) input.checked = value === restored;
    this.value = restored;
    this.#sync();
  }

  #sync() {
    const group = this.#group!;
    const disabled = boolAttr(this, "disabled");
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // choice, and an echo is not a new default (ADR 0012).
    if (this.value !== this.#shown()) this.#defaultValue = this.value;
    const orientation = this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";

    this.#legend!.textContent = this.getAttribute("label") ?? "";
    this.#legend!.classList.toggle("segmented-field__label--hidden", boolAttr(this, "hide-label"));

    const api = core.connect({
      state: core.initialState({
        items: this.#items,
        value: this.value ?? undefined,
        orientation,
        disabled,
      }),
      name: this.getAttribute("name") ?? this.#fallbackName,
      setValue: (next) => {
        this.value = next;
        emit(this, "change", { value: next });
      },
    });

    applyProps(group, api.rootProps);
    group.classList.toggle("segmented--vertical", orientation === "vertical");

    for (const item of this.#items) {
      const input = this.#inputs.get(item.value)!;
      applyProps(input, api.getItemProps(item.value));
      input.checked = api.value === item.value;
      // The real DOM default, so the browser's own reset works and so does one
      // in markup the script never reaches.
      input.defaultChecked = this.#defaultValue === item.value;
      input.closest("label")?.classList.toggle("segment--disabled", disabled || !!item.disabled);
    }
  }
}
