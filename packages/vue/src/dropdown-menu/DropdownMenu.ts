import { defineComponent, h, Teleport, watch, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { useDropdownMenu, type MenuItem } from "./use-dropdown-menu";

export interface DropdownMenuProps {
  /** The trigger button's visible label. */
  label: string;
  items: MenuItem[];
  disabled?: boolean;
  /** Called with the chosen item's value. */
  onSelect?: (value: string) => void;
}

/**
 * DropdownMenu: the styled, batteries-included menu button (WAI-ARIA menu
 * button pattern). A trigger opens a `role="menu"` of action items; behaviour
 * and accessibility (open/close, arrow & Home/End navigation, typeahead,
 * focus moving into the menu and returning to the trigger, Escape/outside to
 * close) come from the headless menu (`@design-system/core`). Popup
 * positioning (flip/shift, stays attached on scroll) is handled via
 * `@floating-ui/dom`.
 *
 * Pass `items` ({ value, label?, disabled? }) and an accessible `label` for
 * the trigger; `onSelect(value)` runs when an item is chosen. Colors, radius
 * and elevation are themeable CSS custom properties (`--ds-menu-*`).
 */
export const DropdownMenu = defineComponent({
  name: "DropdownMenu",
  props: {
    label: { type: String, required: true },
    items: { type: Array as PropType<MenuItem[]>, required: true },
    disabled: { type: Boolean, default: false },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  setup(props) {
    const teleportDisabled = useHydratedTeleport();
    const { api, open, triggerRef, menuRef } = useDropdownMenu(() => ({
      items: props.items,
      disabled: props.disabled,
      onSelect: props.onSelect,
    }));

    // Drop iOS's synthesized duplicate click so the menu doesn't toggle twice.
    watch(triggerRef, (node, _previous, onCleanup) => {
      if (!node) return;
      onCleanup(ignoreGhostClicks(node));
    });

    return () =>
      h("div", { class: "menu" }, [
        h(
          "button",
          { ...api.value.triggerProps, ref: triggerRef, class: "menu__trigger", type: "button" },
          [
            h("span", props.label),
            h("span", { class: "menu__chevron", "aria-hidden": "true" }, [
              h(
                Icon,
                { size: "100%" },
                { default: () => h("polyline", { points: "6 9 12 15 18 9" }) },
              ),
            ]),
          ],
        ),

        // The popup stays mounted while closed (hidden via data-state in CSS)
        // and items are keyed by value, so Vue reuses the same nodes across
        // open/highlight changes: a node replaced mid-gesture (between
        // pointerdown and pointerup) would lose the press that selects it.
        h(Teleport, { to: "body", disabled: teleportDisabled.value }, [
          h(
            "div",
            {
              ...api.value.menuProps,
              ref: menuRef,
              class: "menu__popup",
              // The stylesheet hides the closed popup via data-state; the
              // inline fallback keeps it out of the accessibility tree when
              // the stylesheet is not loaded (tests, tokens-only setups).
              style: open.value ? undefined : { display: "none" },
            },
            props.items.map((item) =>
              h(
                "button",
                {
                  key: item.value,
                  ...api.value.getItemProps(item.value),
                  class: "menu__item",
                  type: "button",
                },
                item.label ?? item.value,
              ),
            ),
          ),
        ]),
      ]);
  },
});
