import { checkbox as core } from "@design-system/core";
import {
  applyDomProps,
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  upgradeProperty,
} from "../internal/base";
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
 * Attributes: `label` (required), `checked`, `indeterminate`, `disabled`,
 * `name`, `value`, `required`.
 * Properties: `checked` (boolean | "indeterminate").
 * Emits: bubbling `change` CustomEvent with `detail.checked`.
 */
export class DsCheckbox extends HTMLElementBase {
  static observedAttributes = ["checked", "indeterminate", "disabled"];

  #input: HTMLInputElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "checked");
    if (!this.#input) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#input) this.#sync();
  }

  get checked(): core.CheckedState {
    if (boolAttr(this, "indeterminate")) return "indeterminate";
    return boolAttr(this, "checked");
  }
  set checked(value: core.CheckedState) {
    this.toggleAttribute("indeterminate", value === "indeterminate");
    this.toggleAttribute("checked", value === true);
  }

  #render() {
    const label = document.createElement("label");
    label.className = "field";

    const input = document.createElement("input");
    input.className = "checkbox__input";
    input.type = "checkbox";
    for (const attr of ["name", "value", "required"] as const) {
      const v = this.getAttribute(attr);
      if (attr === "required") {
        input.required = boolAttr(this, "required");
      } else if (v != null) {
        input.setAttribute(attr, v);
      }
    }

    const box = document.createElement("span");
    box.className = "checkbox";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      checkIcon("checkbox__glyph checkbox__check") + dashIcon("checkbox__glyph checkbox__dash");

    const text = document.createElement("span");
    text.className = "field__label";
    text.textContent = this.getAttribute("label") ?? "";

    // The host re-emits a CustomEvent with a typed detail; stop the native
    // change here so listeners on the host don't receive the event twice.
    input.addEventListener("change", (event) => event.stopPropagation());

    label.append(input, box, text);
    this.appendChild(label);
    this.#input = input;
  }

  #sync() {
    const input = this.#input!;
    const disabled = boolAttr(this, "disabled");
    input.closest("label")?.classList.toggle("field--disabled", disabled);

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
  }
}
