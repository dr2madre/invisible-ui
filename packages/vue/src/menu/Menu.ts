import { defineComponent, h, type Component, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";

/** One entry in a menu section. */
export interface MenuEntry {
  value: string;
  label: string;
  /** Renders the entry as a link instead of a button. */
  href?: string;
  /**
   * Optional leading icon (any Vue component). Wrap it in `markRaw()` so Vue
   * keeps it out of the reactive proxy it builds for the `sections` prop.
   */
  icon?: Component;
}

/** A labelled group of entries. */
export interface MenuSection {
  /** Optional section heading. */
  label?: string;
  items: MenuEntry[];
}

export interface MenuProps {
  sections: MenuSection[];
  /** The active entry's value. */
  value?: string | null;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
  label?: string;
  onSelect?: (value: string) => void;
}

/**
 * Menu: the sidebar navigation organism, ported from the Svelte adapter. A
 * logo header, one or more labelled sections of entries (icon plus label), and
 * a footer. Entries with an `href` render as links, the rest as buttons that
 * report `onSelect(value)`. The active entry carries `aria-current="page"` and
 * the selection color.
 *
 * Slots: `logo` and `footer`. Themeable via `--ds-menu-*`.
 */
export const Menu = defineComponent({
  name: "Menu",
  props: {
    sections: { type: Array as PropType<MenuSection[]>, required: true },
    value: { type: String as PropType<string | null>, default: null },
    label: { type: String, default: undefined },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();

    const entry = (item: MenuEntry) => {
      const active = item.value === props.value;
      const content = [
        item.icon ? h("span", { class: "menu__icon" }, [h(item.icon)]) : null,
        h("span", { class: "menu__label" }, item.label),
      ];
      const shared = {
        class: ["menu__item", { "menu__item--active": active }],
        "aria-current": active ? "page" : undefined,
      };

      return item.href
        ? h("a", { ...shared, href: item.href }, content)
        : h(
            "button",
            { ...shared, type: "button", onClick: () => props.onSelect?.(item.value) },
            content,
          );
    };

    return () =>
      h("nav", { class: "menu", "aria-label": props.label ?? i18n.value.t("menu.label") }, [
        slots.logo ? h("div", { class: "menu__logo" }, slots.logo()) : null,
        ...props.sections.map((section, index) =>
          h("div", { class: "menu__section", key: index }, [
            section.label ? h("p", { class: "menu__section-label" }, section.label) : null,
            h(
              "ul",
              { class: "menu__list" },
              section.items.map((item) => h("li", { key: item.value }, [entry(item)])),
            ),
          ]),
        ),
        slots.footer ? h("div", { class: "menu__footer" }, slots.footer()) : null,
      ]);
  },
});
