import { defineComponent, h, ref, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useRatingGroup } from "./use-rating-group";
import { useI18n } from "../i18n/i18n";
import { useStableId } from "../internal/use-stable-id";

export interface RatingGroupProps {
  /** Accessible name for the rating group (required). */
  label: string;
  /** Number of stars. */
  max?: number;
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: number | null;
  /** Selected rating (1..max), or null. */
  value?: number | null;
  disabled?: boolean;
  /** Form field name; the rating is submitted under it. */
  name?: string;
  /** Called whenever the rating changes. */
  onValueChange?: (value: number) => void;
}

// Stable per-instance id for the group label association; the same
// module-counter approach as Select (Vue's own `useId` landed after the ^3.4
// peer range).
const STAR_POINTS =
  "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2";

/**
 * RatingGroup — a star rating built on native `<input type="radio">` stars
 * sharing a `name`, ported from the Svelte adapter. The browser provides single
 * selection, roving tabindex, arrow-key navigation, focus and form
 * participation; this layer renders the stars and adds a pointer-hover preview.
 *
 * The group needs an accessible name via `label`; each star is a radio labelled
 * "N star(s)". The rating binds two ways: `v-model` or the `value` prop plus
 * `onValueChange`. Themeable via `--ds-rating-*`.
 */
export const RatingGroup = defineComponent({
  name: "RatingGroup",
  props: {
    label: { type: String, required: true },
    max: { type: Number, default: 5 },
    modelValue: { type: Number as PropType<number | null>, default: undefined },
    value: { type: Number as PropType<number | null>, default: null },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    onValueChange: { type: Function as PropType<(value: number) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: number) => typeof value === "number",
  },
  setup(props, { emit }) {
    const labelId = useStableId("ds-rating-label");
    // While hovering, stars up to `hovered` show a grey preview; otherwise the
    // selected stars show the selection color.
    const hovered = ref(0);

    const { items, api, value } = useRatingGroup(() => ({
      max: props.max,
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      disabled: props.disabled,
      name: props.name,
      onValueChange: (next: number) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    const i18n = useI18n();
    const starLabel = (position: number) =>
      i18n.value.t(position === 1 ? "rating.star" : "rating.stars", { count: position });

    return () =>
      h("div", { class: "rating-field" }, [
        h("span", { class: "rating__label", id: labelId }, props.label),
        h(
          "div",
          {
            ...api.value.rootProps,
            class: ["rating", { "rating--disabled": props.disabled }],
            "aria-labelledby": labelId,
            onPointerleave: () => (hovered.value = 0),
          },
          items.value.map((item) =>
            h(
              "label",
              {
                key: item.value,
                class: [
                  "rating__star",
                  {
                    "rating__star--filled": !hovered.value && item.position <= (value.value ?? 0),
                    "rating__star--preview": hovered.value > 0 && item.position <= hovered.value,
                  },
                ],
                onPointerenter: () => {
                  if (!props.disabled) hovered.value = item.position;
                },
              },
              [
                h("input", {
                  ...api.value.getItemProps(item.value),
                  class: "rating__input",
                  checked: value.value === item.position,
                  "aria-label": starLabel(item.position),
                }),
                h(Icon, { size: "var(--ds-rating-size, 1.5rem)" }, () => [
                  h("polygon", { points: STAR_POINTS }),
                ]),
              ],
            ),
          ),
        ),
      ]);
  },
});
