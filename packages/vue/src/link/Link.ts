import { defineComponent, h, type PropType } from "vue";

export type LinkVariant = "primary" | "subtle";

export interface LinkProps {
  /** Destination URL. */
  href: string;
  /** Open in a new tab (adds target/rel and a trailing arrow icon). */
  external?: boolean;
  /** Tone down to the surrounding text colour (still underlined on hover). */
  variant?: LinkVariant;
}

/**
 * Link — a styled inline text link rendered with a semantic `<a>`, ported from
 * the Svelte adapter.
 *
 * Violet and underlined by default (the brand selection colour), with a clear
 * hover/focus treatment. Set `external` for links that open in a new tab: it
 * adds `target="_blank"` plus a safe `rel`, and an arrow icon marks it
 * visually.
 *
 * `href` is required: a link navigates. An anchor without a destination is not
 * focusable and carries no link semantics, so an in-page action belongs to
 * Button.
 *
 * Extra attributes fall through to the `<a>`, `onClick` included, for the work
 * that accompanies a navigation. Presentational only, themeable via
 * `--ds-link-*`.
 */
export const Link = defineComponent({
  name: "Link",
  props: {
    href: { type: String, required: true },
    external: { type: Boolean, default: false },
    variant: { type: String as PropType<LinkVariant>, default: "primary" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "a",
        {
          class: "link",
          "data-variant": props.variant,
          href: props.href,
          target: props.external ? "_blank" : undefined,
          rel: props.external ? "noopener noreferrer" : undefined,
        },
        [
          slots.default?.(),
          props.external
            ? h(
                "svg",
                {
                  class: "link__external",
                  viewBox: "0 0 24 24",
                  width: "0.85em",
                  height: "0.85em",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "aria-hidden": "true",
                  focusable: "false",
                },
                [h("path", { d: "M7 17 17 7" }), h("path", { d: "M8 7h9v9" })],
              )
            : null,
        ],
      );
  },
});
