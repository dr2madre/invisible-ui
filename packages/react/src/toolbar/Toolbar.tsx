import { toolbar as core } from "@design-system/core";
import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

export type ToolbarOrientation = core.ToolbarOrientation;

export interface ToolbarProps {
  /** Accessible name for the toolbar (required). */
  label: string;
  orientation?: ToolbarOrientation;
  /**
   * Flat presentation: the controls inside lose their individual borders and
   * fill at rest (they read as one group, divided only by separators), with a
   * subtle hover overlay. The toolbar's own frame still groups them.
   */
  flat?: boolean;
  /** The controls: buttons, toggle buttons, separators. */
  children?: ReactNode;
}

const FOCUSABLE =
  'button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], a[href], input, select, textarea';

/** All controls that belong directly to this toolbar, in DOM order. */
const controlsOf = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.closest('[role="toolbar"]') === root,
  );

/** The enabled controls only: the ones keyboard navigation can reach. */
const itemsOf = (root: HTMLElement): HTMLElement[] =>
  controlsOf(root).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true",
  );

/** Make `target` the single tab stop; every other control leaves the Tab order. */
const assignTabStop = (root: HTMLElement, target: HTMLElement) => {
  for (const el of controlsOf(root)) el.tabIndex = el === target ? 0 : -1;
};

/**
 * Toolbar: a grouping container (WAI-ARIA `role="toolbar"`) for a set of
 * related controls (buttons, toggle buttons), optionally divided into groups
 * with `Separator`.
 *
 * Implements the toolbar keyboard pattern: a single tab stop (roving
 * tabindex) and arrow-key navigation between controls, Left and Right for a
 * horizontal toolbar, Up and Down for a vertical one, plus Home and End,
 * wrapping at the ends. Tab moves into and out of the whole toolbar. The
 * controls are found in the DOM, so any child that renders a button takes
 * part, whatever component renders it.
 *
 * A `label` is required (the toolbar needs an accessible name). Layout gap is
 * themeable via `--ds-toolbar-gap`.
 */
export function Toolbar({
  label,
  orientation = "horizontal",
  flat = false,
  children,
}: ToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // The control holding the single tab stop.
  const tabStop = useRef<HTMLElement | null>(null);

  const setTabStop = (root: HTMLElement, target: HTMLElement) => {
    tabStop.current = target;
    assignTabStop(root, target);
  };

  // Children can be added, removed, or toggle disabled after mount; the single
  // tab stop is asserted again, keeping the last focused control while it is
  // still enabled and falling back to the first enabled control otherwise.
  // Client-only: the container renders on the server without it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reconcile = () => {
      const list = itemsOf(root);
      if (list.length === 0) return;
      const current = tabStop.current;
      const target = current && list.includes(current) ? current : list[0]!;
      tabStop.current = target;
      assignTabStop(root, target);
    };
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributeFilter: ["disabled", "aria-disabled"],
    });
    return () => observer.disconnect();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    const list = itemsOf(root);
    const current = list.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    // Which arrows mean what, including in right-to-left text, is shared with
    // the other adapters; finding the controls and moving focus is ours.
    const next = core.nextIndex({
      key: event.key,
      index: current,
      count: list.length,
      orientation,
      direction: getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    const target = list[next];
    if (!target) return;
    event.preventDefault();
    setTabStop(root, target);
    target.focus();
  };

  /** Keep the most recently focused control as the single tab stop. */
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (itemsOf(event.currentTarget).includes(target)) setTabStop(event.currentTarget, target);
  };

  return (
    // The toolbar hands focus to its controls (roving tabindex); the container
    // itself is not a tab stop.
    <div
      ref={rootRef}
      className="toolbar"
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      data-orientation={orientation}
      data-flat={flat ? "" : undefined}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      {children}
    </div>
  );
}
