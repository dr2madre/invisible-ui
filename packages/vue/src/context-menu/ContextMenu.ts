import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { useContextMenu, type MenuItem } from "./use-context-menu";

export interface ContextMenuProps {
  items: MenuItem[];
  disabled?: boolean;
  /** Called with the chosen item's value. */
  onSelect?: (value: string) => void;
  /**
   * Accessible name for the popup; no trigger labels it. Defaults to the
   * catalog's "Context menu".
   */
  label?: string;
}

/**
 * ContextMenu: the styled menu summoned by right-click, by the keyboard
 * context-menu key, or by a long press on touch, opening a `role="menu"` of
 * action items at the pointer. Behaviour and accessibility (arrow / Home / End
 * navigation, typeahead, roving focus, Enter and click activation, Escape /
 * Tab / outside press to close, focus restored on close) come from the
 * headless menu (`@design-system/core`); positioning against a virtual anchor
 * at the pointer uses `@floating-ui/dom`.
 *
 * Wrap the target area in the default slot; pass `items`
 * ({ value, label?, disabled? }) and `onSelect(value)`. Colors, radius and
 * elevation reuse the shared menu tokens (`--ds-menu-*`).
 */
export const ContextMenu = defineComponent({
  name: "ContextMenu",
  props: {
    items: { type: Array as PropType<MenuItem[]>, required: true },
    disabled: { type: Boolean, default: false },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
    label: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const teleportDisabled = useHydratedTeleport();
    const i18n = useI18n();
    const { api, open, triggerRef, menuRef, triggerHandlers } = useContextMenu(() => ({
      items: props.items,
      disabled: props.disabled,
      onSelect: props.onSelect,
    }));

    return () => {
      // No trigger element labels this popup, so the core's `aria-labelledby`
      // would dangle; the accessible name comes from `aria-label` instead.
      const { ["aria-labelledby"]: _labelledBy, ...menuProps } = api.value.menuProps;

      return [
        h(
          "div",
          { ...triggerHandlers, ref: triggerRef, class: "context-menu__trigger", tabindex: 0 },
          slots.default?.(),
        ),
        open.value
          ? scopedTeleport(teleportDisabled.value, i18n.value, triggerRef.value, [
              h(
                "div",
                {
                  ...menuProps,
                  ref: menuRef,
                  class: "context-menu__popup",
                  "aria-label": props.label ?? i18n.value.t("contextMenu.label"),
                },
                props.items.map((item) =>
                  h(
                    "button",
                    {
                      key: item.value,
                      ...api.value.getItemProps(item.value),
                      class: "context-menu__item",
                      type: "button",
                    },
                    item.label ?? item.value,
                  ),
                ),
              ),
            ])
          : null,
      ];
    };
  },
});
