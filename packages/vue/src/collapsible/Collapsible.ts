import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useCollapsible } from "./use-collapsible";
import { useI18n } from "../i18n/i18n";

export interface CollapsibleProps {
  /** Open state; bindable with `v-model:open`. */
  open?: boolean;
  disabled?: boolean;
  /** Trigger text, used when the `trigger` slot is not provided. */
  label?: string;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Collapsible: the styled, single-item disclosure (WAI-ARIA disclosure
 * pattern), one trigger button toggling one content region. Behaviour and
 * accessibility (`aria-expanded` / `aria-controls` wiring, disabled handling)
 * come from the headless collapsible (`@design-system/core`); this layer adds
 * a trigger row with a rotating chevron and a content area.
 *
 * The open state binds two ways: `v-model:open` (the idiomatic Vue form) or
 * the `open` prop plus `onOpenChange`. Slots: `trigger` (the trigger's
 * content, falling back to the `label` prop) and the default slot (the
 * content). Colors, radius and spacing are themeable via `--ds-collapsible-*`.
 */
export const Collapsible = defineComponent({
  name: "Collapsible",
  props: {
    open: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
  },
  emits: {
    "update:open": (open: boolean) => typeof open === "boolean",
  },
  setup(props, { emit, slots }) {
    const i18n = useI18n();
    const { api } = useCollapsible(() => ({
      open: props.open,
      disabled: props.disabled,
      onOpenChange: (next: boolean) => {
        emit("update:open", next);
        props.onOpenChange?.(next);
      },
    }));

    return () =>
      h("div", { ...api.value.rootProps, class: "collapsible" }, [
        h("button", { ...api.value.triggerProps, class: "collapsible__trigger" }, [
          h(
            "span",
            { class: "collapsible__label" },
            slots.trigger?.() ?? props.label ?? i18n.value.t("collapsible.toggle"),
          ),
          h("span", { class: "collapsible__icon", "aria-hidden": "true" }, [
            h(
              Icon,
              { size: "var(--ds-collapsible-icon-size, 1.1em)" },
              { default: () => h("polyline", { points: "6 9 12 15 18 9" }) },
            ),
          ]),
        ]),
        h("div", { ...api.value.contentProps, class: "collapsible__content" }, slots.default?.()),
      ]);
  },
});
