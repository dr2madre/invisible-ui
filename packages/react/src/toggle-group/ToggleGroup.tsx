import { toggleGroup as core } from "@design-system/core";
import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../internal/cx";

export type ToggleGroupVariant = "separate" | "segmented";
export type ToggleGroupOrientation = "horizontal" | "vertical";

export interface ToggleGroupProps {
  /** Visual style. `separate` keeps each toggle's own style; `segmented` joins them. */
  variant?: ToggleGroupVariant;
  /** Layout axis, and the arrow keys that move focus when the group roves. */
  orientation?: ToggleGroupOrientation;
  /**
   * Let the toggles wrap onto multiple lines when they overflow the available
   * width (e.g. a row of filter chips in a narrow panel). Meaningful on a
   * horizontal `separate` group; ignored when `segmented`, which is one control.
   */
  wrap?: boolean;
  /**
   * Optional container name for screen readers (the group's `aria-label`). It
   * names the container, not the items; omit it when the toggles are unrelated.
   */
  label?: string;
  /** The `ToggleButton`s. */
  children?: ReactNode;
}

/** The toggles of a group, in DOM order. */
const togglesOf = (root: HTMLElement): HTMLButtonElement[] =>
  Array.from(root.querySelectorAll<HTMLButtonElement>("button.toggle"));

/** Inside a toolbar, the toolbar's tab stop and keys apply instead. */
const inToolbar = (root: HTMLElement): boolean =>
  root.parentElement?.closest('[role="toolbar"]') != null;

const disabledOf = (toggles: HTMLButtonElement[]): boolean[] => toggles.map((t) => t.disabled);

/**
 * ToggleGroup: arranges independent `ToggleButton` children and gives them a
 * shared look. It carries no selection state of its own: each ToggleButton
 * inside is a standalone on/off control that owns its `pressed` state, label
 * and form field.
 *
 * Keyboard: with three or more toggles the group is one tab stop, and the
 * arrow keys (Left and Right, mirrored in right-to-left text, or Up and Down
 * when vertical) move focus between the enabled toggles, wrapping, with Home
 * and End for the ends. With one or two toggles each is its own tab stop.
 * Inside a `Toolbar` the toolbar's navigation applies and the group adds
 * none. Moving focus never changes a toggle; when the focused toggle is
 * removed, focus goes to its neighbour.
 *
 * `separate` (default) keeps each toggle's style, spaced by a gap; `segmented`
 * joins them into one control with a single outer border and thin dividers.
 * The group is a `role="group"`, named by the optional `label`. Themeable via
 * `--ds-toggle-group-*`.
 */
export function ToggleGroup({
  variant = "separate",
  orientation = "horizontal",
  wrap = false,
  label,
  children,
}: ToggleGroupProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // The toggle focused last, its index, and whether focus is still inside:
  // a toggle removed while focused leaves focus on the body without a blur.
  const last = useRef<{ toggle: HTMLButtonElement | null; index: number; inside: boolean }>({
    toggle: null,
    index: -1,
    inside: false,
  });

  // The toggle count, their disabled values and the toolbar around can all
  // change after mount, so the tab stops are reassessed on each change.
  // Client-only: the server renders no tabindex.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reconcile = () => {
      if (inToolbar(root)) return;
      const toggles = togglesOf(root);
      const state = last.current;
      const lost =
        state.inside &&
        state.toggle !== null &&
        !state.toggle.isConnected &&
        (document.activeElement === null || document.activeElement === document.body);
      if (lost) {
        const target =
          toggles[core.refocusIndex({ lastIndex: state.index, count: toggles.length })];
        if (target) {
          state.toggle = target;
          state.index = toggles.indexOf(target);
          target.focus();
        }
      }
      if (!core.roves({ count: toggles.length, inToolbar: false })) {
        for (const toggle of toggles) toggle.removeAttribute("tabindex");
        return;
      }
      const stop = core.tabStop({
        disabled: disabledOf(toggles),
        focused: toggles.indexOf(document.activeElement as HTMLButtonElement),
        last: state.toggle ? toggles.indexOf(state.toggle) : -1,
      });
      toggles.forEach((toggle, i) => {
        toggle.tabIndex = i === stop ? 0 : -1;
      });
    };
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(root, { childList: true, subtree: true, attributeFilter: ["disabled"] });
    return () => observer.disconnect();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    if (inToolbar(root)) return;
    const toggles = togglesOf(root);
    if (!core.roves({ count: toggles.length, inToolbar: false })) return;
    const index = toggles.findIndex((toggle) => toggle === event.target);
    if (index === -1) return;
    const next = core.move({
      key: event.key,
      index,
      disabled: disabledOf(toggles),
      orientation,
      direction: getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    const target = toggles[next];
    if (!target) return;
    event.preventDefault();
    toggles.forEach((toggle) => {
      toggle.tabIndex = toggle === target ? 0 : -1;
    });
    target.focus();
  };

  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    const toggles = togglesOf(root);
    // React types a focus event's target as the listening element.
    const target: Element = event.target;
    const index = toggles.findIndex((toggle) => toggle === target);
    if (index === -1) return;
    last.current = { toggle: toggles[index]!, index, inside: true };
    if (inToolbar(root) || !core.roves({ count: toggles.length, inToolbar: false })) return;
    toggles.forEach((toggle, i) => {
      toggle.tabIndex = i === index ? 0 : -1;
    });
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    const to = event.relatedTarget as Node | null;
    if (to && root.contains(to)) return;
    if (to) {
      last.current.inside = false;
      return;
    }
    // Focus went nowhere: the toggle was removed, or the page itself was
    // clicked. Only a toggle still in the page means focus left on purpose;
    // the check waits past the removal's own reconcile.
    const from: Element = event.target;
    setTimeout(() => {
      if (from.isConnected && last.current.toggle === from) last.current.inside = false;
    }, 0);
  };

  return (
    <div
      ref={rootRef}
      className={cx(
        "toggle-group",
        `toggle-group--${variant}`,
        wrap && variant === "separate" && "toggle-group--wrap",
      )}
      role="group"
      aria-label={label}
      data-orientation={orientation}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </div>
  );
}
