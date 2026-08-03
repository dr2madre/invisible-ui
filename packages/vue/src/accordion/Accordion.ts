import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useAccordion, type AccordionItem, type AccordionType } from "./use-accordion";

/** An item, with an optional header label and its panel text. */
export type AccordionEntry = AccordionItem & { label?: string; content?: string };

export interface AccordionProps {
  /** Ordered list of items. */
  items: AccordionEntry[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string[];
  /** Expanded item values. Defaults to none. */
  value?: string[];
  /** `single` (default): one open at a time. `multiple`: many. */
  type?: AccordionType;
  /** For `single`: allow collapsing the open item. */
  collapsible?: boolean;
  disabled?: boolean;
  /** Called whenever the expanded set changes. */
  onValueChange?: (value: string[]) => void;
}

/**
 * Accordion: the styled, batteries-included accordion (WAI-ARIA accordion
 * pattern): single or multiple expansion, arrow-key movement between headers.
 * Behaviour and accessibility come from the headless accordion
 * (`@design-system/core`); this layer adds bordered items and a rotating
 * chevron.
 *
 * Each item supplies a header `label` (falling back to `value`) and its panel
 * `content` as text. For rich panel markup, drive the headless `useAccordion`
 * directly.
 *
 * The expanded set binds two ways: `v-model` (the idiomatic Vue form) or the
 * `value` prop plus `onValueChange`, matching the other controlled components.
 * Colors are themeable CSS custom properties (`--ds-accordion-*`).
 */
export const Accordion = defineComponent({
  name: "Accordion",
  props: {
    items: { type: Array as PropType<AccordionEntry[]>, required: true },
    modelValue: { type: Array as PropType<string[]>, default: undefined },
    value: { type: Array as PropType<string[]>, default: () => [] },
    type: { type: String as PropType<AccordionType>, default: "single" },
    collapsible: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    onValueChange: { type: Function as PropType<(value: string[]) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string[]) => Array.isArray(value),
  },
  setup(props, { emit }) {
    const { api, rootRef } = useAccordion(() => ({
      items: props.items,
      value: props.modelValue ?? props.value,
      type: props.type,
      collapsible: props.collapsible,
      disabled: props.disabled,
      onValueChange: (next: string[]) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    return () =>
      h(
        "div",
        { ...api.value.rootProps, class: "accordion", ref: rootRef },
        props.items.map((item) =>
          h(
            "div",
            { ...api.value.getItemProps(item.value), key: item.value, class: "accordion__item" },
            [
              h("h3", { class: "accordion__heading" }, [
                h(
                  "button",
                  { ...api.value.getTriggerProps(item.value), class: "accordion__trigger" },
                  [
                    h("span", item.label ?? item.value),
                    h("span", { class: "accordion__icon", "aria-hidden": "true" }, [
                      h(
                        Icon,
                        { size: "var(--ds-accordion-icon-size, 1.1em)" },
                        { default: () => h("polyline", { points: "9 6 15 12 9 18" }) },
                      ),
                    ]),
                  ],
                ),
              ]),
              h(
                "div",
                { ...api.value.getPanelProps(item.value), class: "accordion__panel" },
                item.content ?? "",
              ),
            ],
          ),
        ),
      );
  },
});
