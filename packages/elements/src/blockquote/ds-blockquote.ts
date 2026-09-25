import { HTMLElementBase } from "../internal/base";

/**
 * `<ds-blockquote>` — a block quotation with an optional attribution line,
 * ported from the Svelte adapter with identical classes. The children are the
 * quoted text; the attribution is the `cite` attribute (plain text) or a
 * child with `slot="cite"` (rich content).
 *
 * The quote is a semantic `<blockquote>` and the attribution sits in a
 * `<figcaption>`, so it belongs to the quote and stays out of the quoted
 * text. `cite-url` sets the native `cite` attribute, a machine-readable
 * source that no one sees: give a visible attribution too.
 *
 * Attributes: `cite` (the visible attribution), `cite-url` (the source URL).
 * Regions: `slot="cite"`.
 */
export class DsBlockquote extends HTMLElementBase {
  static observedAttributes = ["cite", "cite-url"];

  #quote: HTMLQuoteElement | null = null;
  #figure: HTMLElement | null = null;
  #caption: HTMLElement | null = null;
  #citeNodes: Node[] = [];

  connectedCallback() {
    if (!this.#figure) this.#render();
    this.#sync();
  }

  attributeChangedCallback() {
    if (this.#figure) this.#sync();
  }

  #render() {
    const cite = new Set<Node>(
      Array.from(this.children).filter((child) => child.getAttribute("slot") === "cite"),
    );
    for (const child of cite) (child as Element).removeAttribute("slot");
    this.#citeNodes = [...cite];

    const figure = document.createElement("figure");
    figure.className = "blockquote";
    const quote = document.createElement("blockquote");
    quote.className = "blockquote__quote";
    quote.append(...Array.from(this.childNodes).filter((node) => !cite.has(node)));
    const caption = document.createElement("figcaption");
    caption.className = "blockquote__cite";
    caption.append(...cite);
    figure.appendChild(quote);

    this.#figure = figure;
    this.#quote = quote;
    this.#caption = caption;
    this.replaceChildren(figure);
  }

  #sync() {
    const url = this.getAttribute("cite-url");
    if (url) this.#quote!.setAttribute("cite", url);
    else this.#quote!.removeAttribute("cite");

    const text = this.getAttribute("cite");
    const caption = this.#caption!;
    if (!this.#citeNodes.length) caption.textContent = text ?? "";
    // No attribution, no caption: an empty one would still draw its dash.
    if (this.#citeNodes.length || text) this.#figure!.appendChild(caption);
    else caption.remove();
  }
}
