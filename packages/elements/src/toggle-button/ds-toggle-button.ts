import { toggleButton as core } from "@invisible-ui/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { FieldMessages } from "../internal/field-message";
import { watchFormReset } from "../internal/form-reset";
import { CHECK_PATH, pathIcon } from "../internal/icons";

/**
 * `<ds-toggle-button>` — an independent on/off control (Bold in a toolbar, a
 * filter chip) as a custom element.
 *
 * Light DOM: a native `<button type="button">` carrying `aria-pressed`, so
 * the browser owns the button role, focus, and Enter and Space activation.
 * The accessible name never changes with the state: only `aria-pressed`
 * does. The core owns the pressed model. Use `<ds-switch>` for a
 * settings-style on/off control.
 *
 * The element's children become the visible content. Give `label` when that
 * content is an icon, so the control still has an accessible name. `check`
 * adds a leading checkmark while pressed, the filter-chip look.
 *
 * The host holds the `button.toggle`, so toggles inside a
 * `<ds-toggle-group>` are siblings and the segmented group draws its dividers.
 *
 * Form participation is provisional: while pressed, enabled and named, a
 * hidden input submits `value` (default `on`) under `name`. The owning form's
 * reset puts back the default pressed value without a `change` event
 * (ADR 0012).
 *
 * Attributes: `pressed`, `disabled`, `check`, `label`, `name`, `value`,
 * `error` (a message after the button that describes it; the page owns it,
 * so a form reset leaves it in place).
 * Properties: `pressed`, `disabled`.
 * Emits: bubbling `change` CustomEvent with `detail.pressed`.
 */
export class DsToggleButton extends HTMLElementBase {
  static observedAttributes = ["pressed", "disabled", "check", "label", "name", "value", "error"];

  #button: HTMLButtonElement | null = null;
  #surface: HTMLSpanElement | null = null;
  #check: SVGSVGElement | null = null;
  #hidden: HTMLInputElement | null = null;
  #messages = new FieldMessages(nextId("ds-toggle-button"));
  /** What the button shows, to tell a page echoing a press from a new value. */
  #shown = false;
  /** What a form reset restores: the last state set from outside. */
  #defaultPressed = false;
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "pressed");
    upgradeProperty(this, "disabled");
    if (!this.#button) this.#render();
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#button,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback() {
    if (this.#button) this.#sync();
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
    const button = document.createElement("button");
    button.className = "toggle";

    const surface = document.createElement("span");
    surface.className = "toggle__surface";
    while (this.firstChild) surface.appendChild(this.firstChild);

    button.appendChild(surface);
    this.appendChild(button);
    this.#button = button;
    this.#surface = surface;
    // The first render takes the markup's state as both shown and default.
    this.#shown = this.pressed;
    this.#defaultPressed = this.pressed;
  }

  /** Put the state back to the current default, telling nobody. */
  #restore() {
    this.#shown = this.#defaultPressed;
    this.pressed = this.#defaultPressed;
    this.#sync();
  }

  #sync() {
    const button = this.#button!;
    const disabled = this.disabled;
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // press, and an echo is not a new default (ADR 0012).
    if (this.pressed !== this.#shown) {
      this.#defaultPressed = this.pressed;
      this.#shown = this.pressed;
    }

    const api = core.connect({
      state: core.initialState({ pressed: this.pressed, disabled }),
      setPressed: (next) => {
        this.#shown = next;
        this.pressed = next;
        emit(this, "change", { pressed: next });
      },
    });

    applyProps(button, api.rootProps);
    const label = this.getAttribute("label");
    if (label == null) button.removeAttribute("aria-label");
    else button.setAttribute("aria-label", label);
    this.#syncCheck(boolAttr(this, "check") && api.pressed);
    // The message follows the button inside the host, outside its name.
    this.#messages.sync(this, this, [button], { ariaInvalid: false, description: false });
    this.#syncHidden(
      api.getHiddenInputProps({
        name: this.getAttribute("name") ?? undefined,
        value: this.getAttribute("value") ?? undefined,
      }),
    );
  }

  #syncHidden(props: ReturnType<core.ToggleButtonApi["getHiddenInputProps"]>) {
    if (!props) {
      this.#hidden?.remove();
      this.#hidden = null;
      return;
    }
    this.#hidden ??= document.createElement("input");
    applyProps(this.#hidden, props);
    if (!this.#hidden.isConnected) this.#button!.appendChild(this.#hidden);
  }

  #syncCheck(show: boolean) {
    if (!show) {
      this.#check?.remove();
      this.#check = null;
      return;
    }
    if (this.#check) return;
    const check = pathIcon(CHECK_PATH, "toggle__check");
    check.setAttribute("stroke-width", "2.5");
    this.#surface!.insertBefore(check, this.#surface!.firstChild);
    this.#check = check;
  }
}
