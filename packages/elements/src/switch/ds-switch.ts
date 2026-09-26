import { switchControl as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { localized, onLocaleChange } from "../internal/i18n";

/**
 * `<ds-switch>` — the styled switch as a custom element.
 *
 * Light DOM: a real `<input type="checkbox" role="switch">` in the page's
 * tree — the browser owns Space, focus and native form participation;
 * `role="switch"` makes screen readers announce on/off.
 *
 * Attributes: `label` (required), `hide-label`, `checked`, `disabled`, `name`, `value`,
 * `required`, `on-off` (text-in-track variant), `on-text`, `off-text`.
 * Properties: `checked` (boolean).
 * Emits: bubbling `change` CustomEvent with `detail.checked`.
 */
export class DsSwitch extends HTMLElementBase {
  static observedAttributes = [
    "checked",
    "disabled",
    "label",
    "hide-label",
    "name",
    "value",
    "required",
    "on-off",
    "on-text",
    "off-text",
  ];

  #input: HTMLInputElement | null = null;
  #track: HTMLSpanElement | null = null;
  #text: HTMLSpanElement | null = null;
  /** What a form reset restores: the last state set from outside. */
  #defaultChecked = false;
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#input) this.#sync();
    });
  }

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
    track.className = "switch";
    track.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "field__label";

    label.append(input, track, text);
    this.appendChild(label);
    this.#input = input;
    this.#track = track;
    this.#text = text;
  }

  /** Put the state back to the current default, telling nobody. */
  #restore() {
    const restored = this.#defaultChecked;
    if (this.#input) this.#input.checked = restored;
    this.checked = restored;
    this.#sync();
  }

  #sync() {
    const input = this.#input!;
    const disabled = boolAttr(this, "disabled");
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // click, and an echo is not a new default (ADR 0012).
    if (this.checked !== input.checked) this.#defaultChecked = this.checked;
    input.closest("label")?.classList.toggle("field--disabled", disabled);

    const name = this.getAttribute("name");
    if (name) input.name = name;
    else input.removeAttribute("name");
    input.value = this.getAttribute("value") ?? "on";
    input.required = boolAttr(this, "required");
    this.#text!.textContent = this.getAttribute("label") ?? "";
    // Hidden from view, still the control's accessible name.
    this.#text!.classList.toggle("field__label--hidden", boolAttr(this, "hide-label"));

    // The text-in-track variant carries two captions inside the track; the
    // plain one carries none, so switching the variant builds or tears them
    // down rather than just relabelling.
    const track = this.#track!;
    const onOff = boolAttr(this, "on-off");
    track.classList.toggle("switch--onoff", onOff);
    if (onOff && !track.firstChild) {
      track.innerHTML = `<span class="switch__on"></span><span class="switch__off"></span>`;
    } else if (!onOff && track.firstChild) {
      track.textContent = "";
    }
    const on = track.querySelector(".switch__on");
    if (on) on.textContent = localized(this, "on-text", "switch.on");
    const off = track.querySelector(".switch__off");
    if (off) off.textContent = localized(this, "off-text", "switch.off");

    const api = core.connect({
      state: { checked: this.checked, disabled },
      setChecked: (next) => {
        this.checked = next;
        emit(this, "change", { checked: next });
      },
    });

    applyProps(input, api.rootProps);
    input.checked = api.checked;
    // The real DOM default, so the browser's own reset works and so does one
    // in markup the script never reaches.
    input.defaultChecked = this.#defaultChecked;
  }
}
