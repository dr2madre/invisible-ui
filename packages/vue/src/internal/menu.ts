import { menu as core } from "@design-system/core";

/**
 * The menu parts DropdownMenu and ContextMenu share: both render the same
 * headless menu (`@design-system/core`), so the DOM lookups and the typeahead
 * live here once.
 */

const TYPEAHEAD_RESET = 500;

/** The rendered node of the item with `value`, if any. */
export function menuItemNode(popup: HTMLElement | null, value: string | null): HTMLElement | null {
  return value && popup
    ? popup.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
    : null;
}

export interface Typeahead {
  /** The item the key moves to, or `null` when the key is not printable or nothing matches. */
  match: (
    event: KeyboardEvent,
    items: core.MenuEntry[],
    activeValue: string | null,
  ) => string | null;
  /** Drop the buffer and its pending reset. */
  reset: () => void;
}

/** Typeahead over a menu's items: printable keys build a short-lived buffer. */
export function createTypeahead(): Typeahead {
  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    match: (event, items, activeValue) => {
      const printable =
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        /\S/.test(event.key);
      if (!printable) return null;
      buffer += event.key;
      clearTimeout(timer);
      timer = setTimeout(() => (buffer = ""), TYPEAHEAD_RESET);
      return core.matchItem(items, buffer, activeValue);
    },
    reset: () => {
      clearTimeout(timer);
      buffer = "";
    },
  };
}
