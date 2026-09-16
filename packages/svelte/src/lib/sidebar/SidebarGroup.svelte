<script lang="ts">
  /**
   * One collapsible section of a Sidebar: a disclosure button over a list of
   * items. The wiring (`aria-expanded`, `aria-controls`, disabled handling)
   * comes from the headless collapsible, so this file only places the chevron
   * and the list.
   *
   * The open state belongs to the Sidebar, which is the only thing that knows
   * whether the consumer is controlling it.
   */
  import { tick } from "svelte";
  import { createCollapsible } from "../collapsible/create-collapsible";
  import Icon from "../icon/Icon.svelte";

  /** Section heading, and the trigger's accessible name. */
  export let label: string;
  export let open = false;
  /** Whether the labels are hidden, which is the rail. */
  export let collapsed = false;
  export let onToggle: (() => void) | undefined = undefined;

  let lastOpen = open;

  const { triggerAction, contentAction, syncOpen } = createCollapsible({
    open,
    onOpenChange: () => {
      // This section holds no state of its own: the press is a request, and
      // the Sidebar decides what the open set becomes. Once the Sidebar has had
      // its say, the disclosure goes wherever `open` now says, so a set the
      // application controls moves only when the application moves it
      // (ADR 0011). The wait is needed because the report arrives while the
      // press is still being applied.
      onToggle?.();
      tick().then(() => syncOpen(open));
    },
  });

  // Controllable mirror, compared against the last value seen (ADR 0011): a
  // sync never reports a change.
  $: if (open !== lastOpen) {
    lastOpen = open;
    syncOpen(open);
  }
</script>

<div class="sidebar__section" data-state={open ? "open" : "closed"}>
  <button type="button" class="sidebar__group" use:triggerAction>
    <span class="sidebar__group-label" class:sidebar__label--hidden={collapsed}>{label}</span>
    <span class="sidebar__chevron" class:sidebar__chevron--open={open} aria-hidden="true">
      <Icon size="1em"><polyline points="9 18 15 12 9 6" /></Icon>
    </span>
  </button>
  <div class="sidebar__group-content" use:contentAction>
    <slot />
  </div>
</div>

<style>
  .sidebar__group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    inline-size: 100%;
    margin-block-end: 0.25rem;
    padding: 0.25rem 0.5rem;
    font: inherit;
    font-size: 0.6875rem;
    font-weight: 700;
    text-align: start;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ds-color-text-secondary, #524c44);
    background: none;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .sidebar__group:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
  }
  .sidebar__group:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  .sidebar__chevron {
    display: inline-flex;
    transition: rotate 150ms ease;
  }
  .sidebar__chevron--open {
    rotate: 90deg;
  }
  /* The label leaves the page but stays in the accessibility tree: the rail
     hides names from sight, never from a screen reader. */
  .sidebar__label--hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .sidebar__chevron {
      transition: none;
    }
  }
</style>
