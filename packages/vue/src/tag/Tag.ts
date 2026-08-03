import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";

export type TagStatus = "neutral" | "info" | "success" | "warning" | "danger" | "selected";

export interface TagProps {
  /** Status/tone: `neutral` | `info` | `success` | `warning` | `danger` | `selected`. */
  status?: TagStatus;
  /** Visual weight: a soft tinted surface (default) or a solid, filled chip. */
  variant?: "soft" | "solid";
  /** Size of the chip. */
  size?: "sm" | "md";
  /** Render a remove (✕) button. Defaults to `false`. */
  removable?: boolean;
  /** Accessible name for the remove button. Defaults to the i18n catalog's "Remove". */
  removeLabel?: string;
  /** Called when the remove button is pressed. */
  onRemove?: () => void;
}

/**
 * Tag — a small, colored chip that labels or categorises content (what some
 * systems call a "label" or "chip"), ported from the Svelte adapter. It
 * carries a status color, text, optional leading/trailing icons (via the
 * `icon` / `trailing` slots), and may include a small `Count` for a number.
 * Optionally removable.
 *
 * Note: this is distinct from `Label` (the form-control label) and from
 * `Count` (the standalone notification number) — a Tag may *contain* a Count.
 *
 * Accessibility:
 * - The chip is presentational; its meaning is the visible text.
 * - When `removable`, a ghost remove button is rendered with an accessible
 *   name (`removeLabel`, defaulting to the catalog's "Remove") and a
 *   decorative ✕ glyph.
 * - The status is conveyed by color *and* text, never by color alone.
 *
 * Colors are themeable CSS custom properties (`--ds-tag-*`), falling back to
 * the shared status token layer (`--ds-color-*`).
 */
export const Tag = defineComponent({
  name: "Tag",
  props: {
    status: { type: String as PropType<TagStatus>, default: "neutral" },
    variant: { type: String as PropType<"soft" | "solid">, default: "soft" },
    size: { type: String as PropType<"sm" | "md">, default: "md" },
    removable: { type: Boolean, default: false },
    removeLabel: { type: String, default: undefined },
    onRemove: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();

    return () => {
      const { t } = i18n.value;
      const resolvedRemoveLabel = props.removeLabel ?? t("tag.remove");

      return h(
        "span",
        {
          class: "tag",
          "data-status": props.status,
          "data-variant": props.variant,
          "data-size": props.size,
        },
        [
          slots.icon
            ? h("span", { class: "tag__icon", "aria-hidden": "true" }, slots.icon())
            : null,
          h("span", { class: "tag__label" }, slots.default?.()),
          slots.trailing ? h("span", { class: "tag__trailing" }, slots.trailing()) : null,
          props.removable
            ? h(
                "button",
                {
                  type: "button",
                  class: "tag__remove",
                  "aria-label": resolvedRemoveLabel,
                  onClick: () => props.onRemove?.(),
                },
                [
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
                        d: "M4 4l8 8M12 4l-8 8",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": "1.75",
                        "stroke-linecap": "round",
                      }),
                    ],
                  ),
                ],
              )
            : null,
        ],
      );
    };
  },
});
