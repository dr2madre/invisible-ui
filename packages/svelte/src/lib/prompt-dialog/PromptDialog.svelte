<script lang="ts">
  /**
   * PromptDialog — a styled modal that asks the user for a single value, the
   * accessible equivalent of `window.prompt()` (a platform "simple dialog",
   * per ADR 0005): everything ConfirmDialog has, plus an input. It reuses the
   * headless dialog (`@design-system/core`) and the shared modal adapter
   * (`createDialog`): native `<dialog>` + `showModal()`, scroll lock. The text input is
   * focused on open. The value is optional by default — `required` makes it
   * mandatory, `confirmValue` turns it into a type-to-confirm gate; `urgent`
   * switches to `role="alertdialog"` when the ask must interrupt.
   *
   * The default slot is the trigger. `onConfirm(value)` runs with the entered
   * text when confirmed; Enter in the field also confirms. A `title` is
   * required; `label` names the input. Colors, radius and elevation are themeable
   * via `--ds-dialog-*`.
   */
  import { createDialog } from "../dialog/create-dialog";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import type { ButtonVariant } from "../button/create-button";

  const { t } = getI18n();

  /** Initial open state. */
  export let open = false;
  /** Accessible title (required). */
  export let title: string;
  /** Optional supporting message shown under the title. */
  export let description: string | undefined = undefined;
  /** Visible label for the input. */
  export let label: string;
  /** Initial / current value. */
  export let value = "";
  export let placeholder = "";
  /** Require a non-empty value: the confirm button stays disabled while blank. */
  export let required = false;
  /**
   * Type-to-confirm: when set, the confirm button stays disabled until the input
   * matches this exact value — e.g. typing a file name to confirm its deletion.
   */
  export let confirmValue: string | undefined = undefined;
  export let confirmLabel: string | undefined = undefined;
  export let cancelLabel: string | undefined = undefined;
  /** Variant of the confirm button (`"danger"` for a destructive confirm). */
  export let confirmVariant: ButtonVariant = "primary";
  /**
   * Interrupting urgency: switches the panel to `role="alertdialog"`, which
   * screen readers announce immediately. Nothing else changes (ADR 0005).
   */
  export let urgent = false;
  export let triggerVariant: ButtonVariant = "default";
  /** Called with the entered value when confirmed (before the dialog closes). */
  export let onConfirm: ((value: string) => void) | undefined = undefined;
  /** Whether pressing the backdrop cancels and closes. Defaults to `true`. */
  export let closeOnOutsideClick = true;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  let current = value;

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
  };

  const dialog = createDialog({
    open,
    role: urgent ? "alertdialog" : "dialog",
    describedBy: Boolean(description),
    closeOnOutsideClick,
    initialFocus: ".prompt-dialog__input",
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
  // Reset to the initial value each time it (re)opens.
  $: if ($isOpen) current = value;
  $: resolvedConfirmLabel = confirmLabel ?? $t("dialog.confirm");
  $: resolvedCancelLabel = cancelLabel ?? $t("dialog.cancel");
  $: canConfirm =
    confirmValue != null ? current === confirmValue : !required || current.trim().length > 0;

  const cancel = () => {
    current = value;
    setOpen(false);
  };
  const confirm = () => {
    if (!canConfirm) return;
    onConfirm?.(current);
    setOpen(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirm();
    }
  };
</script>

<Button variant={triggerVariant} action={triggerAction}>
  <slot>Open</slot>
</Button>

{#if $isOpen}
  <dialog class="prompt-dialog__panel" use:contentAction>
    <h2 class="prompt-dialog__title" use:titleAction>{title}</h2>
    {#if description}
      <p class="prompt-dialog__description" use:descriptionAction>{description}</p>
    {/if}
    <label class="prompt-dialog__field">
      <span class="prompt-dialog__label">{label}</span>
      <input
        class="prompt-dialog__input"
        type="text"
        autocomplete="off"
        {placeholder}
        bind:value={current}
        on:keydown={onKeyDown}
      />
    </label>
    <footer class="prompt-dialog__actions">
      <Button variant="ghost" onpress={cancel}>{resolvedCancelLabel}</Button>
      <Button variant={confirmVariant} disabled={!canConfirm} onpress={confirm}
        >{resolvedConfirmLabel}</Button
      >
    </footer>
  </dialog>
{/if}

<style>
  .prompt-dialog__panel::backdrop {
    background: var(--ds-dialog-overlay, rgb(15 23 42 / 0.5));
  }
  .prompt-dialog__panel {
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
  .prompt-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .prompt-dialog__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .prompt-dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .prompt-dialog__field {
    display: grid;
    gap: 0.35rem;
    margin-block-start: 1rem;
  }
  .prompt-dialog__label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .prompt-dialog__input {
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--ds-control-padding-y, 0.5rem) 0.75rem;
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-control, 0.5rem);
    font: inherit;
    background: var(--ds-color-background, #fff);
    color: inherit;
  }
  .prompt-dialog__input:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #7b52cc);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .prompt-dialog__actions {
    margin-block-start: 1.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
