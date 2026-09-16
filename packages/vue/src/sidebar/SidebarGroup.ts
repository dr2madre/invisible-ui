import { collapsible as core } from "@design-system/core";
import { computed, defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useStableId } from "../internal/use-stable-id";
import { normalizeProps } from "../normalize";

/**
 * One collapsible section of a Sidebar: a disclosure button over a list of
 * items. The wiring comes from the headless collapsible; this file places the
 * chevron and the list.
 *
 * The section holds no state of its own: what it shows is the prop, and a press
 * is a request the Sidebar answers. A set the application controls therefore
 * moves only when the application moves it (ADR 0011).
 */
export const SidebarGroup = defineComponent({
  name: "SidebarGroup",
  props: {
    label: { type: String, required: true },
    open: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false },
    onToggle: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { slots }) {
    const id = useStableId("ds-sidebar-group");
    const api = computed(() =>
      core.connect({
        state: { open: props.open, disabled: false, id },
        setOpen: () => props.onToggle?.(),
        normalize: normalizeProps,
      }),
    );

    return () => {
      const { triggerProps, contentProps } = api.value;
      return h("div", { class: "sidebar__section", "data-state": props.open ? "open" : "closed" }, [
        h("button", { ...triggerProps, class: "sidebar__group" }, [
          h(
            "span",
            { class: ["sidebar__group-label", { "sidebar__label--hidden": props.collapsed }] },
            props.label,
          ),
          h(
            "span",
            {
              class: ["sidebar__chevron", { "sidebar__chevron--open": props.open }],
              "aria-hidden": "true",
            },
            [
              h(
                Icon,
                { size: "1em" },
                { default: () => h("polyline", { points: "9 18 15 12 9 6" }) },
              ),
            ],
          ),
        ]),
        h("div", { ...contentProps, class: "sidebar__group-content" }, slots.default?.()),
      ]);
    };
  },
});
