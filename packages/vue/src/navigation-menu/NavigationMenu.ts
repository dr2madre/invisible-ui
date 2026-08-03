import { defineComponent, h, Teleport, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useNavigationMenu, type NavigationMenuItem } from "./use-navigation-menu";

export interface NavigationMenuProps {
  /** Accessible name for the navigation landmark. */
  label: string;
  items: NavigationMenuItem[];
  onValueChange?: (value: string | null) => void;
}

/**
 * NavigationMenu: a site-navigation bar where some items reveal a panel of
 * links. Plain items are ordinary links; panel items are disclosures.
 * Behaviour and ARIA (the open value, `aria-expanded` / `aria-controls`,
 * Escape, ArrowDown) come from the headless navigation menu
 * (`@design-system/core`); this layer adds hover open/close with switching,
 * Floating-UI positioning, outside-press dismissal and focus movement.
 *
 * Pass `items`: `{ value, label, href }` for a link, or
 * `{ value, label, links: [{ label, href, description? }] }` for a panel.
 * Themeable via `--ds-navmenu-*`.
 */
export const NavigationMenu = defineComponent({
  name: "NavigationMenu",
  props: {
    label: { type: String, required: true },
    items: { type: Array as PropType<NavigationMenuItem[]>, required: true },
    onValueChange: {
      type: Function as PropType<(value: string | null) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const {
      api,
      value,
      setTriggerRef,
      contentRef,
      onTriggerPointerenter,
      scheduleClose,
      hold,
      onTriggerKeydown,
      onContentKeydown,
    } = useNavigationMenu(() => ({ onValueChange: props.onValueChange }));

    const panel = (item: NavigationMenuItem) => {
      const contentProps = api.value.getContentProps(item.value);
      return h(Teleport, { to: "body" }, [
        h(
          "div",
          {
            ...contentProps,
            ref: contentRef,
            class: "navmenu__content",
            onKeydown: [
              contentProps.onKeydown,
              (event: KeyboardEvent) => onContentKeydown(item.value, event),
            ],
            onPointerenter: () => hold(),
            onPointerleave: () => scheduleClose(),
          },
          [
            h(
              "ul",
              { class: "navmenu__links" },
              (item.links ?? []).map((link) =>
                h("li", { key: link.href }, [
                  h("a", { class: "navmenu__link", href: link.href }, [
                    h("span", { class: "navmenu__link-label" }, link.label),
                    link.description
                      ? h("span", { class: "navmenu__link-desc" }, link.description)
                      : null,
                  ]),
                ]),
              ),
            ),
          ],
        ),
      ]);
    };

    const disclosure = (item: NavigationMenuItem) => {
      const triggerProps = api.value.getTriggerProps(item.value);
      return [
        h(
          "button",
          {
            ...triggerProps,
            ref: (node) => setTriggerRef(item.value, (node as HTMLElement | null) ?? null),
            class: "navmenu__trigger",
            type: "button",
            onKeydown: [triggerProps.onKeydown, onTriggerKeydown],
            onPointerenter: (event: PointerEvent) => onTriggerPointerenter(item.value, event),
            onPointerleave: () => scheduleClose(),
          },
          [
            item.label,
            h("span", { class: "navmenu__chevron", "aria-hidden": "true" }, [
              h(
                Icon,
                { size: "100%" },
                { default: () => h("polyline", { points: "6 9 12 15 18 9" }) },
              ),
            ]),
          ],
        ),
        value.value === item.value ? panel(item) : null,
      ];
    };

    return () =>
      h("nav", { class: "navmenu", "aria-label": props.label }, [
        h(
          "ul",
          { class: "navmenu__list" },
          props.items.map((item) =>
            h(
              "li",
              { class: "navmenu__item", key: item.value },
              item.links
                ? disclosure(item)
                : [h("a", { class: "navmenu__toplink", href: item.href }, item.label)],
            ),
          ),
        ),
      ]);
  },
});
