import { scrollArea } from "@design-system/core";
import { HTMLElementBase } from "../internal/base";

export type ScrollOrientation = scrollArea.ScrollOrientation;

type Axis = "vertical" | "horizontal";

const OVERFLOW: Record<ScrollOrientation, [x: string, y: string]> = {
  vertical: ["hidden", "auto"],
  horizontal: ["auto", "hidden"],
  both: ["auto", "auto"],
};

/**
 * `<ds-scroll-area>` — a scrollable viewport with custom overlay scrollbars,
 * ported from the Svelte adapter with identical classes. The scrollbar
 * geometry comes from the headless scroll area in `@design-system/core`; the
 * element measures the viewport on scroll and resize and lets a pointer drag
 * the thumb. Native scrollbars are hidden while native keyboard and wheel
 * scrolling stay: the viewport is focusable and scrolls with the arrow keys.
 *
 * The children become the scrolling content. They are moved into the
 * viewport once, on the first connection.
 *
 * Attributes: `orientation` (vertical|horizontal|both), `max-height` (the
 * viewport's maximum block size; "12rem" by default), `label` (makes the
 * viewport a labelled region; give each scroll area on a page its own name).
 */
export class DsScrollArea extends HTMLElementBase {
  static observedAttributes = ["orientation", "max-height", "label"];

  #root: HTMLDivElement | null = null;
  #viewport: HTMLDivElement | null = null;
  #bars: Record<Axis, HTMLDivElement | null> = { vertical: null, horizontal: null };
  #observer: ResizeObserver | null = null;
  #onScroll = () => this.#measure();

  connectedCallback() {
    if (!this.#root) this.#build();
    this.#viewport!.addEventListener("scroll", this.#onScroll, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      this.#observer = new ResizeObserver(() => this.#measure());
      this.#observer.observe(this.#viewport!);
      for (const child of Array.from(this.#viewport!.children)) this.#observer.observe(child);
    }
    this.#sync();
  }

  disconnectedCallback() {
    this.#viewport?.removeEventListener("scroll", this.#onScroll);
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  #orientation(): ScrollOrientation {
    const value = this.getAttribute("orientation");
    return value === "horizontal" || value === "both" ? value : "vertical";
  }

  #build() {
    const root = document.createElement("div");
    root.className = "scroll-area";
    const viewport = document.createElement("div");
    viewport.className = "scroll-area__viewport";
    // A scrollable region has to be reachable by keyboard.
    viewport.tabIndex = 0;
    viewport.append(...Array.from(this.childNodes));
    root.appendChild(viewport);
    this.appendChild(root);
    this.#root = root;
    this.#viewport = viewport;
  }

  #sync() {
    const orientation = this.#orientation();
    const viewport = this.#viewport!;
    this.#root!.dataset.orientation = orientation;
    const label = this.getAttribute("label");
    if (label) {
      viewport.setAttribute("role", "region");
      viewport.setAttribute("aria-label", label);
    } else {
      viewport.removeAttribute("role");
      viewport.removeAttribute("aria-label");
    }
    const [x, y] = OVERFLOW[orientation];
    viewport.style.maxBlockSize = this.getAttribute("max-height") ?? "12rem";
    viewport.style.overflowX = x;
    viewport.style.overflowY = y;
    this.#measure();
  }

  #metrics(axis: Axis) {
    const viewport = this.#viewport!;
    return axis === "vertical"
      ? {
          scrollPos: viewport.scrollTop,
          scrollSize: viewport.scrollHeight,
          clientSize: viewport.clientHeight,
        }
      : {
          scrollPos: viewport.scrollLeft,
          scrollSize: viewport.scrollWidth,
          clientSize: viewport.clientWidth,
        };
  }

  #measure() {
    if (!this.#viewport) return;
    const orientation = this.#orientation();
    for (const axis of ["vertical", "horizontal"] as const) {
      const shown = orientation === axis || orientation === "both";
      const geometry = scrollArea.scrollbar(this.#metrics(axis));
      if (!shown || !geometry.overflow) {
        this.#bars[axis]?.remove();
        this.#bars[axis] = null;
        continue;
      }
      const bar = this.#bars[axis] ?? this.#bar(axis);
      const thumb = bar.firstElementChild as HTMLElement;
      if (axis === "vertical") {
        thumb.style.blockSize = `${geometry.sizeFraction * 100}%`;
        thumb.style.insetBlockStart = `${geometry.offsetFraction * 100}%`;
      } else {
        thumb.style.inlineSize = `${geometry.sizeFraction * 100}%`;
        thumb.style.insetInlineStart = `${geometry.offsetFraction * 100}%`;
      }
    }
  }

  #bar(axis: Axis) {
    const bar = document.createElement("div");
    bar.className =
      axis === "vertical"
        ? "scroll-area__bar scroll-area__bar--v"
        : "scroll-area__bar scroll-area__bar--h";
    bar.setAttribute("aria-hidden", "true");
    const thumb = document.createElement("div");
    thumb.className = "scroll-area__thumb";
    this.#drag(thumb, axis);
    bar.appendChild(thumb);
    // The vertical bar comes first, as in the other adapters.
    if (axis === "vertical" && this.#bars.horizontal)
      this.#root!.insertBefore(bar, this.#bars.horizontal);
    else this.#root!.appendChild(bar);
    this.#bars[axis] = bar;
    return bar;
  }

  #drag(thumb: HTMLElement, axis: Axis) {
    let dragging = false;
    let last = 0;
    const position = (event: PointerEvent) => (axis === "vertical" ? event.clientY : event.clientX);

    thumb.addEventListener("pointerdown", (event) => {
      dragging = true;
      last = position(event);
      thumb.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    thumb.addEventListener("pointermove", (event) => {
      if (!dragging || !this.#viewport) return;
      const current = position(event);
      const delta = current - last;
      last = current;
      const next = scrollArea.scrollByThumbDrag(delta, this.#metrics(axis));
      if (axis === "vertical") this.#viewport.scrollTop = next;
      else this.#viewport.scrollLeft = next;
    });
    thumb.addEventListener("pointerup", (event) => {
      dragging = false;
      if (thumb.hasPointerCapture?.(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
    });
  }
}
