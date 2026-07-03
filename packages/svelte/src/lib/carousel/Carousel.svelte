<script module lang="ts">
  /** A built-in slide's content (used when no default slot is provided). */
  export interface CarouselSlide {
    /** Background image URL (slide variant). */
    image?: string;
    /** Title overlaid on the slide. */
    title?: string;
    /** Description overlaid on the slide. */
    description?: string;
    /** Arbitrary extra data for custom rendering via the default slot. */
    [key: string]: unknown;
  }
</script>

<script lang="ts">
  /**
   * Carousel — a styled, accessible carousel with two modes:
   *
   * - `variant="slide"` (default): full-bleed horizontal slides with a background
   *   image and an overlaid title/description, one at a time.
   * - `variant="gallery"`: a horizontally-scrolling row of items (e.g. cards —
   *   an album/LP-cover gallery). Provide the item markup via the default slot
   *   (`let:item let:index let:active`).
   * - `variant="coverflow"`: a 3D "jukebox" — the active item is centered and
   *   upright while its neighbors recede, rotated and scaled down, peeking from
   *   either side. Set `orientation="vertical"` to stack the flow top-to-bottom.
   *
   * Behaviour and accessibility come from the headless carousel in
   * `@design-system/core`: a labelled group of "N of M" slides, previous/next
   * buttons, slide-picker dots, optional `loop`, and arrow-key navigation. The
   * control needs an accessible name via `label`. Themed via `--ds-carousel-*`.
   */
  import { createCarousel, type CarouselContext } from "./create-carousel";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let items: CarouselSlide[];
  export let variant: "slide" | "gallery" | "coverflow" = "slide";
  /** Coverflow only: lay the flow out horizontally (default) or vertically. */
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let loop = false;
  /** Show the slide-picker dots. Defaults to `true`. */
  export let showIndicators = true;
  /** Accessible name for the carousel (announced by screen readers). */
  export let label: string;
  /** Previous button accessible name. Defaults to the i18n catalog's "Previous slide". */
  export let prevLabel: string | undefined = undefined;
  /** Next button accessible name. Defaults to the i18n catalog's "Next slide". */
  export let nextLabel: string | undefined = undefined;
  /** Called whenever the current slide changes. */
  export let onIndexChange: ((index: number) => void) | undefined = undefined;

  const context: CarouselContext = {
    count: items.length,
    loop,
    onIndexChange,
  };

  const carousel = createCarousel(context);
  const {
    rootAction,
    viewportAction,
    slideAction,
    prevAction,
    nextAction,
    indicatorAction,
    index,
  } = carousel;

  let viewportEl: HTMLElement | undefined;

  $: resolvedPrevLabel = prevLabel ?? $t("carousel.previous");
  $: resolvedNextLabel = nextLabel ?? $t("carousel.next");

  // Gallery mode scrolls the active item into view; slide mode uses a transform.
  $: if (viewportEl && variant === "gallery" && typeof viewportEl.scrollTo === "function") {
    const child = viewportEl.querySelectorAll<HTMLElement>(".carousel__slide")[$index];
    if (child) viewportEl.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }

  // Coverflow: position each slide by its signed distance from the active one —
  // translate along the flow axis, recede with a rotation + downscale, and fade
  // out the far ones. The active slide (offset 0) is centered and upright.
  function coverflowStyle(offset: number): string {
    const abs = Math.abs(offset);
    const vertical = orientation === "vertical";
    const translate = vertical
      ? `translateY(calc(var(--ds-carousel-coverflow-spacing, 9rem) * ${offset}))`
      : `translateX(calc(var(--ds-carousel-coverflow-spacing, 11rem) * ${offset}))`;
    const rotate = vertical ? `rotateX(${offset * 8}deg)` : `rotateY(${offset * -18}deg)`;
    const scale = Math.max(0, 1 - abs * 0.15);
    const opacity = abs > 2 ? 0 : Math.max(0, 1 - abs * 0.28);
    return [
      `transform: translate(-50%, -50%) ${translate} ${rotate} scale(${scale.toFixed(3)})`,
      `opacity: ${opacity.toFixed(3)}`,
      `z-index: ${100 - Math.round(abs)}`,
    ].join("; ");
  }
</script>

<section
  class="carousel"
  data-variant={variant}
  data-orientation={variant === "coverflow" ? orientation : undefined}
  use:rootAction
  aria-label={label}
>
  <div class="carousel__stage">
    <div class="carousel__viewport" bind:this={viewportEl} use:viewportAction>
      <div
        class="carousel__track"
        style={variant === "slide"
          ? `transform: translateX(calc(-1 * ${$index} * 100%))`
          : undefined}
      >
        {#each items as item, i (i)}
          {@const active = i === $index}
          <div
            class="carousel__slide"
            use:slideAction={i}
            style={variant === "coverflow" ? coverflowStyle(i - $index) : undefined}
            aria-hidden={(variant === "slide" || variant === "coverflow") && !active
              ? "true"
              : undefined}
          >
            {#if $$slots.default}
              <slot {item} index={i} {active} />
            {:else}
              <div
                class="carousel__bg"
                style={item.image ? `background-image: url(${item.image})` : undefined}
              >
                {#if item.title || item.description}
                  <div class="carousel__overlay">
                    {#if item.title}<p class="carousel__title">{item.title}</p>{/if}
                    {#if item.description}<p class="carousel__desc">{item.description}</p>{/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <button
      class="carousel__arrow carousel__arrow--prev"
      use:prevAction
      aria-label={resolvedPrevLabel}
    >
      <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
        <path
          d="M10 3L5 8l5 5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <button
      class="carousel__arrow carousel__arrow--next"
      use:nextAction
      aria-label={resolvedNextLabel}
    >
      <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
        <path
          d="M6 3l5 5-5 5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>

  {#if showIndicators}
    <div class="carousel__indicators" role="group" aria-label="Choose slide">
      {#each items as _item, i (i)}
        <button class="carousel__dot" use:indicatorAction={i} aria-label={`Go to slide ${i + 1}`}
        ></button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .carousel {
    position: relative;
    inline-size: 100%;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }

  /* Positioning context for the arrows so they center on the slides only, not
     the whole carousel (which also includes the indicator dots below). */
  .carousel__stage {
    position: relative;
  }
  .carousel__viewport {
    overflow: hidden;
    border-radius: var(--ds-carousel-radius, var(--ds-radius-surface, 0.75rem));
  }

  .carousel__track {
    display: flex;
    transition: transform var(--ds-carousel-transition, 350ms ease);
  }

  /* ---- Slide mode: one full-bleed slide at a time ---- */
  .carousel[data-variant="slide"] .carousel__slide {
    flex: 0 0 100%;
    min-inline-size: 0;
  }
  .carousel__bg {
    display: flex;
    align-items: flex-end;
    aspect-ratio: var(--ds-carousel-aspect, 16 / 9);
    background-color: var(--ds-carousel-slide-bg, var(--ds-color-neutral-surface, #e2e8f0));
    background-size: cover;
    background-position: center;
  }
  /* Image-less slides cycle through the pastel set (an image overrides the color). */
  .carousel[data-variant="slide"] .carousel__slide:nth-child(5n + 1) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-pink, #e5a1ac));
  }
  .carousel[data-variant="slide"] .carousel__slide:nth-child(5n + 2) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-violet, #b8a1e6));
  }
  .carousel[data-variant="slide"] .carousel__slide:nth-child(5n + 3) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-teal, #7abecc));
  }
  .carousel[data-variant="slide"] .carousel__slide:nth-child(5n + 4) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-green, #8dcc7a));
  }
  .carousel[data-variant="slide"] .carousel__slide:nth-child(5n + 5) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-yellow, #e5cb44));
  }
  .carousel__overlay {
    inline-size: 100%;
    padding: var(--ds-carousel-overlay-padding, 1.5rem);
    color: var(--ds-carousel-overlay-text, #fff);
    background: var(
      --ds-carousel-overlay-bg,
      linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))
    );
  }
  .carousel__title {
    margin: 0;
    font-size: var(--ds-carousel-title-size, 1.5rem);
    font-weight: 700;
    line-height: 1.2;
  }
  .carousel__desc {
    margin: 0.35rem 0 0;
    line-height: 1.45;
    opacity: 0.95;
  }

  /* ---- Gallery mode: scrolling row of items ---- */
  .carousel[data-variant="gallery"] .carousel__viewport {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .carousel[data-variant="gallery"] .carousel__viewport::-webkit-scrollbar {
    display: none;
  }
  .carousel[data-variant="gallery"] .carousel__track {
    gap: var(--ds-carousel-gap, 1rem);
    transition: none;
  }
  .carousel[data-variant="gallery"] .carousel__slide {
    flex: 0 0 auto;
    inline-size: var(--ds-carousel-item-size, 14rem);
    scroll-snap-align: start;
  }

  /* ---- Coverflow ("jukebox"): a 3D flow with the active item centered ---- */
  .carousel[data-variant="coverflow"] .carousel__viewport {
    position: relative;
    block-size: var(--ds-carousel-coverflow-height, 16rem);
    /* The perspective makes the receding neighbors read as 3D. */
    perspective: var(--ds-carousel-coverflow-perspective, 1200px);
  }
  .carousel[data-variant="coverflow"] .carousel__track {
    display: block;
    block-size: 100%;
    transform-style: preserve-3d;
  }
  .carousel[data-variant="coverflow"] .carousel__slide {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    inline-size: var(--ds-carousel-coverflow-size, 12rem);
    /* The per-slide transform/opacity/z-index are set inline from the active
       offset; this transition animates them as the active item changes. */
    transition:
      transform var(--ds-carousel-transition, 350ms ease),
      opacity var(--ds-carousel-transition, 350ms ease);
    will-change: transform;
  }
  .carousel[data-variant="coverflow"] .carousel__bg {
    aspect-ratio: 1;
    border-radius: var(--ds-carousel-radius, var(--ds-radius-surface, 0.75rem));
    overflow: hidden;
    box-shadow: 0 8px 20px -6px rgb(0 0 0 / 0.35);
  }
  /* Pastel set for image-less coverflow cards (mirrors the slide variant). */
  .carousel[data-variant="coverflow"] .carousel__slide:nth-child(5n + 1) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-pink, #e5a1ac));
  }
  .carousel[data-variant="coverflow"] .carousel__slide:nth-child(5n + 2) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-violet, #b8a1e6));
  }
  .carousel[data-variant="coverflow"] .carousel__slide:nth-child(5n + 3) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-teal, #7abecc));
  }
  .carousel[data-variant="coverflow"] .carousel__slide:nth-child(5n + 4) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-green, #8dcc7a));
  }
  .carousel[data-variant="coverflow"] .carousel__slide:nth-child(5n + 5) .carousel__bg {
    background-color: var(--ds-carousel-slide-bg, var(--ds-pastel-yellow, #e5cb44));
  }
  /* Vertical jukebox: a taller viewport so stacked neighbors have room. */
  .carousel[data-variant="coverflow"][data-orientation="vertical"] .carousel__viewport {
    block-size: var(--ds-carousel-coverflow-height, 22rem);
  }
  @media (prefers-reduced-motion: reduce) {
    .carousel[data-variant="coverflow"] .carousel__slide {
      transition: none;
    }
  }

  /* ---- Controls ---- */
  .carousel__arrow {
    position: absolute;
    inset-block-start: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--ds-carousel-arrow-size, 2.25rem);
    block-size: var(--ds-carousel-arrow-size, 2.25rem);
    font-size: 1.1rem;
    color: var(--ds-carousel-arrow-text, var(--ds-color-text, #0f172a));
    background: var(--ds-carousel-arrow-bg, var(--ds-color-surface, #fff));
    border: 1px solid var(--ds-carousel-arrow-border, var(--ds-color-border, #e2e8f0));
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    cursor: pointer;
  }
  .carousel__arrow--prev {
    inset-inline-start: var(--ds-carousel-arrow-offset, 0.5rem);
  }
  .carousel__arrow--next {
    inset-inline-end: var(--ds-carousel-arrow-offset, 0.5rem);
  }
  .carousel__arrow:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .carousel__arrow:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .carousel__indicators {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    margin-block-start: 0.75rem;
  }
  .carousel__dot {
    inline-size: var(--ds-carousel-dot-size, 0.5rem);
    block-size: var(--ds-carousel-dot-size, 0.5rem);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--ds-carousel-dot-color, var(--ds-color-border, #cbd5e1));
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  .carousel__dot[data-selected] {
    background: var(--ds-carousel-dot-active, var(--ds-color-primary, #2563eb));
  }
  .carousel__dot:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
</style>
