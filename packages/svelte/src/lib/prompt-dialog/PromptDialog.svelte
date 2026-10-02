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
   * The `children` snippet is the trigger. `onConfirm(value)` runs with the entered
   * text when confirmed; Enter in the field also confirms. A `title` is
   * required; `label` names the input. The header is the one the dialog family
   * shares: an optional `icon` snippet (a FeedbackIcon) before the title and an
   * optional close button (`closeButton`). Colors, radius and elevation are
   * themeable via `--ds-dialog-*`.
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
    /** Accessible title (required). */
    title: string;
    /** Optional supporting message shown under the title. */
    description?: string;
    /** Visible label for the input. */
    label: string;
    /** Initial / current value. */
    value?: string;
    placeholder?: string;
    /** Require a non-empty value: the confirm button stays disabled while blank. */
    required?: boolean;
    /**
     * Type-to-confirm: when set, the confirm button stays disabled until the input
     * matches this exact value — e.g. typing a file name to confirm its deletion.
     */
    confirmValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Variant of the confirm button (`"danger"` for a destructive confirm). */
    confirmVariant?: ButtonVariant;
    /**
     * Interrupting urgency: switches the panel to `role="alertdialog"`, which
     * screen readers announce immediately. Nothing else changes (ADR 0005).
     */
    urgent?: boolean;
    triggerVariant?: ButtonVariant;
    /** Called with the entered value when confirmed (before the dialog closes). */
    onConfirm?: (value: string) => void;
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
    label,
    value = "",
    placeholder = "",
    required = false,
    confirmValue,
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

  // Seeded once; the effect below resets it on every open.
  let current = $state(untrack(() => value));

  // Seeded once from the first props; the mirror below follows later ones.
  const dialog = untrack(() =>
    createDialog({
      open,
      role: urgent ? "alertdialog" : "dialog",
      describedBy: Boolean(description),
      closeOnOutsideClick,
      initialFocus: ".prompt-dialog__input",
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
  // Reset to the initial value each time it (re)opens.
  $effect.pre(() => {
    if ($isOpen) current = value;
  });
  const resolvedConfirmLabel = $derived(confirmLabel ?? $t("dialog.confirm"));
  const resolvedCloseLabel = $derived(closeLabel ?? $t("dialog.close"));
  const resolvedCancelLabel = $derived(cancelLabel ?? $t("dialog.cancel"));
  const canConfirm = $derived(
    confirmValue != null ? current === confirmValue : !required || current.trim().length > 0,
  );

  const cancel = () => setOpen(false);
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
  <dialog class="prompt-dialog__panel" use:contentAction>
    <DialogHeader
      {title}
      {closeButton}
      closeLabel={resolvedCloseLabel}
      {titleAction}
      {closeAction}
      {icon}
    />
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
        onkeydown={onKeyDown}
      />
    </label>
    <DialogStatus {dialog} />
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
    background: var(--ds-dialog-overlay, rgb(28 25 21 / 0.5));
  }
  .prompt-dialog__panel {
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
  .prompt-dialog__panel:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .prompt-dialog__description {
    margin: 0.5rem 0 0;
    color: var(--ds-color-text-secondary, #524c44);
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
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
    font: inherit;
    background: var(--ds-color-background, #fff);
    color: inherit;
  }
  .prompt-dialog__input:focus-visible {
    outline: none;
    border-color: var(--ds-color-focus-ring, #8e6cd4);
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .prompt-dialog__actions {
    margin-block-start: 1.5rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
</style>
