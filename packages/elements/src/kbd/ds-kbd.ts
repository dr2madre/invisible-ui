import { HTMLElementBase, upgradeProperty } from "../internal/base";

const parseKeys = (attr: string | null): string[] =>
  attr ? attr.split(/\s+/).filter(Boolean) : [];

/**
 * `<ds-kbd>` renders a keyboard-shortcut hint with the semantic `<kbd>`
 * element, so assistive tech announces it as keyboard input.
 *
 * Its children are a single key (`<ds-kbd>Esc</ds-kbd>`). For a chord, set
 * `keys`: each key gets its own nested `<kbd>`, joined by a visible
 * `separator` (default "+") that is hidden from assistive tech.
 *
 * Attributes: `keys` (space-separated), `separator`.
 * Properties: `keys` (a string array; use it for a key name that contains a
 * space).
 */
export class DsKbd extends HTMLElementBase {
  static observedAttributes = ["keys", "separator"];

  #root: HTMLElement | null = null;
  #keyNodes: Node[] = [];
  #keys: string[] | null = null;

  connectedCallback() {
    upgradeProperty(this, "keys");
    if (!this.#root) {
      this.#keyNodes = Array.from(this.childNodes);
      this.textContent = "";
      this.#root = document.createElement("kbd");
      this.appendChild(this.#root);
    }
    this.#sync();
  }

  attributeChangedCallback(name: string) {
    if (name === "keys") this.#keys = null;
    if (this.#root) this.#sync();
  }

  get keys(): string[] {
    return this.#keys ?? parseKeys(this.getAttribute("keys"));
  }
  set keys(value: string[]) {
    this.#keys = Array.isArray(value) ? value.map(String) : [];
    if (this.#root) this.#sync();
  }

  #sync() {
    const root = this.#root!;
    const keys = this.keys;
    root.textContent = "";

    if (!keys.length) {
      root.className = "kbd kbd__key";
      root.append(...this.#keyNodes);
      return;
    }

    root.className = "kbd kbd--chord";
    const separator = this.getAttribute("separator") ?? "+";
    keys.forEach((key, index) => {
      if (index > 0) {
        const sep = document.createElement("span");
        sep.className = "kbd__sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        root.appendChild(sep);
      }
      const cap = document.createElement("kbd");
      cap.className = "kbd__key";
      cap.textContent = key;
      root.appendChild(cap);
    });
  }
}
