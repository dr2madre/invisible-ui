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
   * The header is the one the whole dialog family shares — optional leading
   * `icon` (a FeedbackIcon) and `headerLead` (a ghost icon button, e.g. back),
   * the title + optional subtitle (`description`) stacked, optional
   * `headerActions`, and the close button trailing (`closeButton`), all
   * centered against the title block.
   *
   * Snippets: `trigger` (the trigger button's content), `children` (the
   * body), `icon` (leading feedback icon), `headerMeta` (context above the
   * title), `headerLead` (leading ghost button), `headerActions` (actions
   * before the close button), `footerLead` (leading footer
   * actions) and `footer` (trailing action buttons). Pass an accessible `title`
   * (required; hide it with `hideTitle`), optional `description` (the subtitle)
   * and `footerClose` for a close button in the footer. Colors, radius
   * and elevation are themeable via `--ds-dialog-*`.
   *
   * Multi-step workflows are a composition, not a separate component: put the
   * step context in `headerMeta`, Back in `footerLead`, and keep the step state
   * in the application.
   *
   * A status area between the body and the footer holds messages about the
   * dialog's own task (ADR 0016). `notify(options)`, exported from the
   * instance (`bind:this`), adds a notice styled as an Inline Notification and
   * returns its id; it is announced once through a polite live region and
   * never moves focus. `dismissNotice(id)` and `clearNotices()` remove notices.
   * Notices belong to one opening: `notify()` while closed returns an empty
   * string, and closing clears them. Closing returns focus to the element that
   * had it when the dialog opened, so a dialog opened from inside another
   * hands focus back there; otherwise to the trigger.
   */
  import { untrack, type Snippet } from "svelte";
  import { createDialog, type DialogNoticeOptions } from "./create-dialog";
  import Button from "../button/Button.svelte";
  import DialogHeader from "./DialogHeader.svelte";
  import DialogStatus from "./DialogStatus.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Visual variant for the trigger Button. */
    triggerVariant?: "default" | "primary" | "secondary" | "ghost" | "danger";
    /** Initial open state. */
    open?: boolean;
    /** Accessible title naming the dialog (required). */
    title: string;
    /**
     * Visually hide the title while keeping it as the dialog's accessible name
     * (announced by screen readers via `aria-labelledby`). The title text is
     * always required; this only controls whether it is shown.
     */
    hideTitle?: boolean;
    /** Optional description, wired via `aria-describedby`. */
    description?: string;
    /** Accessible label for the close button. Defaults to the i18n catalog's "Close". */
    closeLabel?: string;
    /** Show the close button at the trailing end of the header. */
    closeButton?: boolean;
    /**
     * Show an optional close/cancel button on the footer's leading (left) edge.
     * The trailing (right) edge holds the action buttons from the `footer` snippet.
     */
    footerClose?: boolean;
    /**
     * Body layout. `plain` (the default) leaves the body untouched. `stack`
     * spaces the direct children by `--ds-dialog-body-gap`, which saves a
     * workflow from inventing its own spacing between sections.
     */
    bodyLayout?: "plain" | "stack";
    /**
     * CSS selector (within the panel) for the element to focus on open. When
     * omitted, focus lands on the panel itself — never on the close button.
     */
    initialFocus?: string;
    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** The body. */
    children?: Snippet;
    /** The trigger button's content. Defaults to the i18n catalog's label. */
    trigger?: Snippet;
    /** Leading feedback icon in the header. */
    icon?: Snippet;
    /** Context above the title, e.g. "Step 1 of 2". */
    headerMeta?: Snippet;
    /** Leading ghost button in the header, e.g. back. */
    headerLead?: Snippet;
    /** Actions before the close button. */
    headerActions?: Snippet;
    /** Leading footer actions. */
    footerLead?: Snippet;
    /** Trailing footer action buttons. */
    footer?: Snippet;
  }

  let {
    triggerVariant = "default",
    open = $bindable(false),
    title,
    hideTitle = false,
    description,
    closeLabel,
    closeButton = true,
    footerClose = false,
    bodyLayout = "plain",
    initialFocus,
    onOpenChange,
    children,
    trigger,
    icon,
    headerMeta,
    headerLead,
    headerActions,
    footerLead,
    footer,
  }: Props = $props();

  // Seeded once from the first props; the mirror below follows later ones.
  const dialog = untrack(() =>
    createDialog({
      open,
      describedBy: description !== undefined,
      initialFocus,
      // The prop first, then the report (ADR 0011).
      onOpenChange: (next) => {
        mirror.write(next);
        onOpenChange?.(next);
      },
    }),
  );
  const {
    open: isOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
    closeAction,
  } = dialog;

  // Controllable mirror through the no-notify sync: opening from the outside
  // is not the user asking for it, so it reports nothing (ADR 0011).
  const mirror = controllable({
    get: () => open,
    set: (next) => (open = next),
    reflect: dialog.syncOpen,
  });

  const resolvedCloseLabel = $derived(closeLabel ?? $t("dialog.close"));

  /** Show a notice in the status area and return its id (ADR 0016). */
  export function notify(options: DialogNoticeOptions): string {
    return dialog.notify(options);
  }

  /** Remove one notice from the status area. */
  export function dismissNotice(id: string): void {
    dialog.dismissNotice(id);
  }

  /** Remove every notice from the status area. */
  export function clearNotices(): void {
    dialog.clearNotices();
  }
</script>

<Button variant={triggerVariant} action={triggerAction}>
  {#if trigger}{@render trigger()}{:else}{$t("dialog.trigger")}{/if}
</Button>

{#if $isOpen}
  <dialog class="dialog__panel" use:contentAction>
    <DialogHeader
      {title}
      {hideTitle}
      subtitle={description}
      {closeButton}
      closeLabel={resolvedCloseLabel}
      {titleAction}
      subtitleAction={descriptionAction}
      {closeAction}
      {icon}
      lead={headerLead}
      meta={headerMeta}
      actions={headerActions}
    />
    <div class="dialog__body" data-layout={bodyLayout}>{@render children?.()}</div>
    <DialogStatus {dialog} />
    {#if footer || footerLead || footerClose}
      <!-- One action bar: leading actions at the logical start, the trailing
           group at the logical end. Source order matches focus order. -->
      <footer class="dialog__footer">
        {#if footerLead || footerClose}
          <div class="dialog__footer-lead">
            {@render footerLead?.()}
            {#if footerClose}
              <Button variant="ghost" action={closeAction}>{resolvedCloseLabel}</Button>
            {/if}
          </div>
        {/if}
        {#if footer}
          <div class="dialog__footer-actions">{@render footer()}</div>
        {/if}
      </footer>
    {/if}
  </dialog>
{/if}

<style>
  .dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(28 25 21 / 0.5));
  }
  .dialog__panel {
    /* The UA centers a :modal dialog via margin auto; CSS resets zero it. */
    margin: auto;
    box-sizing: border-box;
    /* Rows: header sizes to content and stays put, the body takes the rest and
       is the only scrolling region, the footer auto-places into an implicit row
       (so an absent footer leaves no trailing gap). The internal gap spaces the
       rows; the padding is the outer inset. */
    grid-template-rows: auto 1fr;
    gap: var(--ds-dialog-gap, 1rem);
    inline-size: 100%;
    max-inline-size: var(--ds-dialog-max-width, 30rem);
    max-block-size: calc(100vh - 2rem);
    overflow: hidden;
    padding: var(--ds-dialog-padding, 1.25rem 1.5rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
    line-height: var(--ds-line-height, 1.4);
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-dialog-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
  .dialog__panel[open] {
    /* Keep the platform's closed-dialog display until showModal() sets open. */
    display: grid;
  }
  .dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }

  .dialog__panel > :global(.dialog-header) {
    padding-block-end: 1rem;
  }
  /* The body is the only scrolling region (the 1fr grid row); header and footer
     stay fixed. min-block-size:0 lets it shrink and scroll. */
  .dialog__body {
    min-block-size: 0;
    overflow-y: auto;
  }
  /* The grid spaces its rows with its own gap. */
  .dialog__panel > :global(.dialog-status) {
    margin-block-start: 0;
  }
  /* Opt-in spacing between the body's direct sections, so a workflow does not
     invent its own. */
  .dialog__body[data-layout="stack"] {
    display: grid;
    align-content: start;
    gap: var(--ds-dialog-body-gap, 1rem);
  }
  /* One action bar: the leading group at the logical start, the trailing group
     at the logical end. It wraps on narrow widths, and wrapping keeps the
     source order, so the visual order never contradicts focus order. */
  .dialog__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding-block-start: 1rem;
  }
  .dialog__footer-lead {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .dialog__footer-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    /* Actions sit on the trailing edge; the leading group stays at the start. */
    margin-inline-start: auto;
  }
</style>
