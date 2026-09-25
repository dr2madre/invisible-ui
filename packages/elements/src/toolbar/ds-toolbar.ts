import { toolbar as core } from "@design-system/core";
import { boolAttr, HTMLElementBase } from "../internal/base";

export type ToolbarOrientation = core.ToolbarOrientation;

const FOCUSABLE =
  'button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], a[href], input, select, textarea';

/**
 * `<ds-toolbar>` groups related controls under the WAI-ARIA toolbar pattern:
 * one tab stop for the whole group (roving tabindex), arrow keys between the
 * controls (Left/Right when horizontal, Up/Down when vertical), Home and End,
 * wrapping at the ends. Disabled controls are skipped.
 *
 * The element's children are the controls (`ds-button`, native buttons,
 * `ds-separator` to divide groups). Children added, removed or disabled later
 * keep the single tab stop valid; a child appended to the host itself moves
 * into the toolbar.
 *
 * Attributes: `label` (required), `orientation` (horizontal|vertical), `flat`.
 */
export class DsToolbar extends HTMLElementBase {
  static observedAttributes = ["label", "orientation", "flat"];

  #root: HTMLDivElement | null = null;
  #observer: MutationObserver | null = null;
  #tabStop: HTMLElement | null = null;

  connectedCallback() {
    if (!this.#root) this.#render();
    this.#sync();
    this.#adopt();
    this.#reconcile();
    this.#observer ??= new MutationObserver(() => {
      this.#adopt();
      this.#reconcile();
    });
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  #render() {
    const root = document.createElement("div");
    root.className = "toolbar";
    root.setAttribute("role", "toolbar");
    root.addEventListener("keydown", (event) => this.#onKeydown(event));
    root.addEventListener("focusin", (event) => {
      const target = event.target as HTMLElement;
      if (this.#items().includes(target)) this.#setTabStop(target);
    });
    this.#root = root;
    this.#adopt();
    this.appendChild(root);
  }

  #sync() {
    const root = this.#root!;
    const orientation = this.#orientation();
    root.setAttribute("aria-label", this.getAttribute("label") ?? "");
    root.setAttribute("aria-orientation", orientation);
    root.dataset.orientation = orientation;
    root.toggleAttribute("data-flat", boolAttr(this, "flat"));
  }

  /** Move children placed on the host into the toolbar container. */
  #adopt() {
    const root = this.#root!;
    for (const node of Array.from(this.childNodes)) {
      if (node !== root) root.appendChild(node);
    }
  }

  #orientation(): ToolbarOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  /** The controls that belong to this toolbar, not to a nested one. */
  #controls(): HTMLElement[] {
    const root = this.#root;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.closest('[role="toolbar"]') === root,
    );
  }

  #items(): HTMLElement[] {
    return this.#controls().filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true",
    );
  }

  #setTabStop(target: HTMLElement) {
    this.#tabStop = target;
    for (const el of this.#controls()) el.tabIndex = el === target ? 0 : -1;
  }

  #reconcile() {
    const list = this.#items();
    if (list.length === 0) return;
    this.#setTabStop(this.#tabStop && list.includes(this.#tabStop) ? this.#tabStop : list[0]!);
  }

  #onKeydown(event: KeyboardEvent) {
    const list = this.#items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    const next = core.nextIndex({
      key: event.key,
      index: current,
      count: list.length,
      orientation: this.#orientation(),
      direction: getComputedStyle(this.#root!).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    event.preventDefault();
    const target = list[next]!;
    this.#setTabStop(target);
    target.focus();
  }
}
