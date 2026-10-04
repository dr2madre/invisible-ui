import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";

/** One step of the trail. */
export interface BreadcrumbItem {
  /** Visible label. */
  label: string;
  /** Link target. Omit on the current (last) page. */
  href?: string;
  /** Render a home glyph before the label (typically the first item). */
  home?: boolean;
}

export interface BreadcrumbProps {
  /** The trail, from the root to the current page (rendered last). */
  items: BreadcrumbItem[];
  /** Accessible name for the landmark. Defaults to the catalog's "Breadcrumb". */
  label?: string;
  /** Separator between items. */
  separator?: string;
}

const HOME = (
  <Icon className="breadcrumb__home">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

/**
 * Breadcrumb: a navigation trail (`<nav><ol>`) from the site root to the
 * current page. Linked ancestors are underlined; the last item is the current
 * page (`aria-current="page"`) and is never a link.
 *
 * Items are data-driven via `items`; mark the first with `home: true` for a
 * leading home glyph. Separators are decorative. Themeable via
 * `--ds-breadcrumb-*`.
 */
export function Breadcrumb({ items, label, separator = "/" }: BreadcrumbProps) {
  const { t } = useI18n();
  return (
    <nav className="breadcrumb" aria-label={label ?? t("breadcrumb.label")}>
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            // The trail is positional: two steps may share a label.
            <li key={index} className="breadcrumb__item">
              {index > 0 ? (
                <span className="breadcrumb__sep" aria-hidden="true">
                  {separator}
                </span>
              ) : null}
              {isLast || !item.href ? (
                <span className="breadcrumb__current" aria-current={isLast ? "page" : undefined}>
                  {item.home ? HOME : null}
                  {item.label}
                </span>
              ) : (
                <a className="breadcrumb__link" href={item.href}>
                  {item.home ? (
                    <>
                      {HOME}
                      {/* The glyph stands in for the label, which stays for screen readers. */}
                      <span className="breadcrumb__sr">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
