import { pagination as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";

const numberAttr = (element: Element, name: string, fallback: number) => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-pagination>` renders the shared pagination state machine as native
 * buttons inside a labelled navigation landmark.
 *
 * Attributes: `page`, `page-count` (required), `sibling-count`,
 * `boundary-count`, `disabled`, `label`, `previous-label`, `next-label`,
 * `page-label`.
 * Emits: `change` (`detail.page`) after a user action changes the page.
 */
export class DsPagination extends HTMLElementBase {
  static observedAttributes = [
    "page",
    "page-count",
    "sibling-count",
    "boundary-count",
    "disabled",
    "label",
    "previous-label",
    "next-label",
    "page-label",
  ];

  #page = 1;
  #root: HTMLElement | null = null;
  #previous: HTMLButtonElement | null = null;
  #next: HTMLButtonElement | null = null;
  #pages = new Map<number, HTMLButtonElement>();
  #id = core.initialState({ pageCount: 1 }).id;

  connectedCallback() {
    for (const property of ["page", "pageCount", "siblingCount", "boundaryCount", "disabled"])
      upgradeProperty(this, property);
    this.#page = core.clampPage(numberAttr(this, "page", 1), this.pageCount);
    if (!this.#root) this.#render();
    this.#sync();
  }

  attributeChangedCallback(name: string) {
    if (!this.#root) return;
    if (name === "page") {
      this.#page = core.clampPage(numberAttr(this, "page", 1), this.pageCount);
    } else if (name === "page-count") {
      this.#page = core.clampPage(this.#page, this.pageCount);
    }
    this.#sync();
  }

  get page(): number {
    return this.#root ? this.#page : numberAttr(this, "page", 1);
  }
  set page(value: number) {
    this.setAttribute("page", String(value));
  }

  get pageCount(): number {
    return Math.max(1, numberAttr(this, "page-count", 1));
  }
  set pageCount(value: number) {
    this.setAttribute("page-count", String(value));
  }

  get siblingCount(): number {
    return Math.max(0, numberAttr(this, "sibling-count", 1));
  }
  set siblingCount(value: number) {
    this.setAttribute("sibling-count", String(value));
  }

  get boundaryCount(): number {
    return Math.max(0, numberAttr(this, "boundary-count", 1));
  }
  set boundaryCount(value: number) {
    this.setAttribute("boundary-count", String(value));
  }

  get disabled(): boolean {
    return boolAttr(this, "disabled");
  }
  set disabled(value: boolean) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  #render() {
    this.textContent = "";
    const root = document.createElement("nav");
    root.className = "pagination";
    const previous = document.createElement("button");
    previous.className = "pagination__control";
    previous.textContent = "‹";
    const next = document.createElement("button");
    next.className = "pagination__control";
    next.textContent = "›";
    root.append(previous, next);
    this.appendChild(root);
    this.#root = root;
    this.#previous = previous;
    this.#next = next;
  }

  #state(): core.PaginationState {
    return {
      page: this.#page,
      pageCount: this.pageCount,
      siblingCount: this.siblingCount,
      boundaryCount: this.boundaryCount,
      disabled: this.disabled,
      id: this.#id,
    };
  }

  #api() {
    return core.connect({
      state: this.#state(),
      setPage: (next) => {
        if (next === this.#page) return;
        this.#page = next;
        this.setAttribute("page", String(next));
        emit(this, "change", { page: next });
      },
      focus: (value) =>
        this.#root?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)?.focus(),
    });
  }

  #sync() {
    const root = this.#root!;
    const api = this.#api();
    applyProps(root, api.rootProps);
    root.setAttribute("aria-label", this.getAttribute("label") ?? "Pagination");

    applyProps(this.#previous!, api.getPrevProps());
    this.#previous!.setAttribute(
      "aria-label",
      this.getAttribute("previous-label") ?? "Go to previous page",
    );
    applyProps(this.#next!, api.getNextProps());
    this.#next!.setAttribute("aria-label", this.getAttribute("next-label") ?? "Go to next page");

    const desired: HTMLElement[] = [this.#previous!];
    const retainedPages = new Set<number>();
    api.items.forEach((item, index) => {
      if (item === "ellipsis") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "pagination__ellipsis";
        ellipsis.setAttribute("aria-hidden", "true");
        ellipsis.dataset.gap = String(index);
        ellipsis.textContent = "…";
        desired.push(ellipsis);
        return;
      }

      retainedPages.add(item);
      let button = this.#pages.get(item);
      if (!button) {
        button = document.createElement("button");
        button.className = "pagination__page";
        button.textContent = String(item);
        this.#pages.set(item, button);
      }
      applyProps(button, api.getPageProps(item));
      button.setAttribute("aria-label", this.#pageLabel(item));
      desired.push(button);
    });
    desired.push(this.#next!);

    for (const [page, button] of this.#pages) {
      if (!retainedPages.has(page)) {
        button.remove();
        this.#pages.delete(page);
      }
    }
    this.#reconcile(root, desired);
  }

  #pageLabel(page: number) {
    return (this.getAttribute("page-label") ?? "Go to page {page}").replaceAll(
      "{page}",
      String(page),
    );
  }

  #reconcile(parent: HTMLElement, desired: HTMLElement[]) {
    const keep = new Set(desired);
    for (const child of Array.from(parent.children)) {
      if (!keep.has(child as HTMLElement)) child.remove();
    }
    desired.forEach((node, index) => {
      const current = parent.children.item(index);
      if (current !== node) parent.insertBefore(node, current);
    });
  }
}
