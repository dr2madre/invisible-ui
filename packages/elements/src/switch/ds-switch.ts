import { switchControl as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";

/**
 * `<ds-switch>` — the styled switch as a custom element.
 *
 * Light DOM: a real `<input type="checkbox" role="switch">` in the page's
 * tree — the browser owns Space, focus and native form participation;
 * `role="switch"` makes screen readers announce on/off.
 *
 * Attributes: `label` (required), `checked`, `disabled`, `name`, `value`,
 * `required`, `on-off` (text-in-track variant), `on-text`, `off-text`.
 * Properties: `checked` (boolean).
 * Emits: bubbling `change` CustomEvent with `detail.checked`.
 */
export class DsSwitch extends HTMLElementBase {
  static observedAttributes = [
    "checked",
    "disabled",
    "label",
    "name",
    "value",
    "required",
    "on-text",
    "off-text",
  ];

  #input: HTMLInputElement | null = null;
  #track: HTMLSpanElement | null = null;
  #text: HTMLSpanElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "checked");
    if (!this.#input) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#input) this.#sync();
  }

  get checked(): boolean {
    return boolAttr(this, "checked");
  }
  set checked(value: boolean) {
    this.toggleAttribute("checked", value);
  }

  #render() {
    const label = document.createElement("label");
    label.className = "field";

    const input = document.createElement("input");
    input.className = "switch__input";
    input.type = "checkbox";
    input.addEventListener("change", (event) => event.stopPropagation());

    const track = document.createElement("span");
    const onOff = boolAttr(this, "on-off");
    track.className = onOff ? "switch switch--onoff" : "switch";
    track.setAttribute("aria-hidden", "true");
    if (onOff) {
      track.innerHTML = `<span class="switch__on"></span><span class="switch__off"></span>`;
    }

    const text = document.createElement("span");
    text.className = "field__label";

    label.append(input, track, text);
    this.appendChild(label);
    this.#input = input;
    this.#track = track;
    this.#text = text;
  }

  #sync() {
    const input = this.#input!;
    const disabled = boolAttr(this, "disabled");
    input.closest("label")?.classList.toggle("field--disabled", disabled);

    const name = this.getAttribute("name");
    if (name) input.name = name;
    else input.removeAttribute("name");
    input.value = this.getAttribute("value") ?? "on";
    input.required = boolAttr(this, "required");
    this.#text!.textContent = this.getAttribute("label") ?? "";

    // The two captions only exist in the text-in-track variant; `on-off` itself
    // decides the track's markup, so it stays a first-render attribute.
    const on = this.#track!.querySelector(".switch__on");
    if (on) on.textContent = this.getAttribute("on-text") ?? "ON";
    const off = this.#track!.querySelector(".switch__off");
    if (off) off.textContent = this.getAttribute("off-text") ?? "OFF";

    const api = core.connect({
      state: { checked: this.checked, disabled },
      setChecked: (next) => {
        this.checked = next;
        emit(this, "change", { checked: next });
      },
    });

    applyProps(input, api.rootProps);
    input.checked = api.checked;
  }
}
