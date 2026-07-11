<script lang="ts">
  /**
   * Dialog — a styled modal window (WAI-ARIA dialog pattern). Behaviour and
   * accessibility (open/close, `role="dialog"` + `aria-modal`, labelling via the
   * title, Escape to close) come from the headless dialog
   * (`@design-system/core`); this adapter adds the modal DOM concerns on the
   * native `<dialog>` element (`showModal()`: top layer, inert background,
   * `::backdrop`), plus body scroll lock, backdrop light-dismiss and focus
   * management (focus moves into the panel on open and returns to the trigger
   * on close).
   *
   * Layout: a grid panel with a fixed header and footer and a scrolling body.
   * The header is a grid — optional leading `icon` (a FeedbackIcon) and
   * `headerLead` (a ghost icon button, e.g. back), the title + optional subtitle
   * (`description`) stacked, and the close button trailing, all centered against
   * the title block.
   *
   * Slots: `trigger` (the trigger button's content), the default slot (the
   * body), `icon` (leading feedback icon), `headerLead` (leading ghost button)
   * and `footer` (trailing action buttons). Pass an accessible `title`
   * (required; hide it with `hideTitle`), optional `description` (the subtitle)
   * and `footerClose` for a leading close button in the footer. Colors, radius
   * and elevation are themeable via `--ds-dialog-*`.
   */
  import { createDialog } from "./create-dialog";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Visual variant for the trigger Button. */
  export let triggerVariant: "default" | "primary" | "secondary" | "ghost" | "danger" = "default";

  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the dialog (required). */
  export let title: string;
  /**
   * Visually hide the title while keeping it as the dialog's accessible name
   * (announced by screen readers via `aria-labelledby`). The title text is
   * always required; this only controls whether it is shown.
   */
  export let hideTitle = false;
  /** Optional description, wired via `aria-describedby`. */
  export let description: string | undefined = undefined;
  /** Accessible label for the close button. Defaults to the i18n catalog's "Close". */
  export let closeLabel: string | undefined = undefined;
  /**
   * Show an optional close/cancel button on the footer's leading (left) edge.
   * The trailing (right) edge holds the action buttons from the `footer` slot.
   */
  export let footerClose = false;
  /**
   * CSS selector (within the panel) for the element to focus on open. When
   * omitted, focus lands on the panel itself — never on the close button.
   */
  export let initialFocus: string | undefined = undefined;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
  };

  const dialog = createDialog({
    open,
    describedBy: description !== undefined,
    initialFocus,
    onOpenChange: handleOpenChange,
  });
  const {
    open: isOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
    closeAction,
  } = dialog;

  $: dialog.setOpen(open);

  $: resolvedCloseLabel = closeLabel ?? $t("dialog.close");
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot name="trigger">Open</slot>
</Button>

{#if $isOpen}
  <dialog class="dialog__panel" use:contentAction>
    <header class="dialog__header">
      {#if $$slots.icon}
        <!-- Optional leading feedback icon, centered against title+subtitle. -->
        <div class="dialog__header-icon"><slot name="icon" /></div>
      {/if}
      {#if $$slots.headerLead}
        <!-- Optional ghost icon-only button (e.g. a back affordance). -->
        <div class="dialog__header-lead"><slot name="headerLead" /></div>
      {/if}
      <h2 class="dialog__title" class:dialog__title--hidden={hideTitle} use:titleAction>{title}</h2>
      {#if description !== undefined}
        <p class="dialog__subtitle" use:descriptionAction>{description}</p>
      {/if}
      <button class="dialog__close" type="button" aria-label={resolvedCloseLabel} use:closeAction>
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
    <div class="dialog__body"><slot /></div>
    {#if $$slots.footer || footerClose}
      <footer class="dialog__footer">
        {#if footerClose}
          <Button variant="ghost" action={closeAction}>{resolvedCloseLabel}</Button>
        {/if}
        {#if $$slots.footer}
          <div class="dialog__footer-actions"><slot name="footer" /></div>
        {/if}
      </footer>
    {/if}
  </dialog>
{/if}

<style>
  .dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }
  .dialog__panel {
    /* The UA centers a :modal dialog via margin auto; CSS resets zero it. */
    margin: auto;
    box-sizing: border-box;
    /* Rows: header sizes to content and stays put, the body takes the rest and
       is the only scrolling region, the footer auto-places into an implicit row
       (so an absent footer leaves no trailing gap). The internal gap spaces the
       rows; the padding is the outer inset. */
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--ds-dialog-gap, 1rem);
    inline-size: 100%;
    max-inline-size: var(--ds-dialog-max-width, 30rem);
    max-block-size: calc(100vh - 2rem);
    overflow: hidden;
    padding: var(--ds-dialog-padding, 1.25rem 1.5rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #0f172a);
    line-height: var(--ds-line-height, 1.4);
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

  /* Columns: icon | back | titles (1fr) | close. Rows: title / subtitle. The
     side items span both rows so they center against the title+subtitle block.
     No column-gap (empty optional columns must not leave phantom space); the
     present items carry their own margin. */
  .dialog__header {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    grid-template-rows: auto auto;
    align-items: center;
    padding-block-end: 1rem;
  }
  .dialog__header-icon {
    grid-column: 1;
    grid-row: 1 / -1;
    display: inline-flex;
    align-items: center;
    margin-inline-end: 0.75rem;
  }
  .dialog__header-lead {
    grid-column: 2;
    grid-row: 1 / -1;
    display: inline-flex;
    align-items: center;
    margin-inline-end: 0.75rem;
  }
  .dialog__title {
    grid-column: 3;
    grid-row: 1;
    min-inline-size: 0;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: var(--ds-line-height-tight, 1.2);
  }
  /* Kept in the accessibility tree (labels the dialog), removed from view. */
  .dialog__title--hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .dialog__close {
    grid-column: 4;
    grid-row: 1 / -1;
    /* Space from the titles; trailing edge is the last column. */
    margin-inline-start: 0.75rem;
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

  .dialog__subtitle {
    grid-column: 3;
    grid-row: 2;
    min-inline-size: 0;
    margin: 0;
    font-size: 0.875rem;
    line-height: var(--ds-line-height-tight, 1.2);
    color: var(--ds-color-text-secondary, #64748b);
  }
  /* The body is the only scrolling region (the 1fr grid row); header and footer
     stay fixed. min-block-size:0 lets it shrink and scroll. */
  .dialog__body {
    min-block-size: 0;
    overflow-y: auto;
  }
  /* Footer: optional close on the leading edge, the action buttons trailing. */
  .dialog__footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-block-start: 1rem;
  }
  .dialog__footer-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    /* Actions sit on the trailing edge; the close (if any) stays leading. */
    margin-inline-start: auto;
  }
</style>
