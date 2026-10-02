import { defineComponent, h, ref, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useRatingGroup } from "./use-rating-group";
import { useLiveChecked, useResettableValue } from "../internal/form-reset";
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
    // The restore can put "nothing rated" back, so the model can be null.
    "update:modelValue": (value: number | null) => value === null || typeof value === "number",
  },
  setup(props, { emit }) {
    const labelId = useStableId("ds-rating-label");
    // While hovering, stars up to `hovered` show a grey preview; otherwise the
    // selected stars show the selection color.
    const hovered = ref(0);

    const root = ref<HTMLElement | null>(null);
    const given = () => (props.modelValue !== undefined ? props.modelValue : props.value);
    const { told, fallback } = useResettableValue(
      given,
      () => root.value,
      (value) => emit("update:modelValue", value),
    );

    const { items, api, value } = useRatingGroup(() => ({
      max: props.max,
      value: told.value,
      disabled: props.disabled,
      name: props.name,
      onValueChange: (next: number) => {
        told.value = next;
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    // The attributes are the defaults; the properties follow the state.
    useLiveChecked(
      root,
      () => value.value,
      (item) => items.value.some((entry) => entry.value === item && entry.position === value.value),
    );

    const i18n = useI18n();
    const starLabel = (position: number) => i18n.value.t("rating.stars", { count: position });

    return () =>
      h("div", { class: "rating-field", ref: root }, [
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
                  "^checked": fallback.value === item.position ? "" : undefined,
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
