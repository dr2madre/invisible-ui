import { HTMLElementBase, upgradeProperty } from "../internal/base";
import { pathIcon } from "../internal/icons";

/** One step of the trail. */
export interface BreadcrumbItem {
  /** Visible label. */
  label: string;
  /** Link target. Omit on the current (last) page. */
  href?: string;
  /** Render a home glyph before the label (typically the first item). */
  home?: boolean;
}

const HOME = "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10";

/**
 * `<ds-breadcrumb>` — a navigation trail (`<nav><ol>`) from the site root to
 * the current page, ported from the Svelte adapter with identical classes.
 * Linked ancestors are underlined; the last item is the current page
 * (`aria-current="page"`) and is never a link. Separators are decorative.
 *
 * Attributes: `label` (the landmark name; "Breadcrumb" by default),
 * `separator` (the text between items; "/" by default).
 * Properties: `items` (the trail, from the root to the current page).
 */
export class DsBreadcrumb extends HTMLElementBase {
  static observedAttributes = ["label", "separator"];

  #items: BreadcrumbItem[] = [];
  #nav: HTMLElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "items");
    if (!this.#nav) {
      this.#nav = document.createElement("nav");
      this.#nav.className = "breadcrumb";
      this.appendChild(this.#nav);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#nav) this.#render();
  }

  get items(): BreadcrumbItem[] {
    return this.#items;
  }
  set items(value: BreadcrumbItem[]) {
    this.#items = Array.isArray(value) ? value : [];
    if (this.#nav) this.#render();
  }

  #home() {
    const glyph = pathIcon(HOME, "breadcrumb__home");
    glyph.setAttribute("width", "1em");
    glyph.setAttribute("height", "1em");
    return glyph;
  }

  #render() {
    const nav = this.#nav!;
    nav.setAttribute("aria-label", this.getAttribute("label") ?? "Breadcrumb");
    const separator = this.getAttribute("separator") ?? "/";

    const list = document.createElement("ol");
    list.className = "breadcrumb__list";
    this.#items.forEach((item, index) => {
      const isLast = index === this.#items.length - 1;
      const li = document.createElement("li");
      li.className = "breadcrumb__item";

      if (index > 0) {
        const sep = document.createElement("span");
        sep.className = "breadcrumb__sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        li.appendChild(sep);
      }

      if (isLast || !item.href) {
        const current = document.createElement("span");
        current.className = "breadcrumb__current";
        if (isLast) current.setAttribute("aria-current", "page");
        if (item.home) current.appendChild(this.#home());
        current.append(item.label);
        li.appendChild(current);
      } else {
        const link = document.createElement("a");
        link.className = "breadcrumb__link";
        link.href = item.href;
        if (item.home) {
          // The glyph stands in for the label, which stays for screen readers.
          const text = document.createElement("span");
          text.className = "breadcrumb__sr";
          text.textContent = item.label;
          link.append(this.#home(), text);
        } else {
          link.textContent = item.label;
        }
        li.appendChild(link);
      }
      list.appendChild(li);
    });

    nav.replaceChildren(list);
  }
}
