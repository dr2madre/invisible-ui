<script lang="ts">
  /**
   * ConfirmDialog — a styled modal to verify or accept before proceeding, the
   * accessible equivalent of `window.confirm()` (a platform "simple dialog",
   * per ADR 0005). It reuses the headless dialog (`@design-system/core`) and
   * the shared modal adapter (`createDialog`): native `<dialog>` +
   * `showModal()`, scroll lock.
   * Cancel stops the process, confirm proceeds. Set `urgent` when the choice
   * must interrupt (`role="alertdialog"`); for a message with nothing to cancel
   * use `AlertDialog`, to ask for a value use `PromptDialog`.
   *
   * The `children` snippet is the trigger. `onConfirm` runs when the confirm button is
   * pressed. A `title` is required; `description` is optional. The header is
   * the one the dialog family shares: an optional `icon` snippet (a FeedbackIcon)
   * before the title and an optional close button (`closeButton`). Colors,
   * radius and elevation are themeable via `--ds-dialog-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createDialog } from "../dialog/create-dialog";
  import Button from "../button/Button.svelte";
  import DialogHeader from "../dialog/DialogHeader.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { ButtonVariant } from "../button/create-button";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Initial open state. */
    open?: boolean;
    /** Accessible title naming the confirmation (required). */
    title: string;
    /** Optional supporting message. */
    description?: string;
    /** Label of the confirming button. Defaults to the i18n catalog's "Confirm". */
    confirmLabel?: string;
    /** Label of the cancelling button (also the Escape action). Defaults to "Cancel". */
    cancelLabel?: string;
    /** Variant of the confirm button (`"danger"` for a destructive-ish confirm). */
    confirmVariant?: ButtonVariant;
    /**
     * Interrupting urgency: switches the panel to `role="alertdialog"`, which
     * screen readers announce immediately. Nothing else changes (ADR 0005).
     */
    urgent?: boolean;
    /** Visual variant for the trigger Button. */
    triggerVariant?: ButtonVariant;
    /** Called when the confirm button is pressed (before the dialog closes). */
    onConfirm?: () => void;
    /** Whether pressing the backdrop cancels and closes. Defaults to `true`. */
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
    confirmLabel,
    cancelLabel,
    confirmVariant = "primary",
    urgent = false,
    triggerVariant = "default",
    onConfirm,
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
      role: urgent ? "alertdialog" : "dialog",
      describedBy: Boolean(description),
      closeOnOutsideClick,
      // Focus the safe choice (Cancel) first.
      initialFocus: ".confirm-dialog__actions button",
      // The prop first, then the report (ADR 0011).
      onOpenChange: (next) => {
        mirror.write(next);
        onOpenChange?.(next);
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

  const resolvedConfirmLabel = $derived(confirmLabel ?? $t("dialog.confirm"));
  const resolvedCloseLabel = $derived(closeLabel ?? $t("dialog.close"));
  const resolvedCancelLabel = $derived(cancelLabel ?? $t("dialog.cancel"));

  const cancel = () => setOpen(false);
  const confirm = () => {
    onConfirm?.();
    setOpen(false);
  };
</script>

<Button variant={triggerVariant} action={triggerAction}>
  {#if children}{@render children()}{:else}Open{/if}
</Button>

{#if $isOpen}
  <dialog class="confirm-dialog__panel" use:contentAction>
    <DialogHeader
      {title}
      {closeButton}
      closeLabel={resolvedCloseLabel}
      {titleAction}
      {closeAction}
      {icon}
    />
    {#if description}
      <p class="confirm-dialog__description" use:descriptionAction>{description}</p>
    {/if}
    <footer class="confirm-dialog__actions">
      <Button variant="ghost" onpress={cancel}>{resolvedCancelLabel}</Button>
      <Button variant={confirmVariant} onpress={confirm}>{resolvedConfirmLabel}</Button>
    </footer>
  </dialog>
{/if}

<style>
  .confirm-dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(28 25 21 / 0.5));
  }
  .confirm-dialog__panel {
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
  .confirm-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .confirm-dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .confirm-dialog__actions {
    margin-block-start: 1.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
