<script lang="ts">
  /**
   * Dialog — a styled modal window (WAI-ARIA dialog pattern). Behaviour and
   * accessibility (open/close, `role="dialog"` + `aria-modal`, labelling via the
   * title, Escape to close) come from the headless dialog
   * (`@design-system/core`); this adapter adds the modal DOM concerns: a portal
   * to `<body>`, a focus trap, body scroll lock, a backdrop that closes on press,
   * and focus management (focus moves into the panel on open and returns to the
   * trigger on close).
   *
   * Slots: `trigger` (the trigger button's content) and the default slot (the
   * body). Pass an accessible `title` (required) and optional `description`.
   * Colors, radius and elevation are themeable via `--ds-dialog-*`.
   */
  import { createDialog } from "./create-dialog";
  import { portal } from "../internal/portal";
  import Button from "../button/Button.svelte";

  /** Visual variant for the trigger Button. */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";

  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the dialog (required). */
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

  const dialog = createDialog({
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
  } = dialog;
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot name="trigger">Open</slot>
</Button>

{#if $isOpen}
  <div class="dialog__portal" use:portal>
    <div class="dialog__overlay" aria-hidden="true"></div>
    <div class="dialog__panel" use:contentAction>
      <header class="dialog__header">
        <h2 class="dialog__title" use:titleAction>{title}</h2>
        <button class="dialog__close" type="button" aria-label={closeLabel} use:closeAction>
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
        <p class="dialog__description" use:descriptionAction>{description}</p>
      {/if}
      <div class="dialog__body"><slot /></div>
    </div>
  </div>
{/if}

<style>
  .dialog__portal {
    position: fixed;
    inset: 0;
    z-index: var(--ds-dialog-z-index, 60);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .dialog__overlay {
    position: fixed;
    inset: 0;
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }

  .dialog__panel {
    position: relative;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ds-dialog-max-width, 30rem);
    max-block-size: calc(100vh - 2rem);
    overflow-y: auto;
    padding: var(--ds-dialog-padding, 1.25rem 1.5rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-dialog-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
  .dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }

  .dialog__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .dialog__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .dialog__close {
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
  .dialog__close:hover {
    background: var(--ds-state-hover, rgb(0 0 0 / 0.06));
    color: inherit;
  }
  .dialog__close:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }

  .dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .dialog__body {
    margin-block-start: 1rem;
  }
</style>
