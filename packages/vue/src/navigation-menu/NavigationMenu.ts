import { defineComponent, h, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { useNavigationMenu, type NavigationMenuItem } from "./use-navigation-menu";
import { useI18n } from "../i18n/i18n";

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
 * `aria-current`, Escape, ArrowDown) come from the headless navigation menu
 * (`@design-system/core`); this layer adds hover open/close with switching,
 * Floating-UI positioning, outside-press dismissal and focus movement.
 *
 * Resting the pointer on a trigger opens its panel while the pointer stays. A
 * click keeps the panel open, also one the pointer opened, and a second click
 * closes it; Escape closes and returns focus to the trigger, and a press
 * outside closes without moving focus. Activating a link closes the panel
 * before the browser follows it.
 *
 * Pass `items`: `{ value, label, href, current? }` for a link, or
 * `{ value, label, links: [{ label, href, description?, current? }] }` for a
 * panel. `current` marks the link to the page on screen with
 * `aria-current="page"`; the trigger whose panel holds it gets
 * `data-current` for styling only. Themeable via `--ds-navmenu-*`.
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
    const i18n = useI18n();
    const teleportDisabled = useHydratedTeleport();
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
      onLinkClick,
    } = useNavigationMenu(() => ({ onValueChange: props.onValueChange }));

    const panel = (item: NavigationMenuItem) => {
      const contentProps = api.value.getContentProps(item.value);
      return scopedTeleport(teleportDisabled.value, i18n.value, null, [
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
              (item.links ?? []).map((link, index) => {
                const linkProps = api.value.getLinkProps({ current: link.current });
                return h("li", { key: `${index}:${link.href}` }, [
                  h(
                    "a",
                    {
                      ...linkProps,
                      class: "navmenu__link",
                      href: link.href,
                      onClick: [linkProps.onClick, () => onLinkClick(item.value)],
                    },
                    [
                      h("span", { class: "navmenu__link-label" }, link.label),
                      link.description
                        ? h("span", { class: "navmenu__link-desc" }, link.description)
                        : null,
                    ],
                  ),
                ]);
              }),
            ),
          ],
        ),
      ]);
    };

    const disclosure = (item: NavigationMenuItem) => {
      const triggerProps = api.value.getTriggerProps(item.value, {
        holdsCurrent: item.links?.some((link) => link.current) ?? false,
      });
      return [
        h(
          "button",
          {
            ...triggerProps,
            ref: (node) => setTriggerRef(item.value, (node as HTMLElement | null) ?? null),
            class: "navmenu__trigger",
            type: "button",
            // A pending hover open must not undo what the press decides.
            onClick: [() => hold(), triggerProps.onClick],
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
                : [
                    h(
                      "a",
                      {
                        ...api.value.getLinkProps({ current: item.current }),
                        class: "navmenu__toplink",
                        href: item.href,
                      },
                      item.label,
                    ),
                  ],
            ),
          ),
        ),
      ]);
  },
});
