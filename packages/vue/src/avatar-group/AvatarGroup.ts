import { defineComponent, h, type PropType } from "vue";
import { Avatar } from "../avatar/Avatar";

export interface AvatarGroupItem {
  /** Required: accessible name + initials fallback. */
  name: string;
  /** Image URL; falls back to initials when absent or it fails to load. */
  src?: string;
  /** Accessible name override; defaults to `name`. */
  alt?: string;
  /** Optional background tint for the initials avatar (any CSS color). */
  color?: string;
}

export interface AvatarGroupProps {
  /** The people in the group. */
  items: AvatarGroupItem[];
  /** Maximum avatars to show before collapsing the rest into a "+N" chip. */
  max?: number;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
  /** Accessible name for the group (announced by screen readers). */
  label: string;
}

/**
 * AvatarGroup: a row of overlapping avatars (a team, attendees, collaborators).
 * Caps the visible count at `max` and renders a "+N" overflow chip for the rest.
 *
 * Accessibility:
 * - The row is a labelled group (`role="group"` + `label`) so assistive tech
 *   announces what the cluster represents.
 * - Each avatar keeps its own accessible name (via `Avatar`); the overflow chip
 *   exposes how many more there are ("N more").
 *
 * Overlap, ring, size and shape are themeable CSS custom properties
 * (`--ds-avatar-group-*`), inheriting the `Avatar` tokens.
 */
export const AvatarGroup = defineComponent({
  name: "AvatarGroup",
  props: {
    items: { type: Array as PropType<AvatarGroupItem[]>, required: true },
    max: { type: Number, default: 4 },
    size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
    shape: { type: String as PropType<"circle" | "square">, default: "circle" },
    label: { type: String, required: true },
  },
  setup(props) {
    return () => {
      const visible = props.items.slice(0, props.max);
      const overflow = Math.max(0, props.items.length - visible.length);

      return h(
        "div",
        {
          class: "avatar-group",
          "data-size": props.size,
          "data-shape": props.shape,
          role: "group",
          "aria-label": props.label,
        },
        [
          ...visible.map((item) =>
            h(
              "span",
              {
                key: item.name,
                class: "avatar-group__item",
                style: item.color ? { "--ds-avatar-bg": item.color } : undefined,
              },
              [
                h(Avatar, {
                  name: item.name,
                  src: item.src,
                  alt: item.alt,
                  size: props.size,
                  shape: props.shape,
                }),
              ],
            ),
          ),
          overflow > 0
            ? h(
                "span",
                {
                  class: "avatar-group__item avatar-group__overflow",
                  "data-size": props.size,
                  "data-shape": props.shape,
                  role: "img",
                  "aria-label": `${overflow} more`,
                },
                [h("span", { "aria-hidden": "true" }, `+${overflow}`)],
              )
            : null,
        ],
      );
    };
  },
});
