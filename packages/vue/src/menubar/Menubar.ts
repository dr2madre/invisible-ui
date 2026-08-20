import { defineComponent, h, type PropType } from "vue";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { useMenubar, type MenubarMenu } from "./use-menubar";
import { useI18n } from "../i18n/i18n";

export interface MenubarProps {
  /** Accessible name for the bar. */
  label: string;
  /** The top-level menus. */
  menus: MenubarMenu[];
  /** Called with the chosen item's menu value and item value. */
  onSelect?: (menuValue: string, itemValue: string) => void;
}

/**
 * Menubar: a horizontal bar of menus (WAI-ARIA menubar pattern), the shape an
 * application menu takes (File / Edit / View). Each menu reuses the headless
 * menu (`@design-system/core`) for open/close, arrow & Home/End item
 * navigation, typeahead, focus moving into the menu and Escape/outside to
 * close; this component adds the menubar coordination: a roving tabindex
 * across the triggers, ArrowLeft/Right to move between them (or to switch the
 * open menu), Home/End, and hover-to-switch while a menu is open.
 *
 * Pass `menus` ({ value, label, items, disabled? }) and an accessible `label`
 * for the bar; `onSelect(menuValue, itemValue)` runs when an item is chosen.
 * Themeable via `--ds-menu-*` (shared with DropdownMenu) and `--ds-menubar-*`.
 */
export const Menubar = defineComponent({
  name: "Menubar",
  props: {
    label: { type: String, required: true },
    menus: { type: Array as PropType<MenubarMenu[]>, required: true },
    onSelect: {
      type: Function as PropType<(menuValue: string, itemValue: string) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const i18n = useI18n();
    const teleportDisabled = useHydratedTeleport();
    const { menus, focusedIndex, setFocusedIndex, onMenubarKeydown, onTriggerPointerenter } =
      useMenubar(() => ({ menus: props.menus, onSelect: props.onSelect }));

    return () =>
      h(
        "div",
        {
          class: "menubar",
          role: "menubar",
          "aria-label": props.label,
          "aria-orientation": "horizontal",
          onKeydown: onMenubarKeydown,
        },
        menus.value.map((entry, index) => {
          const { api, open, triggerRef, menuRef } = entry.menu;

          return h("div", { class: "menubar__menu", key: entry.value }, [
            h(
              "button",
              {
                ...api.value.triggerProps,
                ref: triggerRef,
                class: "menubar__trigger",
                type: "button",
                role: "menuitem",
                tabindex: index === focusedIndex.value ? 0 : -1,
                onFocus: () => setFocusedIndex(index),
                onPointerenter: () => onTriggerPointerenter(index),
              },
              entry.label,
            ),

            // Portalled out of the bar, so the bar's cross-menu keydown must
            // be attached here too. The popup stays mounted while closed
            // (hidden via data-state in CSS) and items are keyed by value, so
            // Vue reuses the same nodes: a node replaced mid-gesture would
            // lose the press that selects it.
            scopedTeleport(teleportDisabled.value, i18n.value, [
              h(
                "div",
                {
                  ...api.value.menuProps,
                  ref: menuRef,
                  class: "menubar__popup",
                  onKeydown: [api.value.menuProps.onKeydown, onMenubarKeydown],
                  // The stylesheet hides the closed popup via data-state; the
                  // inline fallback keeps it out of the accessibility tree
                  // when the stylesheet is not loaded (tests, tokens-only
                  // setups).
                  style: open.value ? undefined : { display: "none" },
                },
                entry.items.map((item) =>
                  h(
                    "button",
                    {
                      key: item.value,
                      ...api.value.getItemProps(item.value),
                      class: "menubar__item",
                      type: "button",
                    },
                    item.label ?? item.value,
                  ),
                ),
              ),
            ]),
          ]);
        }),
      );
  },
});
