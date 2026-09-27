import { combobox } from "@design-system/core";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { useIsomorphicLayoutEffect } from "./layout-effect";

/** An option of an input-driven listbox, as the core describes one. */
export interface ListboxItem {
  value: string;
  label?: string;
  disabled?: boolean;
}

export type ListboxFilter<I extends ListboxItem> = (items: I[], query: string) => I[];

/** The state every input-driven listbox holds, whatever it selects. */
export interface ListboxState<I extends ListboxItem> {
  open: boolean;
  inputValue: string;
  activeValue: string | null;
  items: I[];
}

/** A case-insensitive substring match on the label; an empty query matches all. */
export function defaultFilter<I extends ListboxItem>(items: I[], query: string): I[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
}

export interface UseListboxStateOptions<I extends ListboxItem, S extends ListboxState<I>> {
  state: S;
  setState: Dispatch<SetStateAction<S>>;
  allItems: I[];
  filter: ListboxFilter<I>;
  onInputValueChange?: (text: string) => void;
  onOpenChange?: (open: boolean) => void;
  /**
   * Adjust the rest of the state when the item list itself changes, before
   * the visible list is filtered again from the text it returns.
   */
  followItems?: (state: S) => S;
}

export interface ListboxStateSetters<I extends ListboxItem> {
  /** The latest filter and items, for handlers that must not widen their deps. */
  latest: RefObject<{ filter: ListboxFilter<I>; allItems: I[] }>;
  setOpen: (open: boolean) => void;
  setActiveValue: (value: string | null) => void;
  setInputValue: (text: string) => void;
  /** Typing filters, opens and highlights the first match. */
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * The state plumbing an input-driven listbox shares, whatever it selects: the
 * visible list following the items, and the open, highlight and text setters.
 * The selection setter is the one piece each control writes itself.
 */
export function useListboxState<I extends ListboxItem, S extends ListboxState<I>>({
  state,
  setState,
  allItems,
  filter,
  onInputValueChange,
  onOpenChange,
  followItems,
}: UseListboxStateOptions<I, S>): ListboxStateSetters<I> {
  // Latest inputs, read by event handlers without widening their deps.
  const latest = useRef({ filter, allItems });
  useIsomorphicLayoutEffect(() => {
    latest.current = { filter, allItems };
  });

  // --- Keep the visible list in step when the item list itself changes.
  const [lastItems, setLastItems] = useState(allItems);
  if (allItems !== lastItems) {
    setLastItems(allItems);
    setState((current) => {
      const s = followItems ? followItems(current) : current;
      return {
        ...s,
        items: filter(allItems, s.inputValue),
        activeValue: allItems.some((i) => i.value === s.activeValue) ? s.activeValue : null,
      };
    });
  }

  // The setters write first and report afterwards (ADR 0011), from the
  // handler that called them: never from inside a state updater, which React
  // may run twice or while rendering. Like the checkbox's, they close over the
  // state of this render, which is the state the core's handlers act on, and
  // they report only when their own piece of it actually moves.
  const setOpen = useCallback(
    (next: boolean) => {
      if (state.open === next) return;
      setState((s) => ({ ...s, open: next }));
      onOpenChange?.(next);
    },
    [state.open, setState, onOpenChange],
  );

  const setActiveValue = useCallback(
    (next: string | null) => {
      setState((s) => (s.activeValue === next ? s : { ...s, activeValue: next }));
    },
    [setState],
  );

  const setInputValue = useCallback(
    (next: string) => {
      if (state.inputValue === next) return;
      const items = filter(allItems, next);
      setState((s) => ({ ...s, inputValue: next, items }));
      onInputValueChange?.(next);
    },
    [state.inputValue, setState, filter, allItems, onInputValueChange],
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      const next = latest.current.filter(latest.current.allItems, text);
      setInputValue(text);
      // Typing highlights the first match, and opens the list if it was closed.
      setActiveValue(combobox.firstEnabled(next));
      setOpen(true);
    },
    [setInputValue, setActiveValue, setOpen],
  );

  return { latest, setOpen, setActiveValue, setInputValue, onInputChange };
}
