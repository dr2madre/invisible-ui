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
   * described). The default slot is the trigger. `onDismiss` runs whenever the
   * alert is acknowledged — button, Escape or backdrop. For a choice that can
   * stop a process use `ConfirmDialog`; to ask for a value use `PromptDialog`.
   * Colors, radius and elevation are themeable via `--ds-dialog-*`.
   */
  import { createDialog } from "../dialog/create-dialog";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { ButtonVariant } from "../button/create-button";

  const { t } = getI18n();

  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the alert (required). */
  export let title: string;
  /** The message to acknowledge (required). */
  export let description: string;
  /**
   * Label of the single acknowledging button. Defaults to the i18n catalog's
   * "OK"; prefer naming the outcome in context ("Done", "Close", "I understood").
   */
  export let dismissLabel: string | undefined = undefined;
  /** Visual variant for the trigger Button. */
  export let triggerVariant: ButtonVariant = "default";
  /** Called when the alert is acknowledged (button, Escape or backdrop). */
  export let onDismiss: (() => void) | undefined = undefined;
  /**
   * Whether pressing the backdrop acknowledges and closes. Defaults to `true`;
   * set `false` to require an explicit button press (e.g. "I understood").
   */
  export let closeOnOutsideClick = true;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
    // Every way of closing an acknowledgement is the acknowledgement.
    if (!next) onDismiss?.();
  };

  const dialog = createDialog({
    open,
    role: "alertdialog",
    describedBy: true,
    closeOnOutsideClick,
    // Focus the only action: taking note.
    initialFocus: ".alert-dialog__actions button",
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

  $: resolvedDismissLabel = dismissLabel ?? $t("dialog.dismiss");

  const dismiss = () => setOpen(false);
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot>Open</slot>
</Button>

{#if $isOpen}
  <dialog class="alert-dialog__panel" use:contentAction>
    <h2 class="alert-dialog__title" use:titleAction>{title}</h2>
    <p class="alert-dialog__description" use:descriptionAction>{description}</p>
    <footer class="alert-dialog__actions">
      <Button variant="primary" onpress={dismiss}>{resolvedDismissLabel}</Button>
    </footer>
  </dialog>
{/if}

<style>
  .alert-dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }
  .alert-dialog__panel {
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
  .alert-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .alert-dialog__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .alert-dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .alert-dialog__actions {
    margin-block-start: 1.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
