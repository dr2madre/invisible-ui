import {
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  syncAttribute,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";

/**
 * `<ds-radio>` — a single styled radio paired with its label, as a custom
 * element.
 *
 * Light DOM: a real `<input type="radio">` sits in the page's tree, so several
 * `<ds-radio>`s sharing a `name` form one group the way native radios do. The
 * browser owns single selection, arrow keys, focus and form participation. Use
 * this to lay the radios out yourself; `<ds-radio-group>` manages a set.
 *
 * The element's children become the label, with the `label` attribute as the
 * fallback when there are none:
 *
 * ```html
 * <ds-radio name="plan" value="free" checked>Free</ds-radio>
 * <ds-radio name="plan" value="pro">Pro</ds-radio>
 * ```
 *
 * The browser unchecks the other radios of a group without telling them, so
 * the `checked` property reads the live input. The attribute is what the page
 * sets, and it is also what a form reset restores.
 *
 * Attributes: `value` (required), `name` (required), `checked`, `disabled`,
 * `label`.
 * Properties: `checked`.
 * Emits: bubbling `change` CustomEvent with `detail.value` when the radio is
 * chosen.
 */
export class DsRadio extends HTMLElementBase {
  static observedAttributes = ["value", "name", "checked", "disabled", "label"];

  #input: HTMLInputElement | null = null;
  #text: HTMLSpanElement | null = null;
  /** Whether the children name the radio, so `label` only fills an empty one. */
  #hasChildren = false;
  /** What a form reset restores: the last state set from outside. */
  #defaultChecked = false;
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "checked");
    if (!this.#input) this.#render();
    this.#sync();
    this.#syncChecked();
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

  attributeChangedCallback(name: string) {
    if (!this.#input) return;
    // Only the checked attribute moves the selection: re-applying it on any
    // other change would undo a choice made in the page since.
    if (name === "checked") this.#syncChecked();
    else this.#sync();
  }

  get checked(): boolean {
    return this.#input ? this.#input.checked : boolAttr(this, "checked");
  }
  set checked(value: boolean) {
    // Written even when unchanged: after a user choice the attribute may say
    // one thing and the input another, and a write must still reach the input.
    if (value) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
  }

  #render() {
    const id = nextId("ds-radio");
    const label = document.createElement("label");
    label.className = "radio";
    label.htmlFor = id;

    const input = document.createElement("input");
    input.id = id;
    input.type = "radio";
    input.className = "radio__input";

    const dot = document.createElement("span");
    dot.className = "radio__dot";
    dot.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "radio__label";
    this.#hasChildren = Array.from(this.childNodes).some(
      (node) => node.nodeType === Node.ELEMENT_NODE || !!node.textContent?.trim(),
    );
    while (this.firstChild) text.appendChild(this.firstChild);

    input.addEventListener("change", (event) => {
      // The host re-emits a CustomEvent with a typed detail; stop the native
      // change so listeners on the host don't receive the event twice.
      event.stopPropagation();
      if (input.checked) emit(this, "change", { value: input.value });
    });

    label.append(input, dot, text);
    this.appendChild(label);
    this.#input = input;
    this.#text = text;
  }

  /** Put the state back to the current default, telling nobody. */
  #restore() {
    this.#input!.checked = this.#defaultChecked;
    this.checked = this.#defaultChecked;
  }

  #syncChecked() {
    const input = this.#input!;
    const next = boolAttr(this, "checked");
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // choice, and an echo is not a new default (ADR 0012).
    if (next !== input.checked) this.#defaultChecked = next;
    input.checked = next;
    // The real DOM default, so the browser's own reset works as well.
    input.defaultChecked = this.#defaultChecked;
  }

  #sync() {
    const input = this.#input!;
    const disabled = boolAttr(this, "disabled");
    syncAttribute(this, input, "name");
    syncAttribute(this, input, "value");
    input.disabled = disabled;
    input.closest("label")?.classList.toggle("radio--disabled", disabled);
    if (!this.#hasChildren) this.#text!.textContent = this.getAttribute("label") ?? "";
  }
}
