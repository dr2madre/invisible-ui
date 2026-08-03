import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useTabs, type ActivationMode, type TabItem } from "./use-tabs";

/**
 * A tab, with an optional display label and its panel text. May also carry a
 * `count` (shown as a trailing badge, violet when the tab is selected, grey
 * otherwise), a leading `icon` (an SVG path `d` string), and `iconOnly` to
 * render just the icon (the label becomes the accessible name).
 */
export type TabsItem = TabItem & {
  label?: string;
  content?: string;
  count?: number;
  icon?: string;
  iconOnly?: boolean;
};

export interface TabsProps {
  /** Ordered list of tabs. */
  items: TabsItem[];
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string | null;
  /** Selected tab value. `null` falls back to the first enabled tab. */
  value?: string | null;
  /** `automatic` (default): arrows select while moving. `manual`: Enter/Space selects. */
  activationMode?: ActivationMode;
  /** Accessible name for the tab list (announced by screen readers). */
  label: string;
  /** Called whenever the selected tab changes. */
  onValueChange?: (value: string) => void;
}

/**
 * Tabs: the styled, batteries-included tabs widget (WAI-ARIA tabs pattern):
 * roving tabindex, arrow/Home/End navigation, automatic or manual activation.
 * Behaviour and accessibility come from the headless tabs
 * (`@design-system/core`); this layer adds the underline indicator and panels.
 *
 * Each item supplies a tab `label` (falling back to `value`) and, optionally,
 * its panel `content` as text. For rich panel markup, use the scoped `panel`
 * slot; it renders once per tab with the `item`, so the consumer can put any
 * content in the (correctly wired) panel and switch on `item.value`. The text
 * `content` is the fallback when the slot is absent.
 *
 * The selected tab binds two ways: `v-model` (the idiomatic Vue form) or the
 * `value` prop plus `onValueChange`, matching the other controlled components.
 * Colors are themeable CSS custom properties (`--ds-tabs-*`).
 */
export const Tabs = defineComponent({
  name: "Tabs",
  props: {
    items: { type: Array as PropType<TabsItem[]>, required: true },
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    activationMode: { type: String as PropType<ActivationMode>, default: "automatic" },
    label: { type: String, required: true },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit, slots }) {
    const { api, listRef } = useTabs(() => ({
      items: props.items,
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      activationMode: props.activationMode,
      onValueChange: (next: string) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    return () =>
      h("div", { class: "tabs" }, [
        h(
          "div",
          { ...api.value.rootProps, class: "tabs__list", ref: listRef, "aria-label": props.label },
          props.items.map((item) =>
            h(
              "button",
              {
                ...api.value.getTabProps(item.value),
                key: item.value,
                class: item.iconOnly ? "tabs__tab tabs__tab--icon-only" : "tabs__tab",
                "aria-label": item.iconOnly ? (item.label ?? item.value) : undefined,
              },
              [
                item.icon
                  ? h("span", { class: "tabs__tab-icon", "aria-hidden": "true" }, [
                      h(Icon, { size: "100%" }, { default: () => h("path", { d: item.icon }) }),
                    ])
                  : null,
                item.iconOnly
                  ? null
                  : h("span", { class: "tabs__tab-label" }, item.label ?? item.value),
                item.count != null
                  ? h("span", { class: "tabs__tab-count", "aria-hidden": "true" }, item.count)
                  : null,
              ],
            ),
          ),
        ),
        ...props.items.map((item) =>
          h(
            "div",
            { ...api.value.getPanelProps(item.value), key: item.value, class: "tabs__panel" },
            // Rich per-panel content via a scoped slot; falls back to the
            // item's text `content` when no slot is provided.
            slots.panel ? slots.panel({ item }) : (item.content ?? ""),
          ),
        ),
      ]);
  },
});
