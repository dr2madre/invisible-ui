import { defineComponent, h, type PropType } from "vue";
import { useStableId } from "../internal/use-stable-id";

export interface CardProps {
  /** `media` (default): image/icon, text and actions. `dashboard`: a metric tile. */
  variant?: "media" | "dashboard";
  /** Media card layout. Defaults to `vertical`. */
  orientation?: "vertical" | "horizontal";
  /** Image URL for the media area (ignored when the `icon` slot is used). */
  imageSrc?: string;
  /** Alt text for the image. Defaults to empty (decorative). */
  imageAlt?: string;
  /** Card title; rendered as a heading and used to label the card. */
  title?: string;
  /** Heading level for the title (2-6). Defaults to `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Body description text (override with the `description` slot for rich content). */
  description?: string;
  /** Dashboard: the large metric value. */
  value?: string | number;
  /** Dashboard: the smaller change/percentage shown beside the value. */
  change?: string;
  /** Dashboard: direction of the change, for coloring. */
  trend?: "up" | "down" | "neutral";
}

// Stable per-instance ids for the title association, as in Select: a module
// counter keeps the Vue peer range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Card: a presentational content container. Three shapes from one component:
 *
 * - `variant="media"` + `orientation="vertical"` (default): the classic card,
 *   media on top, then tags, title, description, and a footer for actions.
 * - `variant="media"` + `orientation="horizontal"`: media on the left, the
 *   title with a tag beside it and the description below, actions on the right.
 * - `variant="dashboard"`: an icon over a title on the left, a large value with
 *   a smaller change/percentage beside it on the right (a metric tile).
 *
 * The media area is an image (`imageSrc`) or, when the `icon` slot is provided,
 * an icon in its place. Tags and actions are slots so you compose them with the
 * existing `Tag` and `Button` components (e.g. a ghost action on the left and
 * the primary action on the right).
 *
 * Accessibility: renders as an `<article>`; when a `title` prop is given it
 * becomes a heading (level via `headingLevel`) and labels the card
 * (`aria-labelledby`). Colors/spacing are themeable (`--ds-card-*`).
 */
export const Card = defineComponent({
  name: "Card",
  props: {
    variant: { type: String as PropType<"media" | "dashboard">, default: "media" },
    orientation: { type: String as PropType<"vertical" | "horizontal">, default: "vertical" },
    imageSrc: { type: String, default: undefined },
    imageAlt: { type: String, default: "" },
    title: { type: String, default: undefined },
    headingLevel: { type: Number as PropType<2 | 3 | 4 | 5 | 6>, default: 3 },
    description: { type: String, default: undefined },
    value: { type: [String, Number] as PropType<string | number>, default: undefined },
    change: { type: String, default: undefined },
    trend: { type: String as PropType<"up" | "down" | "neutral">, default: "neutral" },
  },
  setup(props, { slots }) {
    const titleId = useStableId("ds-card");

    return () => {
      const labelledBy = props.title ? titleId : undefined;
      const heading = slots.title
        ? slots.title()
        : props.title
          ? h(`h${props.headingLevel}`, { class: "card__title", id: titleId }, props.title)
          : null;

      if (props.variant === "dashboard") {
        return h("article", { class: "card card--dashboard", "aria-labelledby": labelledBy }, [
          h("div", { class: "card__dash-head" }, [
            slots.icon
              ? h("span", { class: "card__icon", "aria-hidden": "true" }, slots.icon())
              : null,
            heading,
          ]),
          h("div", { class: "card__metric" }, [
            props.value != null ? h("span", { class: "card__value" }, props.value) : null,
            props.change
              ? h("span", { class: "card__change", "data-trend": props.trend }, props.change)
              : null,
            slots.metric?.(),
          ]),
        ]);
      }

      const hasMedia = Boolean(props.imageSrc) || Boolean(slots.icon) || Boolean(slots.media);
      const iconMedia = Boolean(slots.icon) && !props.imageSrc && !slots.media;

      return h(
        "article",
        {
          class: "card card--media",
          "data-orientation": props.orientation,
          "aria-labelledby": labelledBy,
        },
        [
          hasMedia
            ? h("div", { class: iconMedia ? "card__media card__media--icon" : "card__media" }, [
                slots.media
                  ? slots.media()
                  : slots.icon
                    ? h("span", { class: "card__icon", "aria-hidden": "true" }, slots.icon())
                    : h("img", { class: "card__image", src: props.imageSrc, alt: props.imageAlt }),
              ])
            : null,
          h("div", { class: "card__body" }, [
            h("div", { class: "card__head" }, [
              heading,
              slots.tags ? h("div", { class: "card__tags" }, slots.tags()) : null,
            ]),
            props.description || slots.description
              ? h(
                  "div",
                  { class: "card__description" },
                  slots.description ? slots.description() : props.description,
                )
              : null,
            slots.default ? h("div", { class: "card__content" }, slots.default()) : null,
          ]),
          slots.actions ? h("div", { class: "card__actions" }, slots.actions()) : null,
        ],
      );
    };
  },
});
