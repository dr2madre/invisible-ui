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
   * The default slot is the trigger. `onConfirm` runs when the confirm button is
   * pressed. A `title` is required; `description` is optional. Colors, radius and
   * elevation are themeable via `--ds-dialog-*`.
   */
  import { createDialog } from "../dialog/create-dialog";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { ButtonVariant } from "../button/create-button";

  const { t } = getI18n();

  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the confirmation (required). */
  export let title: string;
  /** Optional supporting message. */
  export let description: string | undefined = undefined;
  /** Label of the confirming button. Defaults to the i18n catalog's "Confirm". */
  export let confirmLabel: string | undefined = undefined;
  /** Label of the cancelling button (also the Escape action). Defaults to "Cancel". */
  export let cancelLabel: string | undefined = undefined;
  /** Variant of the confirm button (`"danger"` for a destructive-ish confirm). */
  export let confirmVariant: ButtonVariant = "primary";
  /**
   * Interrupting urgency: switches the panel to `role="alertdialog"`, which
   * screen readers announce immediately. Nothing else changes (ADR 0005).
   */
  export let urgent = false;
  /** Visual variant for the trigger Button. */
  export let triggerVariant: ButtonVariant = "default";
  /** Called when the confirm button is pressed (before the dialog closes). */
  export let onConfirm: (() => void) | undefined = undefined;
  /** Whether pressing the backdrop cancels and closes. Defaults to `true`. */
  export let closeOnOutsideClick = true;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
  };

  const dialog = createDialog({
    open,
    role: urgent ? "alertdialog" : "dialog",
    describedBy: Boolean(description),
    closeOnOutsideClick,
    // Focus the safe choice (Cancel) first.
    initialFocus: ".confirm-dialog__actions button",
    onOpenChange: handleOpenChange,
  });
  const {
    open: isOpen,
    setOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
  } = dialog;

  $: dialog.setOpen(open);

  $: resolvedConfirmLabel = confirmLabel ?? $t("dialog.confirm");
  $: resolvedCancelLabel = cancelLabel ?? $t("dialog.cancel");

  const cancel = () => setOpen(false);
  const confirm = () => {
    onConfirm?.();
    setOpen(false);
  };
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot>Open</slot>
</Button>

{#if $isOpen}
  <dialog class="confirm-dialog__panel" use:contentAction>
    <h2 class="confirm-dialog__title" use:titleAction>{title}</h2>
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
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }
  .confirm-dialog__panel {
    /* The UA centers a :modal dialog via margin auto; CSS resets zero it. */
    margin: auto;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--ds-dialog-max-width, 28rem);
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
  .confirm-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .confirm-dialog__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .confirm-dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .confirm-dialog__actions {
    margin-block-start: 1.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
