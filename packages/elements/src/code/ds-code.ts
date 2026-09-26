import { HTMLElementBase } from "../internal/base";

/**
 * `<ds-code>` — inline code: a short run of monospaced text inside a sentence
 * (the `<code>` element), such as a function name, a flag or a value. Ported
 * from the Svelte adapter with identical classes. For a multi-line block use
 * `<ds-code-block>`.
 *
 * Presentational only: its content is the meaning. The children move into the
 * `<code>` element once, on the first connection. Colors and the surface tint
 * are themeable CSS custom properties (`--ds-code-*`).
 */
export class DsCode extends HTMLElementBase {
  static observedAttributes: string[] = [];

  #root: HTMLElement | null = null;

  connectedCallback() {
    if (this.#root) return;
    const code = document.createElement("code");
    code.className = "code";
    code.append(...Array.from(this.childNodes));
    this.appendChild(code);
    this.#root = code;
  }
}
