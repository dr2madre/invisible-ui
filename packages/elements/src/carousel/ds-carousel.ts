import { carousel as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { localized, onLocaleChange, t } from "../internal/i18n";

/** A built-in slide's content (used when the element has no children). */
export interface CarouselSlide {
  /** Background image URL. */
  image?: string;
  /** Title overlaid on the slide. */
  title?: string;
  /** Description overlaid on the slide. */
  description?: string;
}

export type CarouselVariant = "slide" | "gallery" | "coverflow";
export type CarouselOrientation = core.Orientation;

const SVG_NS = "http://www.w3.org/2000/svg";

/** Chevron for the previous and next arrows; `d` picks the direction. */
function arrowGlyph(d: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [name, value] of [
    ["viewBox", "0 0 16 16"],
    ["width", "1em"],
    ["height", "1em"],
    ["aria-hidden", "true"],
    ["focusable", "false"],
  ]) {
    svg.setAttribute(name!, value!);
  }
  const path = document.createElementNS(SVG_NS, "path");
  for (const [name, value] of [
    ["d", d],
    ["fill", "none"],
    ["stroke", "currentColor"],
    ["stroke-width", "1.75"],
    ["stroke-linecap", "round"],
    ["stroke-linejoin", "round"],
  ]) {
    path.setAttribute(name!, value!);
  }
  svg.appendChild(path);
  return svg;
}

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `<ds-carousel>` — a carousel with three layouts, ported from the Svelte
 * adapter with identical classes. `slide` shows one full-bleed slide at a
 * time, `gallery` a scrolling row of items, `coverflow` a 3D flow with the
 * active item centered and its neighbours receding.
 *
 * Behaviour and accessibility come from the headless carousel in
 * `@design-system/core` (WAI-ARIA carousel pattern): a named group of "N of M"
 * slides, previous and next buttons, slide-picker dots, an optional `loop` and
 * arrow-key navigation along the `orientation`. A slide out of view is hidden
 * from assistive technology and inert. The carousel does not rotate on its own.
 *
 * Element children, captured once on the first connection, become the slides,
 * one per child. Without children, the `items` property draws built-in slides
 * (a background image with an overlaid title and description).
 *
 * Attributes: `label` (required: the carousel's accessible name), `variant`
 * (slide|gallery|coverflow; "slide" by default), `orientation`
 * (horizontal|vertical; "horizontal" by default), `loop` (the ends wrap
 * around), `show-indicators` (`show-indicators="false"` hides the dots),
 * `index` (the current slide,
 * from 0), `prev-label` (the previous button's name; "Previous slide" by
 * default), `next-label` (the next button's name; "Next slide" by default).
 * Properties: `items` (built-in slides), `index`.
 * Emits: bubbling `change` CustomEvent with `detail.index` after a user action
 * changes the slide.
 */
export class DsCarousel extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "variant",
    "orientation",
    "loop",
    "show-indicators",
    "index",
    "prev-label",
    "next-label",
  ];

  #items: CarouselSlide[] = [];
  #custom: Element[] = [];
  #index = 0;
  #id = core.initialState({ count: 0 }).id;
  #reflecting = false;

  #root: HTMLElement | null = null;
  #viewport: HTMLDivElement | null = null;
  #track: HTMLDivElement | null = null;
  #prev: HTMLButtonElement | null = null;
  #next: HTMLButtonElement | null = null;
  #indicators: HTMLDivElement | null = null;
  #slides: HTMLDivElement[] = [];
  #dots: HTMLButtonElement[] = [];

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#root) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "items");
    upgradeProperty(this, "index");
    if (!this.#root) this.#build();
    this.#index = core.clampIndex(this.#indexAttr(), this.#count());
    this.#sync();
  }

  attributeChangedCallback(name: string) {
    if (!this.#root || this.#reflecting) return;
    if (name === "index") this.#index = core.clampIndex(this.#indexAttr(), this.#count());
    this.#sync();
  }

  get items(): CarouselSlide[] {
    return this.#items;
  }
  set items(value: CarouselSlide[]) {
    this.#items = Array.isArray(value) ? value : [];
    if (!this.#root) return;
    this.#buildSlides();
    // A shorter list keeps the current slide inside it.
    this.#index = core.clampIndex(this.#index, this.#count());
    this.#sync();
  }

  get index(): number {
    return this.#root ? this.#index : this.#indexAttr();
  }
  set index(value: number) {
    this.setAttribute("index", String(value));
  }

  #indexAttr(): number {
    const value = Number(this.getAttribute("index") ?? 0);
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  #variant(): CarouselVariant {
    const value = this.getAttribute("variant");
    return value === "gallery" || value === "coverflow" ? value : "slide";
  }

  #orientation(): CarouselOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  #count(): number {
    return this.#custom.length || this.#items.length;
  }

  #build() {
    this.#custom = Array.from(this.children);
    this.textContent = "";

    const root = document.createElement("section");
    root.className = "carousel";
    const stage = document.createElement("div");
    stage.className = "carousel__stage";
    const viewport = document.createElement("div");
    viewport.className = "carousel__viewport";
    const track = document.createElement("div");
    track.className = "carousel__track";
    viewport.appendChild(track);

    const prev = document.createElement("button");
    prev.className = "carousel__arrow carousel__arrow--prev";
    prev.appendChild(arrowGlyph("M10 3L5 8l5 5"));
    const next = document.createElement("button");
    next.className = "carousel__arrow carousel__arrow--next";
    next.appendChild(arrowGlyph("M6 3l5 5-5 5"));
    stage.append(viewport, prev, next);

    const indicators = document.createElement("div");
    indicators.className = "carousel__indicators";
    indicators.setAttribute("role", "group");

    root.appendChild(stage);
    this.appendChild(root);
    this.#root = root;
    this.#viewport = viewport;
    this.#track = track;
    this.#prev = prev;
    this.#next = next;
    this.#indicators = indicators;
    this.#buildSlides();
  }

  #buildSlides() {
    const contents = this.#custom.length
      ? this.#custom
      : this.#items.map((item) => this.#builtInSlide(item));
    this.#slides = contents.map((content) => {
      const slide = document.createElement("div");
      slide.className = "carousel__slide";
      slide.appendChild(content);
      return slide;
    });
    this.#track!.replaceChildren(...this.#slides);

    this.#dots = this.#slides.map(() => {
      const dot = document.createElement("button");
      dot.className = "carousel__dot";
      return dot;
    });
    this.#indicators!.replaceChildren(...this.#dots);
  }

  #builtInSlide(item: CarouselSlide): HTMLElement {
    const bg = document.createElement("div");
    bg.className = "carousel__bg";
    // Set through the style object, so the URL can only ever be one value.
    if (item.image) bg.style.backgroundImage = `url(${JSON.stringify(String(item.image))})`;
    if (item.title || item.description) {
      const overlay = document.createElement("div");
      overlay.className = "carousel__overlay";
      if (item.title) {
        const title = document.createElement("p");
        title.className = "carousel__title";
        title.textContent = item.title;
        overlay.appendChild(title);
      }
      if (item.description) {
        const description = document.createElement("p");
        description.className = "carousel__desc";
        description.textContent = item.description;
        overlay.appendChild(description);
      }
      bg.appendChild(overlay);
    }
    return bg;
  }

  #api() {
    return core.connect({
      state: {
        index: this.#index,
        count: this.#count(),
        loop: boolAttr(this, "loop"),
        orientation: this.#orientation(),
        id: this.#id,
      },
      setIndex: (next) => {
        if (next === this.#index) return;
        const focused = document.activeElement;
        this.#index = next;
        this.#reflecting = true;
        this.setAttribute("index", String(next));
        this.#reflecting = false;
        this.#sync();
        this.#keepFocus(focused);
        this.#scrollIntoView();
        emit(this, "change", { index: next });
      },
    });
  }

  // An arrow that turns disabled at an end drops its focus to the page; the
  // other arrow takes it, so the keyboard user stays inside the carousel.
  #keepFocus(focused: Element | null) {
    const prev = this.#prev!;
    const next = this.#next!;
    const other = focused === prev ? next : focused === next ? prev : null;
    if (other && (focused as HTMLButtonElement).disabled && !other.disabled) other.focus();
  }

  // Gallery mode scrolls the active item into view; the other layouts move it
  // with a transform.
  #scrollIntoView() {
    const viewport = this.#viewport!;
    if (this.#variant() !== "gallery" || typeof viewport.scrollTo !== "function") return;
    const slide = this.#slides[this.#index];
    if (slide) {
      viewport.scrollTo({ left: slide.offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }

  // Coverflow: each slide moves along the flow by its signed distance from the
  // active one, recedes with a rotation and a downscale, and the far ones fade.
  #coverflow(slide: HTMLElement, offset: number) {
    const abs = Math.abs(offset);
    const vertical = this.#orientation() === "vertical";
    const translate = vertical
      ? `translateY(calc(var(--ds-carousel-coverflow-spacing, 9rem) * ${offset}))`
      : `translateX(calc(var(--ds-carousel-coverflow-spacing, 11rem) * ${offset}))`;
    const rotate = vertical ? `rotateX(${offset * 8}deg)` : `rotateY(${offset * -18}deg)`;
    const scale = Math.max(0, 1 - abs * 0.15);
    // The neighbours fade on purpose, as in the other adapters (decided
    // 2026-08-04): their text measures below AA beside the active slide.
    const opacity = abs > 2 ? 0 : Math.max(0, 1 - abs * 0.28);
    slide.style.transform = `translate(-50%, -50%) ${translate} ${rotate} scale(${scale.toFixed(3)})`;
    slide.style.opacity = opacity.toFixed(3);
    slide.style.zIndex = String(100 - Math.round(abs));
  }

  #sync() {
    const root = this.#root!;
    const api = this.#api();
    const variant = this.#variant();
    const count = this.#count();

    applyProps(root, api.rootProps);
    root.dataset.variant = variant;
    root.setAttribute("aria-roledescription", t(this, "carousel.roleDescription"));
    const label = this.getAttribute("label");
    if (label) root.setAttribute("aria-label", label);
    else root.removeAttribute("aria-label");

    const viewport = this.#viewport!;
    applyProps(viewport, api.getViewportProps());
    // The gallery viewport is a real scroller, so keyboard users must be able
    // to focus it; arrow keys bubble to the root and move the index.
    if (variant === "gallery") viewport.tabIndex = 0;
    else viewport.removeAttribute("tabindex");

    this.#track!.style.transform =
      variant === "slide" ? `translateX(calc(-1 * ${this.#index} * 100%))` : "";

    this.#slides.forEach((slide, i) => {
      applyProps(slide, api.getSlideProps(i));
      slide.setAttribute("aria-label", t(this, "carousel.slide", { index: i + 1, count }));
      slide.setAttribute("aria-roledescription", t(this, "carousel.slideRoleDescription"));
      // A slide the user cannot see is hidden from assistive technology and
      // taken out of the tab order together.
      const offscreen = variant !== "gallery" && i !== this.#index;
      if (offscreen) slide.setAttribute("aria-hidden", "true");
      else slide.removeAttribute("aria-hidden");
      slide.toggleAttribute("inert", offscreen);
      if (variant === "coverflow") this.#coverflow(slide, i - this.#index);
      else {
        slide.style.removeProperty("transform");
        slide.style.removeProperty("opacity");
        slide.style.removeProperty("z-index");
      }
    });

    applyProps(this.#prev!, api.getPrevProps());
    this.#prev!.setAttribute("aria-label", localized(this, "prev-label", "carousel.previous"));
    applyProps(this.#next!, api.getNextProps());
    this.#next!.setAttribute("aria-label", localized(this, "next-label", "carousel.next"));

    const indicators = this.#indicators!;
    // Moving a node drops its focus, so a dot in place stays put.
    if (!boolAttr(this, "show-indicators", true)) indicators.remove();
    else if (indicators.parentNode !== root) root.appendChild(indicators);
    indicators.setAttribute("aria-label", t(this, "carousel.choose"));
    this.#dots.forEach((dot, i) => {
      applyProps(dot, api.getIndicatorProps(i));
      dot.setAttribute("aria-label", t(this, "carousel.goTo", { index: i + 1 }));
    });
  }
}
