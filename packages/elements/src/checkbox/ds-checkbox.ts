import { checkbox as core } from "@design-system/core";
import {
  applyDomProps,
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { checkIcon, dashIcon } from "../internal/icons";

/**
 * `<ds-checkbox>` — the styled tri-state checkbox as a custom element.
 *
 * Light DOM: a real `<input type="checkbox">` sits in the page's tree, so the
 * browser owns role, Space, focus and — crucially — **native form
 * participation** (`name`/`value`/`required` just work, no ElementInternals
 * needed). The core owns the tri-state model and declares `indeterminate`
 * through `rootDomProps`.
 *
 * Attributes: `label` (required), `hide-label`, `checked`, `indeterminate`,
 * `disabled`, `name`, `value`, `required`.
 * Properties: `checked` (boolean | "indeterminate").
 * Emits: bubbling `change` CustomEvent with `detail.checked`.
 */
export class DsCheckbox extends HTMLElementBase {
  static observedAttributes = [
    "checked",
    "indeterminate",
    "disabled",
    "label",
    "hide-label",
    "name",
    "value",
    "required",
  ];

  #input: HTMLInputElement | null = null;
  #text: HTMLSpanElement | null = null;
  /** What a form reset restores: the last state set from outside. */
  #defaultChecked: core.CheckedState = false;
  /** Set while the two state attributes are written as one change. */
  #writing = false;
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "checked");
    if (!this.#input) this.#render();
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
    // `checked` and `indeterminate` are two attributes holding one state, so
    // the sync waits for both: halfway through, the element is in a state
    // nobody asked for.
    if (this.#input && !this.#writing) this.#sync();
  }

  get checked(): core.CheckedState {
    if (boolAttr(this, "indeterminate")) return "indeterminate";
    return boolAttr(this, "checked");
  }
  set checked(value: core.CheckedState) {
    this.#writing = true;
    this.toggleAttribute("indeterminate", value === "indeterminate");
    this.toggleAttribute("checked", value === true);
    this.#writing = false;
    if (this.#input) this.#sync();
  }

  #render() {
    const label = document.createElement("label");
    label.className = "field";

    const input = document.createElement("input");
    input.className = "checkbox__input";
    input.type = "checkbox";

    const box = document.createElement("span");
    box.className = "checkbox";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      checkIcon("checkbox__glyph checkbox__check") + dashIcon("checkbox__glyph checkbox__dash");

    const text = document.createElement("span");
    text.className = "field__label";

    // The host re-emits a CustomEvent with a typed detail; stop the native
    // change here so listeners on the host don't receive the event twice.
    input.addEventListener("change", (event) => event.stopPropagation());

    label.append(input, box, text);
    this.appendChild(label);
    this.#input = input;
    this.#text = text;
  }

  /** Put the state back to the current default, telling nobody. */
  #restore() {
    const restored = this.#defaultChecked;
    const input = this.#input;
    if (input) {
      input.checked = restored === true;
      input.indeterminate = restored === "indeterminate";
    }
    this.checked = restored;
    this.#sync();
  }

  #sync() {
    const input = this.#input!;
    const disabled = boolAttr(this, "disabled");
    // The default a reset restores follows the attributes, except when they
    // only hand back what the control already shows: that is the page echoing
    // a click, and an echo is not a new default (ADR 0012).
    const shown: core.CheckedState = input.indeterminate ? "indeterminate" : input.checked;
    if (this.checked !== shown) this.#defaultChecked = this.checked;
    input.closest("label")?.classList.toggle("field--disabled", disabled);

    for (const attr of ["name", "value"] as const) {
      const next = this.getAttribute(attr);
      if (next != null) input.setAttribute(attr, next);
      else input.removeAttribute(attr);
    }
    input.required = boolAttr(this, "required");
    this.#text!.textContent = this.getAttribute("label") ?? "";
    this.#text!.classList.toggle("field__label--hidden", boolAttr(this, "hide-label"));

    const api = core.connect({
      state: { checked: this.checked, disabled },
      setChecked: (next) => {
        this.checked = next;
        emit(this, "change", { checked: next });
      },
    });

    applyProps(input, api.rootProps);
    applyDomProps(input, api.rootDomProps);
    input.checked = api.checked === true;
    // The real DOM default, so the browser's own reset works and so does one
    // in markup the script never reaches.
    input.defaultChecked = this.#defaultChecked === true;
  }
}
