import { boolAttr, HTMLElementBase, upgradeProperty } from "../internal/base";
import { localized, onLocaleChange, t } from "../internal/i18n";

/** How long the "Copied" confirmation stays up, in ms. */
const COPIED_DURATION = 2000;

/**
 * `<ds-code-block>` — block code: a multi-line, monospaced, preformatted
 * snippet (`<pre><code>`), ported from the Svelte adapter with identical
 * classes. The `code` attribute or property holds the source: it keeps its
 * whitespace, is always inserted as text and is what the copy button copies.
 *
 * Syntax highlighting stays with the caller: element children, captured once
 * on the first connection, render in place of the plain source. `code` still
 * drives the copy button; without it the button copies the children's text.
 *
 * The block is a named group. The scroller is a focusable, named group too, so
 * keyboard users can reach and scroll wide samples; several blocks on a page
 * stay off the landmark list. The copy button announces success through a
 * polite live region.
 *
 * Attributes: `code` (the source text), `language` (a caption such as a
 * language or a filename), `copyable` (`copyable="false"` removes the copy
 * button), `copy-label` (the copy button's name; "Copy code" by default).
 * Properties: `code`.
 */
export class DsCodeBlock extends HTMLElementBase {
  static observedAttributes = ["code", "language", "copyable", "copy-label"];

  #figure: HTMLElement | null = null;
  #header: HTMLElement | null = null;
  #lang: HTMLSpanElement | null = null;
  #copy: HTMLButtonElement | null = null;
  #pre: HTMLPreElement | null = null;
  #code: HTMLElement | null = null;
  #live: HTMLSpanElement | null = null;
  #markup: Node[] = [];
  #copied = false;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#figure) this.#render();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "code");
    if (!this.#figure) this.#build();
    this.#render();
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.#copied = false;
  }

  attributeChangedCallback() {
    if (this.#figure) this.#render();
  }

  get code(): string {
    return this.getAttribute("code") ?? "";
  }
  set code(value: string) {
    this.setAttribute("code", String(value ?? ""));
  }

  #build() {
    this.#markup = Array.from(this.childNodes).filter(
      (node) => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim(),
    );
    this.textContent = "";

    const figure = document.createElement("figure");
    figure.className = "code-block";
    figure.setAttribute("role", "group");

    const header = document.createElement("figcaption");
    header.className = "code-block__header";
    const lang = document.createElement("span");
    lang.className = "code-block__lang";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "code-block__copy";
    copy.addEventListener("click", () => void this.#copyCode());

    const pre = document.createElement("pre");
    pre.className = "code-block__pre";
    pre.tabIndex = 0;
    pre.setAttribute("role", "group");
    const code = document.createElement("code");
    code.className = "code-block__code";
    pre.appendChild(code);

    const live = document.createElement("span");
    live.className = "code-block__live";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");

    figure.append(pre, live);
    this.appendChild(figure);
    this.#figure = figure;
    this.#header = header;
    this.#lang = lang;
    this.#copy = copy;
    this.#pre = pre;
    this.#code = code;
    this.#live = live;
  }

  #source(): string {
    return this.code || (this.#markup.length ? (this.#code?.textContent ?? "") : "");
  }

  async #copyCode() {
    try {
      await navigator.clipboard?.writeText(this.#source());
      this.#copied = true;
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => {
        this.#copied = false;
        if (this.#figure) this.#render();
      }, COPIED_DURATION);
      this.#render();
    } catch {
      // The clipboard can be unavailable (an insecure context, a denied
      // permission): nothing was copied, so nothing is announced.
    }
  }

  #render() {
    const figure = this.#figure!;
    const header = this.#header!;
    const lang = this.#lang!;
    const copy = this.#copy!;
    const language = this.getAttribute("language") || "";
    const copyable = boolAttr(this, "copyable", true);

    figure.setAttribute(
      "aria-label",
      language ? t(this, "codeBlock.labelLanguage", { language }) : t(this, "codeBlock.label"),
    );

    if (language) {
      lang.textContent = language;
      header.prepend(lang);
    } else lang.remove();

    if (copyable) {
      copy.setAttribute("aria-label", localized(this, "copy-label", "codeBlock.copy"));
      copy.textContent = t(this, this.#copied ? "codeBlock.copiedText" : "codeBlock.copyText");
      header.appendChild(copy);
    } else copy.remove();

    if (language || copyable) figure.prepend(header);
    else header.remove();

    this.#pre!.setAttribute(
      "aria-label",
      language ? t(this, "codeBlock.sampleLanguage", { language }) : t(this, "codeBlock.sample"),
    );

    const code = this.#code!;
    if (this.#markup.length) {
      if (code.firstChild !== this.#markup[0]) code.replaceChildren(...this.#markup);
    } else if (code.textContent !== this.code) {
      // Text, never markup: a code sample is exactly what it says.
      code.textContent = this.code;
    }

    this.#live!.textContent = this.#copied && copyable ? t(this, "codeBlock.copied") : "";
  }
}
