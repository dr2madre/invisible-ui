<script lang="ts">
  /**
   * AlertDialog — a styled modal acknowledgement, the accessible equivalent of
   * `window.alert()` (the platform's first "simple dialog", per ADR 0005). It
   * interrupts to communicate an important message (`role="alertdialog"`, so
   * screen readers announce it immediately), but there is nothing to cancel:
   * one button takes note and closes. Escape and a backdrop press are
   * equivalent to the button.
   *
   * A `title` and `description` are both required (an alert must be named and
   * described). The `children` snippet is the trigger. `onDismiss` runs whenever the
   * alert is acknowledged — button, Escape or backdrop. For a choice that can
   * stop a process use `ConfirmDialog`; to ask for a value use `PromptDialog`.
   * The header is the one the dialog family shares: an optional `icon` snippet
   * (a FeedbackIcon) before the title and an optional close button
   * (`closeButton`). Colors, radius and elevation are themeable via `--ds-dialog-*`.
   *
   * The status area before the actions holds messages about the dialog's own
   * task (ADR 0016): `notify(options)`, `dismissNotice(id)` and
   * `clearNotices()` on the instance, with the same contract as `Dialog`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createDialog, type DialogNoticeOptions } from "../dialog/create-dialog";
  import Button from "../button/Button.svelte";
  import DialogHeader from "../dialog/DialogHeader.svelte";
  import DialogStatus from "../dialog/DialogStatus.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { ButtonVariant } from "../button/create-button";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Initial open state. */
    open?: boolean;
    /** Accessible title naming the alert (required). */
    title: string;
    /** The message to acknowledge (required). */
    description: string;
    /**
     * Label of the single acknowledging button. Defaults to the i18n catalog's
     * "OK"; prefer naming the outcome in context ("Done", "Close", "I understood").
     */
    dismissLabel?: string;
    /** Visual variant for the trigger Button. */
    triggerVariant?: ButtonVariant;
    /** Called when the alert is acknowledged (button, Escape or backdrop). */
    onDismiss?: () => void;
    /**
     * Whether pressing the backdrop acknowledges and closes. Defaults to `true`;
     * set `false` to require an explicit button press (e.g. "I understood").
     */
    closeOnOutsideClick?: boolean;
    /** Show a close button at the trailing end of the header; it closes like Escape. */
    closeButton?: boolean;
    /** Accessible label for the close button. Defaults to the i18n catalog's "Close". */
    closeLabel?: string;
    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** The trigger button's content. Defaults to "Open". */
    children?: Snippet;
    /** Leading feedback icon in the header. */
    icon?: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    description,
    dismissLabel,
    triggerVariant = "default",
    onDismiss,
    closeOnOutsideClick = true,
    closeButton = false,
    closeLabel,
    onOpenChange,
    children,
    icon,
  }: Props = $props();

  // Seeded once from the first props; the mirror below follows later ones.
  const dialog = untrack(() =>
    createDialog({
      open,
      role: "alertdialog",
      describedBy: true,
      closeOnOutsideClick,
      // Focus the only action: taking note.
      initialFocus: ".alert-dialog__actions button",
      // The prop first, then the report (ADR 0011).
      onOpenChange: (next) => {
        mirror.write(next);
        onOpenChange?.(next);
        // Every way of closing an acknowledgement is the acknowledgement.
        if (!next) onDismiss?.();
      },
    }),
  );
  const {
    open: isOpen,
    setOpen,
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
  const resolvedDismissLabel = $derived(dismissLabel ?? $t("dialog.dismiss"));

  const dismiss = () => setOpen(false);

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
  {#if children}{@render children()}{:else}Open{/if}
</Button>

{#if $isOpen}
  <dialog class="alert-dialog__panel" use:contentAction>
    <DialogHeader
      {title}
      {closeButton}
      closeLabel={resolvedCloseLabel}
      {titleAction}
      {closeAction}
      {icon}
    />
    <p class="alert-dialog__description" use:descriptionAction>{description}</p>
    <DialogStatus {dialog} />
    <footer class="alert-dialog__actions">
      <Button variant="primary" onpress={dismiss}>{resolvedDismissLabel}</Button>
    </footer>
  </dialog>
{/if}

<style>
  .alert-dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(28 25 21 / 0.5));
  }
  .alert-dialog__panel {
    /* The UA centers a :modal dialog via margin auto; CSS resets zero it. */
    margin: auto;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ds-dialog-max-width, 28rem);
    padding: var(--ds-dialog-padding, 1.25rem 1.5rem);
    background: var(--ds-color-background, #fff);
    color: var(--ds-color-text, #282420);
    border: 1px solid var(--ds-color-border, #c7c1b7);
    border-radius: var(--ds-dialog-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-elevation-overlay,
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1)
    );
  }
  .alert-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .alert-dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .alert-dialog__actions {
    margin-block-start: 1.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
