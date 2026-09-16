<script lang="ts">
  /**
   * One collapsible section of a Sidebar: a disclosure button over a list of
   * items. The wiring (`aria-expanded`, `aria-controls`) comes from the
   * headless collapsible; this file places the chevron and the list.
   *
   * The section holds no state of its own: what it shows is the `open` prop,
   * and a press is a request the Sidebar answers. A set the application
   * controls therefore moves only when the application moves it, and nothing
   * flickers in between (ADR 0011).
   */
  import { collapsible as core } from "@design-system/core";
  import { writable } from "svelte/store";
  import Icon from "../icon/Icon.svelte";
  import { createPropsAction } from "../internal/connect";
  import { normalizeProps } from "../normalize";
  import { stableId } from "../internal/stable-id";

  /** Section heading, and the trigger's accessible name. */
  export let label: string;
  export let open = false;
  /** Whether the labels are hidden, which is the rail. */
  export let collapsed = false;
  export let onToggle: (() => void) | undefined = undefined;

  const id = stableId("ds-sidebar-group");
  const api = writable(connect(open));

  function connect(isOpen: boolean) {
    return core.connect({
      state: { open: isOpen, disabled: false, id },
      setOpen: () => onToggle?.(),
      normalize: normalizeProps,
    });
  }

  $: api.set(connect(open));

  const triggerAction = createPropsAction(api, (a) => a.triggerProps);
  const contentAction = createPropsAction(api, (a) => a.contentProps);
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
