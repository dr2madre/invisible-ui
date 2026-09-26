import { toggleButton as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  syncAttribute,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { pathIcon } from "../internal/icons";

/**
 * `<ds-toggle-button>` — an independent on/off control (Bold in a toolbar, a
 * filter chip) as a custom element.
 *
 * Light DOM: a real `<input type="checkbox">` styled as a button, so the
 * browser owns the checkbox role, Space activation, focus and form
 * participation. The core owns the pressed model. Use `<ds-switch>` for a
 * settings-style on/off control.
 *
 * The element's children become the visible content. Give `label` when that
 * content is an icon, so the control still has an accessible name. `check`
 * adds a leading checkmark while pressed, the filter-chip look.
 *
 * The host is the `.toggle` box itself, so toggles inside a
 * `<ds-toggle-group>` are siblings and the segmented group draws its dividers.
 *
 * Attributes: `pressed`, `disabled`, `check`, `label`, `name`, `value`.
 * Properties: `pressed`, `disabled`.
 * Emits: bubbling `change` CustomEvent with `detail.pressed`.
 */
export class DsToggleButton extends HTMLElementBase {
  static observedAttributes = ["pressed", "disabled", "check", "label", "name", "value"];

  #input: HTMLInputElement | null = null;
  #surface: HTMLLabelElement | null = null;
  #check: SVGSVGElement | null = null;
  /** What a form reset restores: the last state set from outside. */
  #defaultPressed = false;
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "pressed");
    upgradeProperty(this, "disabled");
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

  get pressed(): boolean {
    return boolAttr(this, "pressed");
  }
  set pressed(value: boolean) {
    this.toggleAttribute("pressed", !!value);
  }

  get disabled(): boolean {
    return boolAttr(this, "disabled");
  }
  set disabled(value: boolean) {
    this.toggleAttribute("disabled", !!value);
  }

  #render() {
    const id = nextId("ds-toggle-button");
    this.classList.add("toggle");

    const input = document.createElement("input");
    input.id = id;
    input.className = "toggle__input";

    // A label for the input, so a press on the surface reaches the checkbox
    // and the content names it. It follows the input, which the sheet needs.
    const surface = document.createElement("label");
    surface.className = "toggle__surface";
    surface.htmlFor = id;
    while (this.firstChild) surface.appendChild(this.firstChild);

    // The host re-emits a CustomEvent with a typed detail; stop the native
    // change here so listeners on the host don't receive the event twice.
    input.addEventListener("change", (event) => event.stopPropagation());

    this.append(input, surface);
    this.#input = input;
    this.#surface = surface;
  }

  /** Put the state back to the current default, telling nobody. */
  #restore() {
    this.#input!.checked = this.#defaultPressed;
    this.pressed = this.#defaultPressed;
    this.#sync();
  }

  #sync() {
    const input = this.#input!;
    const disabled = this.disabled;
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // press, and an echo is not a new default (ADR 0012).
    if (this.pressed !== input.checked) this.#defaultPressed = this.pressed;

    const api = core.connect({
      state: core.initialState({ pressed: this.pressed, disabled }),
      setPressed: (next) => {
        this.pressed = next;
        emit(this, "change", { pressed: next });
      },
    });

    applyProps(input, api.rootProps);
    input.checked = api.pressed;
    // The real DOM default, so the browser's own reset works as well.
    input.defaultChecked = this.#defaultPressed;
    syncAttribute(this, input, "name");
    input.value = this.getAttribute("value") ?? "on";
    const label = this.getAttribute("label");
    if (label == null) input.removeAttribute("aria-label");
    else input.setAttribute("aria-label", label);
    this.classList.toggle("toggle--disabled", disabled);
    this.#syncCheck(boolAttr(this, "check") && api.pressed);
  }

  #syncCheck(show: boolean) {
    if (!show) {
      this.#check?.remove();
      this.#check = null;
      return;
    }
    if (this.#check) return;
    const check = pathIcon("M20 6 9 17l-5-5", "toggle__check");
    check.setAttribute("stroke-width", "2.5");
    this.#surface!.insertBefore(check, this.#surface!.firstChild);
    this.#check = check;
  }
}
