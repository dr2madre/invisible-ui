<script lang="ts">
  /**
   * SheetDialog — a Dialog anchored to an edge of the viewport (the panel
   * pattern variously marketed as "sheet", "side panel" or "drawer"). It is a
   * dialog in every sense: it reuses the headless dialog (`@design-system/core`)
   * and the shared modal adapter unchanged — native `<dialog>` + `showModal()`
   * (top layer, inert background), scroll lock, Escape / backdrop /
   * close-button dismissal, and focus restore.
   * Over `Dialog` it adds edge anchoring (`side`), a slide-in animation and an
   * optional drag-to-dismiss gesture (`draggable`, on the bottom and lateral
   * sides): a grab handle the user can drag past a distance or velocity
   * threshold to close; anything less snaps home. The handle is a pointer
   * affordance only — keyboard users have Escape and the close button.
   *
   * Snippets: `trigger` (the trigger button's content), `children` (the
   * body), an optional `footer` (actions), and the header snippets the dialog
   * family shares — `icon` (a leading FeedbackIcon), `headerLead` (before the
   * title, e.g. a back affordance) and `headerActions` (after the title, just
   * before the close button). Pass a `title` (required) and an optional
   * `description`, shown as the subtitle under the title. Colors, radius and elevation
   * are themeable via `--ds-dialog-*`; the panel extent via
   * `--ds-sheet-dialog-size`.
   *
   * A status area between the body and the footer holds messages about the
   * sheet's own task (ADR 0016), with the same contract as `Dialog`:
   * `notify(options)`, `dismissNotice(id)` and `clearNotices()` on the
   * instance; notices are announced once through a polite live region, never
   * take focus, and are cleared when the sheet closes.
   */
  import { untrack, type Snippet } from "svelte";
  import { createSheetDialog, type SheetDialogSide } from "./create-sheet-dialog";
  import Button from "../button/Button.svelte";
  import DialogHeader from "../dialog/DialogHeader.svelte";
  import DialogStatus from "../dialog/DialogStatus.svelte";
  import type { DialogNoticeOptions } from "../dialog/create-dialog";
  import { getI18n } from "../i18n/create-i18n";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Visual variant for the trigger Button. */
    triggerVariant?: "default" | "primary" | "secondary" | "ghost" | "danger";
    /**
     * Whether this component renders its own trigger button. Turn it off when
     * the button belongs somewhere this panel cannot reach, an application
     * header for instance: drive `open` yourself and name `returnFocusTo`, since
     * there is no trigger left for focus to go back to (ADR 0013).
     */
    renderTrigger?: boolean;
    /** CSS selector for the element focus returns to when there is no trigger. */
    returnFocusTo?: string;
    /** Which edge the panel is anchored to. */
    side?: SheetDialogSide;
    /**
     * Show a grab handle and enable the drag-to-dismiss gesture. Available on the
     * bottom and lateral sides (ignored on `side="top"`).
     */
    draggable?: boolean;
    /** Initial open state. */
    open?: boolean;
    /** Accessible title naming the panel (required). */
    title: string;
    /** Optional description, wired via `aria-describedby`. */
    description?: string;
    /** Accessible label for the close button. Defaults to the i18n catalog's "Close". */
    closeLabel?: string;
    /** Show the close button at the trailing end of the header. */
    closeButton?: boolean;
    /**
     * CSS selector (within the panel) for the element to focus on open — e.g.
     * `"input"` to land on a form's first field instead of the close button.
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
    /** Leading ghost button in the header, e.g. back. */
    headerLead?: Snippet;
    /** Actions before the close button. */
    headerActions?: Snippet;
    /** Footer actions. */
    footer?: Snippet;
  }

  let {
    triggerVariant = "default",
    renderTrigger = true,
    returnFocusTo,
    side = "right",
    draggable = false,
    open = $bindable(false),
    title,
    description,
    closeLabel,
    closeButton = true,
    initialFocus,
    onOpenChange,
    children,
    trigger,
    icon,
    headerLead,
    headerActions,
    footer,
  }: Props = $props();

  // Seeded once from the first props; the mirror below follows later ones.
  const sheet = untrack(() =>
    createSheetDialog({
      open,
      side,
      describedBy: description !== undefined,
      initialFocus,
      returnFocusTo,
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
    handleAction,
    dragOffset,
    dragging,
  } = sheet;

  // Controllable mirror through the no-notify sync: opening from the outside
  // is not the user asking for it, so it reports nothing (ADR 0011).
  const mirror = controllable({
    get: () => open,
    set: (next) => (open = next),
    reflect: sheet.syncOpen,
  });

  const resolvedCloseLabel = $derived(closeLabel ?? $t("sheetDialog.close"));
  const hasHandle = $derived(draggable && side !== "top");
  const dragTransform = $derived(
    $dragOffset === 0
      ? undefined
      : side === "bottom"
        ? `translateY(${$dragOffset}px)`
        : side === "right"
          ? `translateX(${$dragOffset}px)`
          : side === "left"
            ? `translateX(${-$dragOffset}px)`
            : undefined,
  );

  /** Show a notice in the status area and return its id (ADR 0016). */
  export function notify(options: DialogNoticeOptions): string {
    return sheet.notify(options);
  }

  /** Remove one notice from the status area. */
  export function dismissNotice(id: string): void {
    sheet.dismissNotice(id);
  }

  /** Remove every notice from the status area. */
  export function clearNotices(): void {
    sheet.clearNotices();
  }
</script>

{#if renderTrigger}
  <Button variant={triggerVariant} action={triggerAction}>
    {#if trigger}{@render trigger()}{:else}{$t("dialog.trigger")}{/if}
  </Button>
{/if}

{#if $isOpen}
  <dialog
    class={["sheet-dialog__panel", $dragging && "sheet-dialog__panel--dragging"]}
    data-side={side}
    style:transform={dragTransform}
    use:contentAction
  >
    {#if hasHandle}
      <div class="sheet-dialog__handle" use:handleAction aria-hidden="true"></div>
    {/if}
    <DialogHeader
      {title}
      subtitle={description}
      {closeButton}
      closeLabel={resolvedCloseLabel}
      {titleAction}
      subtitleAction={descriptionAction}
      {closeAction}
      {icon}
      lead={headerLead}
      actions={headerActions}
    />
    <div class="sheet-dialog__body">{@render children?.()}</div>
    <DialogStatus dialog={sheet} />
    {#if footer}
      <footer class="sheet-dialog__footer">{@render footer()}</footer>
    {/if}
  </dialog>
{/if}

<style>
  .sheet-dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(28 25 21 / 0.5));
  }
  .sheet-dialog__panel[open] {
    position: fixed;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: var(--ds-dialog-padding, 1.25rem 1.5rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
    border: 1px solid var(--ds-color-border, #c7c1b7);
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
    /* Snap-home transition after a released drag; disabled while dragging. */
    transition: transform var(--ds-sheet-dialog-duration, 0.25s) ease;
  }
  .sheet-dialog__panel--dragging {
    transition: none;
    user-select: none;
  }
  .sheet-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: -2px;
  }

  /* Left / right: full height, fixed width. */
  .sheet-dialog__panel[data-side="right"],
  .sheet-dialog__panel[data-side="left"] {
    inset-block: 0;
    block-size: 100%;
    max-block-size: 100vh;
    inline-size: var(--ds-sheet-dialog-size, 20rem);
    max-inline-size: 100vw;
  }
  .sheet-dialog__panel[data-side="right"] {
    inset-inline-end: 0;
    inset-inline-start: auto;
    border-inline-end: 0;
    animation: sheet-dialog-in-right var(--ds-sheet-dialog-duration, 0.25s) ease;
  }
  .sheet-dialog__panel[data-side="left"] {
    inset-inline-start: 0;
    inset-inline-end: auto;
    border-inline-start: 0;
    animation: sheet-dialog-in-left var(--ds-sheet-dialog-duration, 0.25s) ease;
  }

  /* Top / bottom: full width, fixed height. */
  .sheet-dialog__panel[data-side="top"],
  .sheet-dialog__panel[data-side="bottom"] {
    inset-inline: 0;
    inline-size: 100%;
    max-inline-size: 100vw;
    block-size: var(--ds-sheet-dialog-size, 16rem);
    max-block-size: 100vh;
  }
  .sheet-dialog__panel[data-side="top"] {
    inset-block-start: 0;
    inset-block-end: auto;
    border-block-start: 0;
    animation: sheet-dialog-in-top var(--ds-sheet-dialog-duration, 0.25s) ease;
  }
  .sheet-dialog__panel[data-side="bottom"] {
    inset-block-end: 0;
    inset-block-start: auto;
    border-block-end: 0;
    animation: sheet-dialog-in-bottom var(--ds-sheet-dialog-duration, 0.25s) ease;
  }

  @keyframes sheet-dialog-in-right {
    from {
      transform: translateX(100%);
    }
  }
  @keyframes sheet-dialog-in-left {
    from {
      transform: translateX(-100%);
    }
  }
  @keyframes sheet-dialog-in-top {
    from {
      transform: translateY(-100%);
    }
  }
  @keyframes sheet-dialog-in-bottom {
    from {
      transform: translateY(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sheet-dialog__panel {
      animation: none;
    }
  }

  /* Grab handle: a horizontal bar on the bottom sheet, a vertical bar along
     the inner edge of a lateral one. Pointer affordance only (aria-hidden). */
  .sheet-dialog__handle {
    border-radius: 999px;
    background: var(--ds-sheet-dialog-handle, var(--ds-color-border, #c7c1b7));
    cursor: grab;
    touch-action: none;
  }
  .sheet-dialog__handle:active {
    cursor: grabbing;
  }
  .sheet-dialog__panel[data-side="bottom"] .sheet-dialog__handle {
    flex: none;
    align-self: center;
    inline-size: var(--ds-sheet-dialog-handle-width, 2.5rem);
    block-size: 0.375rem;
    margin-block: 0 0.75rem;
  }
  .sheet-dialog__panel[data-side="right"] .sheet-dialog__handle,
  .sheet-dialog__panel[data-side="left"] .sheet-dialog__handle {
    position: absolute;
    inset-block: 0;
    block-size: var(--ds-sheet-dialog-handle-width, 2.5rem);
    inline-size: 0.375rem;
    margin-block: auto;
  }
  .sheet-dialog__panel[data-side="right"] .sheet-dialog__handle {
    inset-inline-start: 0.375rem;
  }
  .sheet-dialog__panel[data-side="left"] .sheet-dialog__handle {
    inset-inline-end: 0.375rem;
  }

  .sheet-dialog__body {
    margin-block-start: 1rem;
    /* Grow so the footer is pushed to the bottom of the panel. */
    flex: 1;
  }
  /* Actions zone pinned to the bottom of the panel, with a separating border. */
  .sheet-dialog__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-block-start: 1rem;
    padding-block-start: 1rem;
    border-block-start: 1px solid var(--ds-color-border, #c7c1b7);
    /* Counteract the panel's padding so the border spans full width. */
    margin-inline: calc(-1 * var(--ds-dialog-padding-x, 1.5rem));
    padding-inline: var(--ds-dialog-padding-x, 1.5rem);
  }
</style>
