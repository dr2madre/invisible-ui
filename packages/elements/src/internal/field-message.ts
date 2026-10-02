import { hazardIcon } from "./icons";

export interface FieldMessageOptions {
  /**
   * Whether the controls take `aria-invalid` while an error shows. Off for a
   * `role="group"`, which does not support it, and for a control that works
   * out its invalid state itself.
   */
  ariaInvalid?: boolean;
}

/**
 * The `description` and `error` paragraphs of a form control, rendered the way
 * `<ds-text-field>` renders them: the description first, then the error with
 * the hazard glyph as an alert. The shown ones describe the controls through
 * `aria-describedby`.
 */
export class FieldMessages {
  readonly descriptionId: string;
  readonly errorId: string;
  #description: HTMLParagraphElement | null = null;
  #error: HTMLParagraphElement | null = null;

  constructor(baseId: string) {
    this.descriptionId = `${baseId}-description`;
    this.errorId = `${baseId}-error`;
  }

  /**
   * Read the host's `description` and `error` attributes, render them at the
   * end of `container` and wire them to `controls`.
   */
  sync(
    host: Element,
    container: Element,
    controls: Iterable<Element>,
    { ariaInvalid = true }: FieldMessageOptions = {},
  ): void {
    const description = host.getAttribute("description");
    const error = host.getAttribute("error");

    this.#description = paragraph(
      this.#description,
      description,
      "field__description",
      this.descriptionId,
    );
    this.#error = paragraph(this.#error, error, "field__error", this.errorId, true);
    // Moved only when out of place: this runs on every keystroke in some
    // fields, and reinserting an alert can announce it again.
    const tail = [this.#description, this.#error].filter(Boolean) as HTMLParagraphElement[];
    const last = Array.from(container.children).slice(-tail.length);
    if (!tail.every((node, index) => last[index] === node)) {
      for (const node of tail) container.appendChild(node);
    }

    const own = [this.descriptionId, this.errorId];
    const shown = [this.#description?.id, this.#error?.id].filter(Boolean) as string[];
    for (const control of controls) {
      // Ids another source put there stay; only this field's own are replaced.
      const kept = (control.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((id) => id && !own.includes(id));
      const next = [...kept, ...shown];
      if (next.length) control.setAttribute("aria-describedby", next.join(" "));
      else control.removeAttribute("aria-describedby");
      if (!ariaInvalid) continue;
      if (error) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    }
  }
}

/** What each paragraph last rendered, so an unrelated sync keeps its markup. */
const rendered = new WeakMap<HTMLParagraphElement, string>();

function paragraph(
  current: HTMLParagraphElement | null,
  text: string | null,
  className: string,
  id: string,
  alert = false,
): HTMLParagraphElement | null {
  if (!text) {
    current?.remove();
    return null;
  }
  const node = current ?? document.createElement("p");
  if (rendered.get(node) !== text) {
    node.className = `${className} field__message`;
    node.id = id;
    node.textContent = "";
    if (alert) {
      node.setAttribute("role", "alert");
      const glyph = document.createElement("span");
      glyph.className = "field__msg-icon";
      glyph.setAttribute("aria-hidden", "true");
      glyph.innerHTML = hazardIcon();
      node.appendChild(glyph);
    }
    node.appendChild(document.createTextNode(text));
    rendered.set(node, text);
  }
  return node;
}
