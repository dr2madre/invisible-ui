import { useI18n } from "../i18n/i18n";
import { usePagination } from "./use-pagination";

export interface PaginationProps {
  /**
   * Initial (uncontrolled) or current (controlled) page, 1-based. A later
   * prop, clamped to `pageCount`, overwrites the local choice without a report.
   */
  page?: number;
  /** Total number of pages. */
  pageCount: number;
  /** Pages shown on each side of the current page. */
  siblingCount?: number;
  /** Pages always shown at the start and end. */
  boundaryCount?: number;
  disabled?: boolean;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Pagination". */
  label?: string;
  /** Called whenever the page changes. */
  onPageChange?: (page: number) => void;
}

/**
 * Pagination: a styled pager with previous, the visible page numbers (with
 * ellipsis gaps) and next. Behaviour and accessibility (`aria-current` on the
 * current page, roving tabindex, arrow-key movement, disabled previous and
 * next at the bounds) come from the headless pagination
 * (`@design-system/core`). The control names come from the catalog.
 *
 * Colors, sizing and radius are themeable via `--ds-pagination-*`.
 */
export function Pagination({
  page = 1,
  pageCount,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  label,
  onPageChange,
}: PaginationProps) {
  const { t } = useI18n();
  const api = usePagination({
    page,
    pageCount,
    siblingCount,
    boundaryCount,
    disabled,
    onPageChange,
  });

  return (
    <nav className="pagination" {...api.rootProps} aria-label={label ?? t("pagination.label")}>
      <button
        className="pagination__control"
        {...api.getPrevProps()}
        aria-label={t("pagination.previous")}
      >
        ‹
      </button>
      {api.items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`e${index}`} className="pagination__ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={`p${item}`}
            className="pagination__page"
            {...api.getPageProps(item)}
            aria-label={t("pagination.page", { page: item })}
          >
            {item}
          </button>
        ),
      )}
      <button
        className="pagination__control"
        {...api.getNextProps()}
        aria-label={t("pagination.next")}
      >
        ›
      </button>
    </nav>
  );
}
