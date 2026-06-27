<script lang="ts">
  /**
   * AlertDialog — a styled modal that interrupts the user to confirm a
   * consequential action (WAI-ARIA alertdialog pattern). It reuses the headless
   * dialog (`@design-system/core`) with `role="alertdialog"` and the shared modal
   * adapter (`createDialog`): portal, focus trap, scroll lock. Unlike Dialog it
   * is **not** dismissed by a backdrop press and has no close (✕) button — the
   * user must choose Cancel or the action; Escape acts as Cancel.
   *
   * A `title` and `description` are both required (an alert must be named and
   * described). The default slot is the trigger. `onAction` runs when the action
   * button is pressed. Colors, radius and elevation are themeable via
   * `--ds-dialog-*`.
   */
  import { createDialog } from "../dialog/create-dialog";
  import { portal } from "../internal/portal";
  import Button from "../button/Button.svelte";
  import type { ButtonVariant } from "../button/create-button";

  /** Initial open state. */
  export let open = false;
  /** Accessible title naming the alert (required). */
  export let title: string;
  /** Description of the consequence (required). */
  export let description: string;
  /** Label of the confirming action button. */
  export let actionLabel = "Confirm";
  /** Label of the cancelling button (also the Escape action). */
  export let cancelLabel = "Cancel";
  /** Variant of the action button (use `"danger"` for destructive actions). */
  export let actionVariant: ButtonVariant = "primary";
  /** Visual variant for the trigger Button. */
  export let triggerVariant: ButtonVariant = "default";
  /** Called when the action button is pressed (before the dialog closes). */
  export let onAction: (() => void) | undefined = undefined;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const dialog = createDialog({
    open,
    role: "alertdialog",
    describedBy: true,
    closeOnOutsideClick: false,
    onOpenChange,
  });
  const {
    open: isOpen,
    setOpen,
    triggerAction,
    contentAction,
    titleAction,
    descriptionAction,
  } = dialog;

  const cancel = () => setOpen(false);
  const confirm = () => {
    onAction?.();
    setOpen(false);
  };
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot>Open</slot>
</Button>

{#if $isOpen}
  <div class="alert-dialog__portal" use:portal>
    <div class="alert-dialog__overlay" aria-hidden="true"></div>
    <div class="alert-dialog__panel" use:contentAction>
      <h2 class="alert-dialog__title" use:titleAction>{title}</h2>
      <p class="alert-dialog__description" use:descriptionAction>{description}</p>
      <footer class="alert-dialog__actions">
        <Button variant="ghost" onpress={cancel}>{cancelLabel}</Button>
        <Button variant={actionVariant} onpress={confirm}>{actionLabel}</Button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .alert-dialog__portal {
    position: fixed;
    inset: 0;
    z-index: var(--ds-dialog-z-index, 60);
    display: grid;
    place-items: center;
    padding: 1rem;
  }
  .alert-dialog__overlay {
    position: fixed;
    inset: 0;
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }
  .alert-dialog__panel {
    position: relative;
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
