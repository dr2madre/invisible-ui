<script lang="ts">
  /**
   * Toolbar — a grouping container (WAI-ARIA `role="toolbar"`) for a set of
   * related controls (buttons, toggle buttons), optionally divided into groups
   * with `Separator`.
   *
   * Implements the toolbar keyboard pattern: a single tab stop (roving
   * tabindex) and arrow-key navigation between controls — Left/Right for a
   * horizontal toolbar, Up/Down for a vertical one — plus Home/End, wrapping at
   * the ends. Tab moves into and out of the whole toolbar.
   *
   * A `label` is required (the toolbar needs an accessible name). Layout gap is
   * themeable via `--ds-toolbar-gap`.
   */
  import type { Action } from "svelte/action";

  export let label: string;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  /**
   * Flat presentation: the controls inside lose their individual borders and
   * fill at rest (they read as one group, divided only by separators), with a
   * subtle hover overlay. The toolbar's own frame still groups them.
   */
  export let flat = false;

  let root: HTMLElement;

  const FOCUSABLE =
    'button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], a[href], input, select, textarea';

  /** The enabled controls that belong directly to this toolbar, in DOM order. */
  function items(): HTMLElement[] {
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) =>
        el.closest('[role="toolbar"]') === root &&
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-disabled") !== "true",
    );
  }

  /** Make `index` the single tab stop; everything else is removed from Tab. */
  function setTabStop(list: HTMLElement[], index: number) {
    list.forEach((el, i) => (el.tabIndex = i === index ? 0 : -1));
  }

  function focusAt(index: number) {
    const list = items();
    if (list.length === 0) return;
    const wrapped = (index + list.length) % list.length;
    setTabStop(list, wrapped);
    list[wrapped]!.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    const horizontal = orientation === "horizontal";
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    switch (event.key) {
      case horizontal ? "ArrowRight" : "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case horizontal ? "ArrowLeft" : "ArrowUp":
        event.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(list.length - 1);
        break;
    }
  }

  /** Keep the most recently focused control as the single tab stop. */
  function onFocusIn(event: FocusEvent) {
    const list = items();
    const index = list.indexOf(event.target as HTMLElement);
    if (index >= 0) setTabStop(list, index);
  }

  // Set the initial roving tab stop once mounted. An action (not onMount) keeps
  // this client-only and SSR-safe — the container renders fine on the server.
  const initTabStop: Action<HTMLElement> = () => {
    const list = items();
    if (list.length) setTabStop(list, 0);
  };
</script>

<!-- The toolbar delegates focus to its controls (roving tabindex); the
     container itself is intentionally not a tab stop. -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  class="toolbar"
  role="toolbar"
  aria-label={label}
  aria-orientation={orientation}
  data-orientation={orientation}
  data-flat={flat ? "" : undefined}
  bind:this={root}
  use:initTabStop
  on:keydown={onKeyDown}
  on:focusin={onFocusIn}
>
  <slot />
</div>

<style>
  .toolbar {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-toolbar-gap, 0.375rem);
    padding: var(--ds-toolbar-padding, 0.25rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-toolbar-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
  }
  .toolbar:global([data-orientation="vertical"]) {
    flex-direction: column;
    align-items: stretch;
  }
  /* Flat: make the controls inside borderless and transparent at rest, with a
     subtle hover overlay. These custom properties cascade to the toggle buttons,
     which read them. */
  .toolbar:global([data-flat]) {
    --ds-toggle-border: transparent;
    --ds-toggle-bg: transparent;
    --ds-toggle-bg-hover: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
</style>
