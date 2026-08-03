import { defineComponent, h, type PropType, type VNode } from "vue";
import { useI18n } from "../i18n/i18n";

export interface BreadcrumbItem {
  /** Visible label. */
  label: string;
  /** Link target. Omit on the current (last) page. */
  href?: string;
  /** Render a home glyph before the label (typically the first item). */
  home?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Accessible name for the landmark. Defaults to the catalog's "Breadcrumb". */
  label?: string;
  /** Separator between items. Defaults to "/". */
  separator?: string;
}

const homeGlyph = (): VNode =>
  h(
    "svg",
    {
      class: "breadcrumb__home",
      viewBox: "0 0 24 24",
      width: "1em",
      height: "1em",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
      h("polyline", { points: "9 22 9 12 15 12 15 22" }),
    ],
  );

/**
 * Breadcrumb: a navigation trail (`<nav><ol>`) from the site root to the
 * current page. Linked ancestors are underlined; the last item is the current
 * page (`aria-current="page"`, rendered in the selection color, not a link).
 *
 * Items are data-driven via `items`; mark the first with `home: true` for a
 * leading home glyph. Separators are decorative. Themeable via
 * `--ds-breadcrumb-*`.
 */
export const Breadcrumb = defineComponent({
  name: "Breadcrumb",
  props: {
    items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
    label: { type: String, default: undefined },
    separator: { type: String, default: "/" },
  },
  setup(props) {
    const i18n = useI18n();

    return () => {
      const { t } = i18n.value;

      return h("nav", { class: "breadcrumb", "aria-label": props.label ?? t("breadcrumb.label") }, [
        h(
          "ol",
          { class: "breadcrumb__list" },
          props.items.map((item, index) => {
            const isLast = index === props.items.length - 1;
            return h("li", { key: index, class: "breadcrumb__item" }, [
              index > 0
                ? h("span", { class: "breadcrumb__sep", "aria-hidden": "true" }, props.separator)
                : null,
              isLast || !item.href
                ? h(
                    "span",
                    {
                      class: "breadcrumb__current",
                      "aria-current": isLast ? "page" : undefined,
                    },
                    [item.home ? homeGlyph() : null, item.label],
                  )
                : h("a", { class: "breadcrumb__link", href: item.href }, [
                    ...(item.home
                      ? [homeGlyph(), h("span", { class: "breadcrumb__sr" }, item.label)]
                      : [item.label]),
                  ]),
            ]);
          }),
        ),
      ]);
    };
  },
});
