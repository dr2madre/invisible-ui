<script lang="ts">
  /**
   * ToggleGroup — arranges a set of independent `<ToggleButton>` children and
   * gives them a shared look and one keyboard rule. It carries no selection
   * state of its own: each ToggleButton inside is a standalone on/off control
   * (a native button with `aria-pressed`) that owns its own `pressed` state,
   * label and form field. Insert the toggles as `children`.
   *
   * Styles:
   * - `separate` (default) — each toggle keeps its own default style, spaced by
   *   a gap.
   * - `segmented` — items are joined into one control: their individual borders
   *   are dropped and the group draws a single outer border with thin dividers.
   *
   * Keyboard (the shared rule in `@design-system/core`): with three or more
   * toggles the group is one tab stop, and the arrow keys move focus between
   * the enabled toggles, wrapping at the ends. Left and Right follow the
   * reading direction in a horizontal group, Up and Down move in a vertical
   * one, Home and End jump to the ends. With one or two toggles each toggle is
   * its own tab stop. Inside a `Toolbar` the toolbar's keys apply and the group
   * adds none. Moving focus never changes a toggle; when the focused toggle is
   * removed, focus moves to its neighbour.
   *
   * Accessibility: the group is a `role="group"`. The optional `label` becomes
   * the group's `aria-label` — a *container* name (e.g. "Formatting") that gives
   * screen-reader context ("group, Formatting"). It is optional and different in
   * nature from a form label: it names the container, it does not label the
   * items (each toggle carries its own name). If the toggles are unrelated, omit
   * it entirely. Radius, spacing and colors are themeable via
   * `--ds-toggle-group-*`.
   */
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { toggleGroup as core } from "@design-system/core";

  interface Props {
    /** Visual style. `separate` keeps each toggle's own style; `segmented` joins them. */
    variant?: "separate" | "segmented";
    /**
     * Layout axis. It also picks the arrow keys when the group is one tab
     * stop: Left and Right when horizontal, Up and Down when vertical.
     */
    orientation?: "horizontal" | "vertical";
    /**
     * Let the toggles wrap onto multiple lines when they overflow the available
     * width (e.g. a row of filter chips in a narrow panel). Only meaningful on a
     * horizontal `separate` group; ignored when `segmented`, which is one control.
     */
    wrap?: boolean;
    /**
     * Optional container name for screen readers (the group's `aria-label`). Names
     * the container, not the items; omit it when the toggles are unrelated.
     */
    label?: string;
    children?: Snippet;
  }

  let {
    variant = "separate",
    orientation = "horizontal",
    wrap = false,
    label,
    children,
  }: Props = $props();

  // The group element, set once it is in the page.
  let root: HTMLElement | undefined;
  // The toggle focused last and its index: where focus returns when it is
  // removed, and which toggle keeps the tab stop.
  let lastFocused: HTMLButtonElement | null = null;
  let lastIndex = -1;
  // Whether focus is still in the group, as far as it can tell: a toggle
  // removed while focused takes focus with it and fires nothing reliable.
  let holdsFocus = false;
  // Toggles whose tabindex this group wrote, so it only removes its own. A
  // plain array: nothing renders from it.
  let managed: HTMLElement[] = [];

  /** The toggles inside the group, in DOM order. */
  function toggles(): HTMLButtonElement[] {
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLButtonElement>("button.toggle"));
  }

  /** A toolbar around the group owns the keys and the tab stop. */
  function inToolbar(): boolean {
    return root?.parentElement?.closest('[role="toolbar"]') != null;
  }

  function roving(list: HTMLButtonElement[]): boolean {
    return core.roves({ count: list.length, inToolbar: inToolbar() });
  }

  function setTabStop(list: HTMLButtonElement[], stop: number) {
    list.forEach((el, i) => {
      el.tabIndex = i === stop ? 0 : -1;
      if (!managed.includes(el)) managed.push(el);
    });
  }

  /** Give each toggle its own tab stop back. */
  function release() {
    for (const el of managed) el.removeAttribute("tabindex");
    managed = [];
  }

  // Children can be added, removed, or toggle disabled after mount: the count
  // decides whether the group is one tab stop, and focus is never lost.
  function reconcile() {
    if (inToolbar()) {
      managed = [];
      return;
    }
    // Removed toggles are dropped, so they are not held on to.
    managed = managed.filter((el) => el.isConnected);
    const list = toggles();
    const active = document.activeElement;
    const lost = !active || active === document.body;
    if (holdsFocus && lastFocused && !lastFocused.isConnected && lost) {
      const target = list[core.refocusIndex({ lastIndex, count: list.length })];
      lastFocused = null;
      holdsFocus = false;
      target?.focus();
    } else if (lastFocused?.isConnected) {
      lastIndex = list.indexOf(lastFocused);
    }

    if (!roving(list)) {
      release();
      return;
    }
    setTabStop(
      list,
      core.tabStop({
        disabled: list.map((el) => el.disabled),
        focused: list.indexOf(document.activeElement as HTMLButtonElement),
        last: lastIndex,
      }),
    );
  }

  function onKeyDown(event: KeyboardEvent) {
    const list = toggles();
    if (!roving(list)) return;
    const index = list.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    const next = core.move({
      key: event.key,
      index,
      disabled: list.map((el) => el.disabled),
      orientation,
      direction: root && getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    event.preventDefault();
    setTabStop(list, next);
    list[next]!.focus();
  }

  function onFocusIn(event: FocusEvent) {
    const list = toggles();
    const index = list.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    lastFocused = list[index]!;
    lastIndex = index;
    holdsFocus = true;
    if (roving(list)) setTabStop(list, index);
  }

  // Focus left for somewhere else, unless the toggle left with it: a toggle
  // still in the page means the user moved on, so a later removal must not
  // pull focus back.
  function onFocusOut(event: FocusEvent) {
    const target = event.target as Element;
    queueMicrotask(() => {
      if (target.isConnected && !root?.contains(document.activeElement)) holdsFocus = false;
    });
  }

  // An attachment keeps this client-only: on the server every toggle is its
  // own tab stop until the group mounts.
  const manageFocus: Attachment<HTMLElement> = (node) => {
    root = node;
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(node, { childList: true, subtree: true, attributeFilter: ["disabled"] });
    return () => observer.disconnect();
  };
</script>

<!-- The keys move focus between the toggles; the group itself never takes
     focus. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class={[
    "toggle-group",
    `toggle-group--${variant}`,
    wrap && variant === "separate" && "toggle-group--wrap",
  ]}
  role="group"
  aria-label={label}
  data-orientation={orientation}
  {@attach manageFocus}
  onkeydown={onKeyDown}
  onfocusin={onFocusIn}
  onfocusout={onFocusOut}
>
  {@render children?.()}
</div>

<style>
  .toggle-group {
    display: inline-flex;
    align-items: flex-start;
  }
  .toggle-group[data-orientation="vertical"] {
    flex-direction: column;
  }

  /* separate: each toggle keeps its own style, spaced by a gap. */
  .toggle-group--separate {
    gap: var(--ds-toggle-group-gap, 0.375rem);
  }
  /* Wrap a horizontal chip row onto multiple lines instead of overflowing. */
  .toggle-group--wrap {
    display: flex;
    flex-wrap: wrap;
  }

  /* segmented: join the toggles into one control, dropping their individual
     borders/radius through the ToggleButton's own custom properties and
     drawing a single outer border with thin dividers. */
  .toggle-group--segmented {
    gap: 0;
    border: 1px solid var(--ds-toggle-border, var(--ds-color-control-border, #757067));
    border-radius: var(--ds-toggle-group-radius, var(--ds-radius-control, 0.5rem));
    overflow: hidden;
    --ds-toggle-border-width: 0;
    --ds-toggle-radius: 0;
  }
  /* Divider between adjacent toggles (along the layout axis). It sits on one
     side only and keeps the border color in every state, which the child's
     custom properties cannot express, so it targets the child's part. A child
     is the toggle itself, or an element that holds it. */
  .toggle-group--segmented[data-orientation="horizontal"]
    > :global(:not(:first-child) .toggle__surface) {
    border-inline-start: 1px solid var(--ds-toggle-border, var(--ds-color-control-border, #757067));
  }
  .toggle-group--segmented[data-orientation="vertical"]
    > :global(:not(:first-child) .toggle__surface) {
    border-block-start: 1px solid var(--ds-toggle-border, var(--ds-color-control-border, #757067));
  }
</style>
