import { forwardRef, useMemo, type ReactNode } from "react";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { DialogHeader } from "../dialog/DialogHeader";
import { DialogStatus } from "../dialog/DialogStatus";
import { useDialogHandle, type DialogHandle } from "../dialog/use-dialog-handle";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { Kbd } from "../kbd/Kbd";
import { useSearchDialog, type SearchDialogItem } from "./use-search-dialog";

export interface SearchDialogProps {
  /** Visual variant for the trigger Button. */
  triggerVariant?: ButtonVariant;
  /** The trigger button's content. Defaults to the catalog's "Search…". */
  trigger?: ReactNode;
  /** The searchable results. */
  items: SearchDialogItem[];
  /**
   * Items shown while the query is empty: recents, frequent searches. The
   * application measures and decides; the dialog displays. They may carry their
   * own `group` ("Recent"). Empty means an empty query shows all items.
   */
  suggestions?: SearchDialogItem[];
  /**
   * Results are being fetched: shows an indicator, announces "Searching…"
   * through the status region and holds back the empty state meanwhile. Feed
   * async results through `items` when they arrive.
   */
  loading?: boolean;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Accessible title for the dialog. Defaults to the catalog's "Search". */
  title?: string;
  /**
   * Visually hide the title (the default: the search field reads as the
   * header). It still names the dialog for screen readers.
   */
  hideTitle?: boolean;
  /** Show a close button in the header; it closes like Escape. */
  closeButton?: boolean;
  /** Accessible label for the close button. Defaults to the catalog's "Close". */
  closeLabel?: string;
  /** Accessible label for the search input. Defaults to the catalog's "Search". */
  label?: string;
  /** Input placeholder. Defaults to the catalog's "Type to search…". */
  placeholder?: string;
  /** Text shown when nothing matches. Defaults to the catalog's "No results found.". */
  emptyText?: string;
  /** Filter results against the query. Defaults to case-insensitive substring. */
  filter?: (items: SearchDialogItem[], query: string) => SearchDialogItem[];
  /** Called when a result is chosen (before the dialog closes). */
  onSelect?: (value: string) => void;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/** A run of consecutive results sharing a group (or the ungrouped run). */
interface Section {
  group: string | null;
  items: SearchDialogItem[];
}

const searchIcon = (
  <span className="search-dialog__search-icon" aria-hidden="true">
    <Icon size="100%">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  </span>
);

// The Loading indicator's decorative dots, with the other adapters' markup:
// the results status region announces the state.
const loadingIndicator = (
  <div className="search-dialog__loading">
    <span className="loading" data-variant="dots" aria-hidden="true">
      <span className="loading__indicator">
        <span className="loading__dot" />
        <span className="loading__dot" />
        <span className="loading__dot" />
      </span>
    </span>
  </div>
);

/**
 * SearchDialog: search and pick from a list, in a modal (the pattern often
 * called "command palette"): a search combobox inside a modal dialog. The
 * modal shell (native `<dialog>` + `showModal()`, scroll lock, Escape and
 * backdrop close, focus restore) and the search, filter and keyboard
 * behaviour come from the headless dialog and combobox
 * (`@design-system/core`) through `useSearchDialog`; this is the styled
 * wrapper. A visually hidden `role="status"` region announces the filtered
 * result count.
 *
 * Pass `items` (`{ value, label?, disabled?, group?, shortcut? }`);
 * `onSelect(value)` runs when a result is chosen. No keyboard shortcut is
 * built in: drive `open` and wire the shortcut in the application. The header
 * is the one the dialog family shares; by default it only names the dialog,
 * and `hideTitle={false}` / `closeButton` show the title and a close button
 * above the search field. Themeable via `--ds-search-dialog-*`.
 *
 * A ref holds the status area after the results (ADR 0016), with the same
 * contract as `Dialog`: `notify(options)`, `dismissNotice(id)` and
 * `clearNotices()`.
 */
// Marked pure, so an import of another component leaves this one out.
export const SearchDialog = /* @__PURE__ */ forwardRef<DialogHandle, SearchDialogProps>(
  function SearchDialog(
    {
      triggerVariant = "default",
      trigger,
      items,
      suggestions,
      loading = false,
      open = false,
      title,
      hideTitle = true,
      closeButton = false,
      closeLabel,
      label,
      placeholder,
      emptyText,
      filter,
      onSelect,
      onOpenChange,
    },
    ref,
  ) {
    const { t } = useI18n();
    const search = useSearchDialog({ items, suggestions, open, filter, onSelect, onOpenChange });
    useDialogHandle(ref, search);
    const {
      api,
      dialogApi,
      open: isOpen,
      items: visible,
      inputValue,
      onInputChange,
      triggerRef,
      panelRef,
    } = search;

    // The hook puts items in display order (ungrouped first, then one run per
    // group), so consecutive runs of the same group form the sections.
    const sections = useMemo(
      () =>
        visible.reduce<Section[]>((acc, item) => {
          const group = item.group ?? null;
          const last = acc[acc.length - 1];
          if (last && last.group === group) last.items.push(item);
          else acc.push({ group, items: [item] });
          return acc;
        }, []),
      [visible],
    );

    const resolvedEmptyText = emptyText ?? t("searchDialog.empty");
    const count = visible.length;
    const option = (item: SearchDialogItem) => (
      <div key={item.value} {...api.getOptionProps(item.value)} className="search-dialog__item">
        <span className="search-dialog__item-label">{item.label ?? item.value}</span>
        {item.shortcut ? (
          <span className="search-dialog__item-shortcut">
            {Array.isArray(item.shortcut) ? (
              <Kbd keys={item.shortcut} />
            ) : (
              <Kbd>{item.shortcut}</Kbd>
            )}
          </span>
        ) : null}
      </div>
    );

    return (
      <>
        <Button variant={triggerVariant} {...dialogApi.triggerProps} ref={triggerRef}>
          {trigger ?? t("searchDialog.trigger")}
        </Button>

        {isOpen ? (
          <dialog {...dialogApi.contentProps} ref={panelRef} className="search-dialog__panel">
            <DialogHeader
              title={title ?? t("searchDialog.title")}
              hideTitle={hideTitle}
              closeButton={closeButton}
              closeLabel={closeLabel ?? t("dialog.close")}
              titleProps={dialogApi.titleProps}
              closeProps={dialogApi.closeProps}
            />

            <div className="search-dialog__search">
              {searchIcon}
              <label {...api.labelProps} className="search-dialog__sr-only">
                {label ?? t("searchDialog.label")}
              </label>
              <input
                {...api.inputProps}
                className="search-dialog__input"
                type="text"
                placeholder={placeholder ?? t("searchDialog.placeholder")}
                value={inputValue}
                onChange={onInputChange}
              />
            </div>

            {/* Polite announcement of the filtered results for screen readers. */}
            <div className="search-dialog__sr-only" role="status">
              {loading
                ? t("searchDialog.loading")
                : count === 0
                  ? resolvedEmptyText
                  : t("searchDialog.results", { count })}
            </div>

            {loading ? loadingIndicator : null}

            {/* The listbox stays in the DOM even when empty, so the input's
                aria-controls keeps pointing at a real element. Divs with
                explicit roles: ARIA in HTML disallows role="group" on <li>. */}
            <div {...api.listboxProps} className="search-dialog__list">
              {sections.flatMap((section) =>
                section.group
                  ? [
                      // The visible header is hidden from assistive tech; the
                      // group's aria-label carries the same name, announced once.
                      <div
                        key={`group-${section.group}`}
                        className="search-dialog__group"
                        role="group"
                        aria-label={section.group}
                      >
                        <span className="search-dialog__group-header" aria-hidden="true">
                          {section.group}
                        </span>
                        {section.items.map(option)}
                      </div>,
                    ]
                  : // Ungrouped results stay direct children of the listbox.
                    section.items.map(option),
              )}
            </div>

            {count === 0 && !loading ? (
              <p className="search-dialog__empty">{resolvedEmptyText}</p>
            ) : null}

            {/* No footer: the status area closes the panel, after the results. */}
            <DialogStatus {...search} />
          </dialog>
        ) : null}
      </>
    );
  },
);
