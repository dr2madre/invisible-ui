import { defineComponent, h, type PropType } from "vue";

export type CountStatus = "danger" | "neutral" | "info" | "success" | "warning";

export interface CountProps {
  /** The number to display. */
  count?: number;
  /** Ceiling before showing "N+". Defaults to 99. */
  max?: number;
  /** Render a bare dot (presence indicator) instead of a number. */
  dot?: boolean;
  /** Show the bubble even when `count` is 0. Defaults to `false`. */
  showZero?: boolean;
  /** Status color. Defaults to `danger` (the conventional unread red). */
  status?: CountStatus;
  /** Fuller accessible label (e.g. "3 unread messages"). */
  label?: string;
}

/**
 * Count — a small notification count (the "numerino"): the number bubble that
 * sits on a bell, an avatar, or a tab to signal unread/pending items, ported
 * from the Svelte adapter. What some systems call a "badge".
 *
 * Behaviour:
 * - Clamps to `max`, rendering "N+" past the ceiling (e.g. 99 → "99+").
 * - Hides itself when the count is 0 unless `showZero` is set.
 * - `dot` mode renders a small dot with no number (presence indicator).
 *
 * Accessibility:
 * - The visible number is terse, so a fuller `label` (e.g. "3 unread
 *   messages") is exposed to assistive tech via `aria-label`; the digits are
 *   hidden from the accessibility tree to avoid a double announcement.
 * - In `dot` mode there is no text, so a `label` is the only accessible name;
 *   if omitted the dot is purely decorative (`aria-hidden`).
 *
 * Colors are themeable CSS custom properties (`--ds-count-*`), defaulting to
 * the danger status tokens (the conventional "unread" red).
 */
export const Count = defineComponent({
  name: "Count",
  props: {
    count: { type: Number, default: 0 },
    max: { type: Number, default: 99 },
    dot: { type: Boolean, default: false },
    showZero: { type: Boolean, default: false },
    status: { type: String as PropType<CountStatus>, default: "danger" },
    label: { type: String, default: undefined },
  },
  setup(props) {
    return () => {
      const visible = props.dot || props.showZero || props.count > 0;
      if (!visible) return null;

      if (props.dot) {
        return h("span", {
          class: "count count--dot",
          "data-status": props.status,
          role: props.label ? "status" : undefined,
          "aria-label": props.label,
          "aria-hidden": props.label ? undefined : "true",
        });
      }

      const display = props.count > props.max ? `${props.max}+` : `${props.count}`;
      return h(
        "span",
        {
          class: "count",
          "data-status": props.status,
          role: "status",
          "aria-label": props.label ?? display,
        },
        [h("span", { "aria-hidden": "true" }, display)],
      );
    };
  },
});
