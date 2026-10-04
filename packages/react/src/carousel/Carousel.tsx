import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { useCarousel, type CarouselOrientation } from "./use-carousel";

/** A built-in slide's content (used when no `renderItem` is given). */
export interface CarouselSlide {
  /** Background image URL (slide variant). */
  image?: string;
  /** Title overlaid on the slide. */
  title?: string;
  /** Description overlaid on the slide. */
  description?: string;
  /** Arbitrary extra data for custom rendering through `renderItem`. */
  [key: string]: unknown;
}

/** What `renderItem` receives for each item. */
export interface CarouselItemContext {
  item: CarouselSlide;
  index: number;
  active: boolean;
}

export type CarouselVariant = "slide" | "gallery" | "coverflow";

export interface CarouselProps {
  items: CarouselSlide[];
  variant?: CarouselVariant;
  /** Coverflow only: lay the flow out horizontally (default) or vertically. */
  orientation?: CarouselOrientation;
  loop?: boolean;
  /** Show the slide-picker dots. Defaults to `true`. */
  showIndicators?: boolean;
  /** Accessible name for the carousel (announced by screen readers). */
  label: string;
  /** Previous button accessible name. Defaults to the catalog's "Previous slide". */
  prevLabel?: string;
  /** Next button accessible name. Defaults to the catalog's "Next slide". */
  nextLabel?: string;
  /** Initial or current slide index (controllable mirror). Defaults to `0`. */
  index?: number;
  /** Called whenever the user moves to another slide. */
  onIndexChange?: (index: number) => void;
  /** Custom markup for every item. Defaults to the built-in slide. */
  renderItem?: (context: CarouselItemContext) => ReactNode;
}

// Coverflow: each slide moves along the flow by its signed distance from the
// active one, recedes with a rotation and a downscale, and the far ones fade
// out. The active slide (offset 0) is centered and upright. The sheet leaves
// these per-slide values to the adapter, since they depend on the index.
function coverflowStyle(offset: number, vertical: boolean): CSSProperties {
  const abs = Math.abs(offset);
  const translate = vertical
    ? `translateY(calc(var(--ds-carousel-coverflow-spacing, 9rem) * ${offset}))`
    : `translateX(calc(var(--ds-carousel-coverflow-spacing, 11rem) * ${offset}))`;
  const rotate = vertical ? `rotateX(${offset * 8}deg)` : `rotateY(${offset * -18}deg)`;
  const scale = Math.max(0, 1 - abs * 0.15);
  // Coverflow recedes its neighbours on purpose: they fade with distance so
  // the active slide reads as the one in front. Their text follows the fade,
  // so a title beside the active slide measures below the AA contrast a body
  // of text needs. Kept as the effect, decided 2026-08-04.
  const opacity = abs > 2 ? 0 : Math.max(0, 1 - abs * 0.28);
  return {
    transform: `translate(-50%, -50%) ${translate} ${rotate} scale(${scale.toFixed(3)})`,
    opacity: opacity.toFixed(3),
    zIndex: 100 - Math.round(abs),
  };
}

function ArrowGlyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Carousel: a styled, accessible carousel with three modes:
 *
 * - `variant="slide"` (default): full-bleed horizontal slides with a
 *   background image and an overlaid title and description, one at a time.
 * - `variant="gallery"`: a horizontally scrolling row of items, such as
 *   cards. `renderItem` renders each one from `{ item, index, active }`.
 * - `variant="coverflow"`: the active item is centered and upright while its
 *   neighbours recede, rotated and scaled down, on either side. Set
 *   `orientation="vertical"` to stack the flow top to bottom.
 *
 * Behaviour and accessibility come from the headless carousel in
 * `@design-system/core`: a labelled group of "N of M" slides, previous and
 * next buttons, slide-picker dots, optional `loop`, and arrow-key
 * navigation. `index` is a controllable mirror (ADR 0011). Themed via
 * `--ds-carousel-*`.
 */
export function Carousel({
  items,
  variant = "slide",
  orientation = "horizontal",
  loop = false,
  showIndicators = true,
  label,
  prevLabel,
  nextLabel,
  index: indexProp = 0,
  onIndexChange,
  renderItem,
}: CarouselProps) {
  const { t, dir } = useI18n();
  const api = useCarousel({
    count: items.length,
    index: indexProp,
    loop,
    orientation,
    onIndexChange,
  });
  const { index } = api;
  const viewportRef = useRef<HTMLDivElement>(null);

  // Gallery mode scrolls the active item into view; slide mode uses a
  // transform, and coverflow positions each slide from its offset.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node || variant !== "gallery" || typeof node.scrollTo !== "function") return;
    const child = node.querySelectorAll<HTMLElement>(".carousel__slide")[index];
    if (child) node.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, [index, variant]);

  // The track flows with the text, so in right-to-left text the next slide
  // sits to the left and the track moves the other way.
  const flow = dir === "rtl" ? 1 : -1;

  return (
    <section
      {...api.rootProps}
      className="carousel"
      data-variant={variant}
      aria-roledescription={t("carousel.roleDescription")}
      aria-label={label}
    >
      <div className="carousel__stage">
        <div
          {...api.getViewportProps()}
          ref={viewportRef}
          className="carousel__viewport"
          // The gallery viewport is a real scroller, so keyboard users must be
          // able to focus it; arrow keys bubble to the root and move the index.
          tabIndex={variant === "gallery" ? 0 : undefined}
        >
          <div
            className="carousel__track"
            // The offset depends on the index, which only the adapter knows.
            style={
              variant === "slide"
                ? { transform: `translateX(calc(${flow} * ${index} * 100%))` }
                : undefined
            }
          >
            {items.map((item, i) => {
              const active = i === index;
              // A slide the user cannot see is hidden from assistive technology
              // and taken out of the tab order together: anything focusable in
              // it would otherwise be reachable while invisible.
              const offscreen = variant !== "gallery" && !active;
              return (
                <div
                  key={i}
                  {...api.getSlideProps(i)}
                  className="carousel__slide"
                  aria-roledescription={t("carousel.slideRoleDescription")}
                  aria-label={t("carousel.slide", { index: i + 1, count: items.length })}
                  style={
                    variant === "coverflow"
                      ? coverflowStyle(i - index, orientation === "vertical")
                      : undefined
                  }
                  aria-hidden={offscreen ? "true" : undefined}
                  inert={offscreen || undefined}
                >
                  {renderItem ? (
                    renderItem({ item, index: i, active })
                  ) : (
                    <div
                      className="carousel__bg"
                      // One quoted URL from data, set through the style object:
                      // it cannot close the value and add declarations.
                      style={
                        item.image
                          ? { backgroundImage: `url(${JSON.stringify(String(item.image))})` }
                          : undefined
                      }
                    >
                      {item.title || item.description ? (
                        <div className="carousel__overlay">
                          {item.title ? <p className="carousel__title">{item.title}</p> : null}
                          {item.description ? (
                            <p className="carousel__desc">{item.description}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          {...api.getPrevProps()}
          className="carousel__arrow carousel__arrow--prev"
          aria-label={prevLabel ?? t("carousel.previous")}
        >
          <ArrowGlyph d="M10 3L5 8l5 5" />
        </button>
        <button
          {...api.getNextProps()}
          className="carousel__arrow carousel__arrow--next"
          aria-label={nextLabel ?? t("carousel.next")}
        >
          <ArrowGlyph d="M6 3l5 5-5 5" />
        </button>
      </div>

      {showIndicators ? (
        <div className="carousel__indicators" role="group" aria-label={t("carousel.choose")}>
          {items.map((_item, i) => (
            <button
              key={i}
              {...api.getIndicatorProps(i)}
              className="carousel__dot"
              aria-label={t("carousel.goTo", { index: i + 1 })}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
