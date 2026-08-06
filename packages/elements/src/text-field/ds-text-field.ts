import { textField as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { hazardIcon, successIcon } from "../internal/icons";

/** Tracks what a message paragraph last rendered, so an unrelated sync (a
 * `placeholder` change, say) doesn't tear down and rebuild its icon markup. */
const renderedMessage = new WeakMap<HTMLParagraphElement, string>();

/**
 * Shared body of `<ds-text-field>` and `<ds-textarea>`: the same headless field
 * with a different control element.
 *
 * Light DOM: a real `<input>` or `<textarea>` sits in the page's tree, so the
 * browser owns typing, focus and form participation. The core owns the id
 * wiring (`for`, `aria-describedby`, `aria-invalid`, `aria-required`) and the
 * state flags surfaced as `data-*`.
 */
abstract class DsTextControl extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "description",
    "error",
    "success",
    "value",
    "placeholder",
    "required",
    "disabled",
    "readonly",
  ];

  #root: HTMLElement | null = null;
  #label: HTMLLabelElement | null = null;
  #control: HTMLInputElement | HTMLTextAreaElement | null = null;
  #description: HTMLParagraphElement | null = null;
  #message: HTMLParagraphElement | null = null;
  #fieldId: string | null = null;

  /** The control element this field wraps. */
  protected abstract createControl(): HTMLInputElement | HTMLTextAreaElement;

  connectedCallback() {
    upgradeProperty(this, "value");
    if (!this.#root) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get value(): string {
    return this.#control?.value ?? this.getAttribute("value") ?? "";
  }
  set value(next: string) {
    if (this.#control) this.#control.value = next;
    this.setAttribute("value", next);
  }

  #render() {
    const root = document.createElement("div");
    root.className = "text-field";

    const label = document.createElement("label");
    label.className = "field__label";

    const control = this.createControl();
    control.className = "field__control";
    for (const attr of ["name", "placeholder", "autocomplete", "rows", "type"] as const) {
      const value = this.getAttribute(attr);
      if (value != null) control.setAttribute(attr, value);
    }
    control.value = this.getAttribute("value") ?? "";
    // The host re-emits a CustomEvent with a typed detail; stop the native
    // events here so listeners on the host don't receive them twice.
    for (const type of ["input", "change"] as const) {
      control.addEventListener(type, (event) => {
        event.stopPropagation();
        this.setAttribute("value", control.value);
        emit(this, type, { value: control.value });
      });
    }

    const wrapper = document.createElement("div");
    wrapper.className = "field__input";
    wrapper.appendChild(control);

    root.append(label, wrapper);
    this.appendChild(root);

    this.#root = root;
    this.#label = label;
    this.#control = control;
  }

  #sync() {
    // The ids have to survive attribute changes, so the base id is minted once.
    this.#fieldId ??= core.initialState().id;

    const root = this.#root!;
    const label = this.#label!;
    const control = this.#control!;
    const description = this.getAttribute("description");
    const error = this.getAttribute("error");
    const success = this.getAttribute("success");
    const required = boolAttr(this, "required");
    const disabled = boolAttr(this, "disabled");
    const readOnly = boolAttr(this, "readonly");
    const value = this.getAttribute("value") ?? "";

    root.classList.toggle("text-field--disabled", disabled);
    root.classList.toggle("text-field--success", Boolean(success) && !error);

    const state = core.initialState({
      id: this.#fieldId,
      value,
      required,
      disabled,
      readOnly,
      invalid: Boolean(error),
      hasDescription: Boolean(description),
    });
    const api = core.connect({ state, setValue: (next) => this.setAttribute("value", next) });

    applyProps(label, api.labelProps);
    label.textContent = this.getAttribute("label") ?? "";
    if (required) {
      const marker = document.createElement("span");
      marker.className = "field__required";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = " *";
      label.appendChild(marker);
    }

    applyProps(control, api.controlProps);
    const placeholder = this.getAttribute("placeholder");
    if (placeholder != null) control.placeholder = placeholder;
    // The attribute is the source of truth: typing writes it back, so this
    // only moves the control when the page sets the attribute itself.
    if (control.value !== value) control.value = value;

    this.#description = this.#paragraph(
      this.#description,
      description,
      "field__description",
      api.descriptionProps,
    );
    this.#message = this.#paragraph(
      this.#message,
      error ?? success,
      error ? "field__error" : "field__success",
      error ? api.errorProps : {},
      error ? hazardIcon() : successIcon(),
    );

    // Appending an existing child moves it, so re-running this every sync
    // keeps description before error/success even when error was set first.
    if (this.#description) root.appendChild(this.#description);
    if (this.#message) root.appendChild(this.#message);
  }

  #paragraph(
    current: HTMLParagraphElement | null,
    text: string | null,
    className: string,
    props: Parameters<typeof applyProps>[1],
    icon?: string,
  ): HTMLParagraphElement | null {
    if (!text) {
      current?.remove();
      return null;
    }
    const node = current ?? document.createElement("p");
    const key = `${className}:${text}`;
    if (renderedMessage.get(node) !== key) {
      node.className = className;
      node.textContent = "";
      if (icon) {
        const glyph = document.createElement("span");
        glyph.className = "field__msg-icon";
        glyph.setAttribute("aria-hidden", "true");
        glyph.innerHTML = icon;
        node.appendChild(glyph);
      }
      node.appendChild(document.createTextNode(text));
      renderedMessage.set(node, key);
    }
    applyProps(node, props);
    return node;
  }
}

/**
 * `<ds-text-field>` — a single-line text field.
 *
 * Attributes: `label` (required), `value`, `placeholder`, `description`,
 * `error`, `success`, `required`, `disabled`, `readonly`, `name`, `type`.
 * Properties: `value`.
 * Emits: bubbling `input` CustomEvent with `detail.value`.
 */
export class DsTextField extends DsTextControl {
  protected createControl() {
    const input = document.createElement("input");
    input.type = this.getAttribute("type") ?? "text";
    return input;
  }
}

/**
 * `<ds-textarea>` — the multi-line variant, same attributes plus `rows`.
 */
export class DsTextarea extends DsTextControl {
  protected createControl() {
    return document.createElement("textarea");
  }
}
