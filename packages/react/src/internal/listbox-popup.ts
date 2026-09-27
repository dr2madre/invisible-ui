import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react-dom";
import { useCallback, useEffect, useRef, type CSSProperties, type RefObject } from "react";

// The popup is at least as wide as the input it hangs from.
const matchReferenceWidth = size({
  apply({ rects, elements: { floating } }) {
    floating.style.minWidth = `${rects.reference.width}px`;
  },
});

export interface UseListboxPopupOptions {
  open: boolean;
  /** The highlighted option, kept scrolled into view while it moves. */
  activeValue: string | null;
  setOpen: (open: boolean) => void;
  setActiveValue: (value: string | null) => void;
  /**
   * What the popup's minimum width follows: the input it is positioned from,
   * or the whole control wrapper, whose width changes as tags wrap.
   */
  widthOf: "input" | "control";
}

export interface ListboxPopup {
  /** The input as positioning holds it, in state, readable while rendering. */
  reference: HTMLInputElement | null;
  inputRef: (node: HTMLInputElement | null) => void;
  listboxRef: (node: HTMLElement | null) => void;
  controlRef: RefObject<HTMLDivElement | null>;
  inputEl: RefObject<HTMLInputElement | null>;
  floatingStyles: CSSProperties;
}

/**
 * The popup plumbing an input-driven listbox needs, and the core leaves out
 * because it is a DOM concern: positioning (Floating UI, flip/shift), a
 * minimum width that follows the control, close-on-outside-pointer, and
 * keeping the active option scrolled into view.
 */
export function useListboxPopup({
  open,
  activeValue,
  setOpen,
  setActiveValue,
  widthOf,
}: UseListboxPopupOptions): ListboxPopup {
  // --- Positioning. `whileElementsMounted` is gated on `open` so autoUpdate
  // only tracks scroll/resize while the popup is actually showing. Following
  // the input, the width is measured on every update, so it tracks the input
  // while open.
  const { refs, elements, floatingStyles } = useFloating<HTMLInputElement>({
    placement: "bottom-start",
    strategy: "fixed",
    middleware:
      widthOf === "input"
        ? [offset(4), flip({ padding: 8 }), shift({ padding: 8 }), matchReferenceWidth]
        : [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: open ? autoUpdate : undefined,
  });

  const controlRef = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement | null>(null);
  const listboxEl = useRef<HTMLElement | null>(null);

  const inputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputEl.current = node;
      refs.setReference(node);
    },
    [refs],
  );

  const listboxRef = useCallback(
    (node: HTMLElement | null) => {
      listboxEl.current = node;
      refs.setFloating(node);
    },
    [refs],
  );

  // --- Close when a pointer goes down anywhere outside the control or popup.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: Event) => {
      const target = event.target as Node;
      if (
        controlRef.current?.contains(target) ||
        inputEl.current?.contains(target) ||
        listboxEl.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setActiveValue(null);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, setOpen, setActiveValue]);

  // --- Following the control, the popup is at least as wide as it, and stays
  // so while open: tags wrapping onto a new line or a resized container change
  // that width. Floating UI's watcher reports both.
  useEffect(() => {
    if (widthOf !== "control") return;
    const reference = controlRef.current ?? inputEl.current;
    const listbox = listboxEl.current;
    if (!open || !reference || !listbox) return;
    return autoUpdate(reference, listbox, () => {
      listbox.style.minWidth = `${reference.offsetWidth}px`;
    });
  }, [open, widthOf]);

  // --- Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      listboxEl.current
        ?.querySelector<HTMLElement>("[data-active]")
        ?.scrollIntoView?.({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, activeValue]);

  return {
    reference: elements.reference,
    inputRef,
    listboxRef,
    controlRef,
    inputEl,
    floatingStyles,
  };
}
