<script lang="ts">
  /**
   * Drawer — a bottom-anchored modal you can drag down to dismiss (the "Vaul"
   * pattern). Open state, focus trap, scroll lock, Escape / backdrop / close-
   * button dismissal, focus restore and ARIA come from the shared modal adapter
   * via `createDrawer` (which wraps `createDialog`); this component adds the grab
   * handle and binds the panel transform to the drag.
   *
   * Slots: `trigger` (the trigger button's content) and the default slot (the
   * body). Pass a `title` (required) and optional `description`. Colors, radius
   * and elevation are themeable via `--ds-dialog-*`; the handle and max height
   * via `--ds-drawer-*`.
   */
  import { createDrawer } from "./create-drawer";
  import { portal } from "../internal/portal";
  import Button from "../button/Button.svelte";

  /** Visual variant for the trigger Button. */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";
  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the drawer (required). */
  export let title: string;
  /** Optional description, wired via `aria-describedby`. */
  export let description: string | undefined = undefined;
  /** Accessible label for the close button. */
  export let closeLabel = "Close";
  /**
   * CSS selector (within the panel) for the element to focus on open. When
   * omitted, focus lands on the panel itself — never on the close button.
   */
  export let initialFocus: string | undefined = undefined;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const drawer = createDrawer({
    open,
    describedBy: description !== undefined,
    initialFocus,
    onOpenChange,
  });
  const {
    open: isOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
    closeAction,
    handleAction,
    dragOffset,
    dragging,
  } = drawer;
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot name="trigger">Open</slot>
</Button>

{#if $isOpen}
  <div class="drawer__portal" use:portal>
    <div class="drawer__overlay" aria-hidden="true"></div>
    <div
      class="drawer__panel"
      class:drawer__panel--dragging={$dragging}
      style:transform={`translateY(${$dragOffset}px)`}
      use:contentAction
    >
      <div class="drawer__handle" use:handleAction aria-hidden="true"></div>
      <header class="drawer__header">
        <h2 class="drawer__title" use:titleAction>{title}</h2>
        <button class="drawer__close" type="button" aria-label={closeLabel} use:closeAction>
          <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>
      {#if description !== undefined}
        <p class="drawer__description" use:descriptionAction>{description}</p>
      {/if}
      <div class="drawer__body"><slot /></div>
    </div>
  </div>
{/if}

<style>
  .drawer__portal {
    position: fixed;
    inset: 0;
    z-index: var(--ds-dialog-z-index, 60);
  }
  .drawer__overlay {
    position: fixed;
    inset: 0;
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }

  .drawer__panel {
    position: fixed;
    inset-inline: 0;
    inset-block-end: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-block-size: var(--ds-drawer-max-height, 85vh);
    overflow-y: auto;
    padding: 0 1.5rem 1.5rem;
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-block-end: 0;
    border-start-start-radius: var(--ds-drawer-radius, 1rem);
    border-start-end-radius: var(--ds-drawer-radius, 1rem);
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
    transition: transform var(--ds-drawer-duration, 0.3s) ease;
    animation: drawer-in var(--ds-drawer-duration, 0.3s) ease;
  }
  .drawer__panel--dragging {
    transition: none;
    user-select: none;
  }
  .drawer__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: -2px;
  }
  @keyframes drawer-in {
    from {
      transform: translateY(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer__panel {
      animation: none;
    }
  }

  .drawer__handle {
    flex: none;
    align-self: center;
    inline-size: var(--ds-drawer-handle-width, 2.5rem);
    block-size: 0.375rem;
    margin-block: 0.75rem 0.5rem;
    border-radius: 999px;
    background: var(--ds-drawer-handle, var(--ds-color-border, #cbd5e1));
    cursor: grab;
    touch-action: none;
  }
  .drawer__handle:active {
    cursor: grabbing;
  }

  .drawer__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .drawer__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .drawer__close {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    font-size: 1.25rem;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-control, 0.5rem);
    background: transparent;
    color: var(--ds-color-text-secondary, #64748b);
    cursor: pointer;
  }
  .drawer__close:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    color: inherit;
  }
  .drawer__close:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .drawer__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .drawer__body {
    margin-block-start: 1rem;
  }
</style>
