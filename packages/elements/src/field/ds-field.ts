import { field as core } from "@design-system/core";
import { applyProps, boolAttr, HTMLElementBase } from "../internal/base";

/**
 * `<ds-field>` — the generic form field wrapper as a custom element: it ties a
 * label, a description and an error message to whatever control the page puts
 * inside it.
 *
 * Light DOM: the control stays the page's own element. The core supplies the
 * ids and this element writes them onto the first form control among its
 * children, so `for`, `aria-describedby`, `aria-invalid` and `aria-required`
 * hold without the page repeating them.
 *
 * ```html
 * <ds-field label="Email" description="We'll never share it.">
 *   <input type="email" />
 * </ds-field>
 * ```
 *
 * Attributes: `label` (required), `description`, `error`, `required`,
 * `disabled`, `field-id`.
 */
export class DsField extends HTMLElementBase {
  static observedAttributes = ["label", "description", "error", "required", "disabled"];

  #root: HTMLElement | null = null;
  #label: HTMLLabelElement | null = null;
  #control: HTMLElement | null = null;
  #description: HTMLParagraphElement | null = null;
  #error: HTMLParagraphElement | null = null;
  #fieldId: string | null = null;

  connectedCallback() {
    if (!this.#root) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  #render() {
    const control = this.querySelector<HTMLElement>("input, textarea, select, [data-ds-control]");

    const root = document.createElement("div");
    root.className = "form-field";

    const label = document.createElement("label");
    label.className = "field__label";

    root.appendChild(label);
    if (control) root.appendChild(control);
    this.appendChild(root);

    this.#root = root;
    this.#label = label;
    this.#control = control;
  }

  #sync() {
    // The ids have to survive attribute changes, so the base id is minted once.
    this.#fieldId ??= this.getAttribute("field-id") ?? core.initialState().id;

    const root = this.#root!;
    const label = this.#label!;
    const description = this.getAttribute("description");
    const error = this.getAttribute("error");
    const required = boolAttr(this, "required");
    const disabled = boolAttr(this, "disabled");

    const api = core.connect({
      state: core.initialState({
        id: this.#fieldId ?? undefined,
        required,
        disabled,
        invalid: Boolean(error),
        hasDescription: Boolean(description),
        hasError: Boolean(error),
      }),
    });

    root.classList.toggle("form-field--disabled", disabled);
    applyProps(root, api.rootProps);
    applyProps(label, api.labelProps);

    label.textContent = this.getAttribute("label") ?? "";
    if (required) {
      const marker = document.createElement("span");
      marker.className = "field__required";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = "*";
      label.appendChild(marker);
    }

    if (this.#control) applyProps(this.#control, api.controlProps);

    this.#description = this.#message(
      this.#description,
      description,
      "field__description",
      api.descriptionProps,
    );
    this.#error = this.#message(this.#error, error, "field__error", api.errorProps);
  }

  /** Add, update or drop one of the two message paragraphs. */
  #message(
    current: HTMLParagraphElement | null,
    text: string | null,
    className: string,
    props: Parameters<typeof applyProps>[1],
  ): HTMLParagraphElement | null {
    if (!text) {
      current?.remove();
      return null;
    }
    const node = current ?? document.createElement("p");
    node.className = className;
    node.textContent = text;
    applyProps(node, props);
    if (!node.isConnected) this.#root!.appendChild(node);
    return node;
  }
}
