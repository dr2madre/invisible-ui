<script lang="ts">
  /**
   * Sheet — a Dialog anchored to an edge of the viewport (the common "side
   * panel" pattern). It reuses the headless dialog (`@design-system/core`) and
   * the shared modal adapter (`createDialog`) unchanged: portal to `<body>`,
   * focus trap, scroll lock, Escape / backdrop / close-button dismissal, and
   * focus restore. The only additions over `Dialog` are edge anchoring (`side`)
   * and a slide-in animation.
   *
   * Slots: `trigger` (the trigger button's content) and the default slot (the
   * body). Pass a `title` (required) and optional `description`. Colors, radius
   * and elevation are themeable via `--ds-dialog-*`; the panel extent via
   * `--ds-sheet-size`.
   */
  import { createDialog } from "../dialog/create-dialog";
  import { portal } from "../internal/portal";

  /** Which edge the sheet is anchored to. */
  export let side: "top" | "right" | "bottom" | "left" = "right";
  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the sheet (required). */
  export let title: string;
  /** Optional description, wired via `aria-describedby`. */
  export let description: string | undefined = undefined;
  /** Accessible label for the close button. */
  export let closeLabel = "Close";
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const dialog = createDialog({
    open,
    describedBy: description !== undefined,
    onOpenChange,
  });
  const {
    open: isOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
    closeAction,
  } = dialog;
</script>

<button class="sheet__trigger" type="button" use:triggerAction>
  <slot name="trigger">Open</slot>
</button>

{#if $isOpen}
  <div class="sheet__portal" use:portal>
    <div class="sheet__overlay" aria-hidden="true"></div>
    <div class="sheet__panel" data-side={side} use:contentAction>
      <header class="sheet__header">
        <h2 class="sheet__title" use:titleAction>{title}</h2>
        <button class="sheet__close" type="button" aria-label={closeLabel} use:closeAction>
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
        <p class="sheet__description" use:descriptionAction>{description}</p>
      {/if}
      <div class="sheet__body"><slot /></div>
    </div>
  </div>
{/if}

<style>
  .sheet__trigger {
    font: inherit;
  }

  .sheet__portal {
    position: fixed;
    inset: 0;
    z-index: var(--ds-dialog-z-index, 60);
  }
  .sheet__overlay {
    position: fixed;
    inset: 0;
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }

  .sheet__panel {
    position: fixed;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: var(--ds-dialog-padding, 1.25rem 1.5rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
  .sheet__panel:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #2563eb);
    outline-offset: -2px;
  }

  /* Left / right: full height, fixed width. */
  .sheet__panel[data-side="right"],
  .sheet__panel[data-side="left"] {
    inset-block: 0;
    inline-size: var(--ds-sheet-size, 20rem);
    max-inline-size: 100vw;
  }
  .sheet__panel[data-side="right"] {
    inset-inline-end: 0;
    border-inline-end: 0;
    animation: sheet-in-right var(--ds-sheet-duration, 0.25s) ease;
  }
  .sheet__panel[data-side="left"] {
    inset-inline-start: 0;
    border-inline-start: 0;
    animation: sheet-in-left var(--ds-sheet-duration, 0.25s) ease;
  }

  /* Top / bottom: full width, fixed height. */
  .sheet__panel[data-side="top"],
  .sheet__panel[data-side="bottom"] {
    inset-inline: 0;
    block-size: var(--ds-sheet-size, 16rem);
    max-block-size: 100vh;
  }
  .sheet__panel[data-side="top"] {
    inset-block-start: 0;
    border-block-start: 0;
    animation: sheet-in-top var(--ds-sheet-duration, 0.25s) ease;
  }
  .sheet__panel[data-side="bottom"] {
    inset-block-end: 0;
    border-block-end: 0;
    animation: sheet-in-bottom var(--ds-sheet-duration, 0.25s) ease;
  }

  @keyframes sheet-in-right {
    from {
      transform: translateX(100%);
    }
  }
  @keyframes sheet-in-left {
    from {
      transform: translateX(-100%);
    }
  }
  @keyframes sheet-in-top {
    from {
      transform: translateY(-100%);
    }
  }
  @keyframes sheet-in-bottom {
    from {
      transform: translateY(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sheet__panel {
      animation: none;
    }
  }

  .sheet__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .sheet__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .sheet__close {
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
  .sheet__close:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    color: inherit;
  }
  .sheet__close:focus-visible {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, #2563eb);
    outline-offset: 2px;
  }
  .sheet__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .sheet__body {
    margin-block-start: 1rem;
  }
</style>
