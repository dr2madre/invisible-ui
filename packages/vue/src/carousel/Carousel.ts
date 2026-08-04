import { defineComponent, h, ref, watch, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useCarousel, type CarouselOrientation } from "./use-carousel";

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
  /** Current slide index; bindable with `v-model:index`. */
  index?: number;
  /** Called whenever the current slide changes. */
  onIndexChange?: (index: number) => void;
}

/** Chevron used by the previous/next arrows; `d` picks the direction. */
const ArrowGlyph = (d: string) =>
  h(
    "svg",
    {
      viewBox: "0 0 16 16",
      width: "1em",
      height: "1em",
      "aria-hidden": "true",
      focusable: "false",
    },
    [
      h("path", {
        d,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.75",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ],
  );

/**
 * Carousel — a styled, accessible carousel with three modes, ported from the
 * Svelte adapter:
 *
 * - `variant="slide"` (default): full-bleed horizontal slides with a background
 *   image and an overlaid title/description, one at a time.
 * - `variant="gallery"`: a horizontally-scrolling row of items (e.g. cards, an
 *   album-cover gallery). Provide the item markup via the default slot, which
 *   receives `{ item, index, active }`.
 * - `variant="coverflow"`: a 3D "jukebox" where the active item is centered and
 *   upright while its neighbors recede, rotated and scaled down, peeking from
 *   either side. Set `orientation="vertical"` to stack the flow top to bottom.
 *
 * Behaviour and accessibility come from the headless carousel in
 * `@design-system/core`: a labelled group of "N of M" slides, previous/next
 * buttons, slide-picker dots, optional `loop`, and arrow-key navigation. The
 * control needs an accessible name via `label`. The current slide binds two
 * ways: `v-model:index` or the `index` prop plus `onIndexChange`. Themed via
 * `--ds-carousel-*`.
 */
export const Carousel = defineComponent({
  name: "Carousel",
  props: {
    items: { type: Array as PropType<CarouselSlide[]>, required: true },
    variant: { type: String as PropType<CarouselVariant>, default: "slide" },
    orientation: { type: String as PropType<CarouselOrientation>, default: "horizontal" },
    loop: { type: Boolean, default: false },
    showIndicators: { type: Boolean, default: true },
    label: { type: String, required: true },
    prevLabel: { type: String, default: undefined },
    nextLabel: { type: String, default: undefined },
    index: { type: Number, default: 0 },
    onIndexChange: { type: Function as PropType<(index: number) => void>, default: undefined },
  },
  emits: {
    "update:index": (index: number) => typeof index === "number",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();
    const viewportRef = ref<HTMLElement | null>(null);

    const api = useCarousel(() => ({
      count: props.items.length,
      index: props.index,
      loop: props.loop,
      onIndexChange: (next: number) => {
        emit("update:index", next);
        props.onIndexChange?.(next);
      },
    }));

    // Gallery mode scrolls the active item into view; slide mode uses a
    // transform and coverflow positions each slide from its offset.
    watch(
      () => [api.value.index, props.variant] as const,
      ([index, variant]) => {
        const node = viewportRef.value;
        if (!node || variant !== "gallery" || typeof node.scrollTo !== "function") return;
        const child = node.querySelectorAll<HTMLElement>(".carousel__slide")[index];
        if (child) node.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
      },
      { flush: "post" },
    );

    // Coverflow: position each slide by its signed distance from the active
    // one, translating along the flow axis, receding with a rotation and a
    // downscale, and fading out the far ones. The active slide (offset 0) is
    // centered and upright.
    const coverflowStyle = (offset: number) => {
      const abs = Math.abs(offset);
      const vertical = props.orientation === "vertical";
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
        zIndex: String(100 - Math.round(abs)),
      };
    };

    return () => {
      const { t } = i18n.value;
      const resolvedPrevLabel = props.prevLabel ?? t("carousel.previous");
      const resolvedNextLabel = props.nextLabel ?? t("carousel.next");
      const index = api.value.index;
      const { variant } = props;

      const slideStyle = (i: number) =>
        variant === "coverflow" ? coverflowStyle(i - index) : undefined;

      return h(
        "section",
        {
          ...api.value.rootProps,
          class: "carousel",
          "data-variant": variant,
          "data-orientation": variant === "coverflow" ? props.orientation : undefined,
          "aria-label": props.label,
        },
        [
          h("div", { class: "carousel__stage" }, [
            h(
              "div",
              { ...api.value.getViewportProps(), ref: viewportRef, class: "carousel__viewport" },
              [
                h(
                  "div",
                  {
                    class: "carousel__track",
                    style:
                      variant === "slide"
                        ? { transform: `translateX(calc(-1 * ${index} * 100%))` }
                        : undefined,
                  },
                  props.items.map((item, i) => {
                    const active = i === index;
                    return h(
                      "div",
                      {
                        ...api.value.getSlideProps(i),
                        key: i,
                        class: "carousel__slide",
                        style: slideStyle(i),
                        "aria-hidden":
                          (variant === "slide" || variant === "coverflow") && !active
                            ? "true"
                            : undefined,
                      },
                      slots.default
                        ? slots.default({ item, index: i, active })
                        : [
                            h(
                              "div",
                              {
                                class: "carousel__bg",
                                style: item.image
                                  ? { backgroundImage: `url(${item.image})` }
                                  : undefined,
                              },
                              item.title || item.description
                                ? [
                                    h("div", { class: "carousel__overlay" }, [
                                      item.title
                                        ? h("p", { class: "carousel__title" }, item.title)
                                        : null,
                                      item.description
                                        ? h("p", { class: "carousel__desc" }, item.description)
                                        : null,
                                    ]),
                                  ]
                                : undefined,
                            ),
                          ],
                    );
                  }),
                ),
              ],
            ),

            h(
              "button",
              {
                ...api.value.getPrevProps(),
                class: "carousel__arrow carousel__arrow--prev",
                "aria-label": resolvedPrevLabel,
              },
              [ArrowGlyph("M10 3L5 8l5 5")],
            ),
            h(
              "button",
              {
                ...api.value.getNextProps(),
                class: "carousel__arrow carousel__arrow--next",
                "aria-label": resolvedNextLabel,
              },
              [ArrowGlyph("M6 3l5 5-5 5")],
            ),
          ]),

          props.showIndicators
            ? h(
                "div",
                {
                  class: "carousel__indicators",
                  role: "group",
                  "aria-label": t("carousel.choose"),
                },
                props.items.map((_item, i) =>
                  h("button", {
                    ...api.value.getIndicatorProps(i),
                    key: i,
                    class: "carousel__dot",
                    "aria-label": `Go to slide ${i + 1}`,
                  }),
                ),
              )
            : null,
        ],
      );
    };
  },
});
