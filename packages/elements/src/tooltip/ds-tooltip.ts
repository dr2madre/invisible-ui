import { tooltip as core } from "@design-system/core";
import { applyProps, HTMLElementBase, nextId } from "../internal/base";
import { attachFloating, type Placement } from "../internal/floating";

const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

const numberAttr = (element: Element, name: string, fallback: number) => {
  const value = Number(element.getAttribute(name));
  return element.hasAttribute(name) && Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-tooltip>` — a descriptive label shown on hover or focus of the control
 * it wraps (`role="tooltip"`, linked with `aria-describedby`). Ported from the
 * Vue adapter, class names kept identical.
 *
 * The children are the trigger: wrap one focusable control. The tooltip opens
 * after a delay on hover and at once on keyboard focus, stays open while the
 * pointer is over it, and Escape hides it (WCAG 1.4.13). On touch, where there
 * is no hover, a tap toggles it. It is positioned with Floating UI and never
 * takes focus.
 *
 * Attributes: `text` (required), `placement` (Floating UI placement, `top` by
 * default), `open-delay` (ms, 300), `close-delay` (ms, 100).
 */
export class DsTooltip extends HTMLElementBase {
  static observedAttributes = ["text", "placement"];

  #id = nextId("ds-tooltip");
  #open = false;
  #tip: HTMLDivElement | null = null;
  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #stop: (() => void) | null = null;
  #touch = false;

  connectedCallback() {
    this.classList.add("tooltip__trigger");
    this.addEventListener("pointerenter", this.#onPointerEnter);
    this.addEventListener("pointerleave", this.#onLeave);
    this.addEventListener("focusin", this.#onFocusIn);
    this.addEventListener("focusout", this.#onFocusOut);
    this.addEventListener("pointerdown", this.#onPointerDown);
    this.addEventListener("click", this.#onClick);
    this.#sync();
  }

  disconnectedCallback() {
    this.#hold();
    this.#setOpen(false);
    this.removeEventListener("pointerenter", this.#onPointerEnter);
    this.removeEventListener("pointerleave", this.#onLeave);
    this.removeEventListener("focusin", this.#onFocusIn);
    this.removeEventListener("focusout", this.#onFocusOut);
    this.removeEventListener("pointerdown", this.#onPointerDown);
    this.removeEventListener("click", this.#onClick);
  }

  attributeChangedCallback() {
    if (this.#tip) this.#tip.textContent = this.getAttribute("text") ?? "";
  }

  /** The control the tooltip describes: the first focusable child, else the host. */
  #trigger(): HTMLElement {
    return this.querySelector<HTMLElement>(FOCUSABLE) ?? this;
  }

  #hold() {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #show(delay = numberAttr(this, "open-delay", 300)) {
    this.#hold();
    if (delay <= 0) this.#setOpen(true);
    else this.#showTimer = setTimeout(() => this.#setOpen(true), delay);
  }

  #hide(delay = numberAttr(this, "close-delay", 100)) {
    this.#hold();
    if (delay <= 0) this.#setOpen(false);
    else this.#hideTimer = setTimeout(() => this.#setOpen(false), delay);
  }

  #onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") this.#show();
  };
  #onLeave = () => this.#hide();
  // Keyboard focus shows at once.
  #onFocusIn = () => this.#show(0);
  #onFocusOut = () => this.#hide(0);
  // Touch has no hover; the tap owns touch, so the tooltip does not flash.
  #onPointerDown = (event: PointerEvent) => {
    this.#touch = event.pointerType !== "mouse";
  };
  #onClick = () => {
    if (!this.#touch) return;
    if (this.#open) this.#hide(0);
    else this.#show(0);
  };
  #onKeyDown = (event: KeyboardEvent) => {
    // Dismissable: Escape hides at once, even while hovering.
    if (event.key === "Escape") this.#hide(0);
  };

  #setOpen(next: boolean) {
    if (this.#open === next) return;
    this.#open = next;
    if (next) {
      const tip = document.createElement("div");
      tip.className = "tooltip__content";
      tip.textContent = this.getAttribute("text") ?? "";
      // Hoverable: the pointer may move onto the tooltip without closing it.
      tip.addEventListener("pointerenter", () => this.#hold());
      tip.addEventListener("pointerleave", () => this.#hide());
      document.body.appendChild(tip);
      this.#tip = tip;
      this.#stop = attachFloating(this, tip, {
        placement: (this.getAttribute("placement") as Placement | null) ?? "top",
        offset: 6,
      });
      document.addEventListener("keydown", this.#onKeyDown);
    } else {
      this.#stop?.();
      this.#stop = null;
      this.#tip?.remove();
      this.#tip = null;
      document.removeEventListener("keydown", this.#onKeyDown);
    }
    this.#sync();
  }

  #sync() {
    const api = core.connect({ state: { open: this.#open, id: this.#id } });
    applyProps(this.#trigger(), api.triggerProps);
    if (this.#tip) applyProps(this.#tip, api.tooltipProps);
  }
}
