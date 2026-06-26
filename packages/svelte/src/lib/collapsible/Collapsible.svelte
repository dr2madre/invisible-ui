<script lang="ts">
  /**
   * Collapsible — a styled, single-item disclosure (WAI-ARIA disclosure
   * pattern): one trigger button toggling one content region. Behaviour and
   * accessibility (`aria-expanded`/`aria-controls` wiring, disabled handling)
   * come from the headless collapsible (`@design-system/core`); this layer adds
   * a trigger row with a rotating chevron and a content area.
   *
   * Slots: `trigger` (the trigger's content, falling back to the `label` prop)
   * and the default slot (the collapsible content). Colors, radius and spacing
   * are themeable via `--ds-collapsible-*`.
   */
  import { createCollapsible } from "./create-collapsible";
  import Icon from "../icon/Icon.svelte";

  /** Initial open state. */
  export let open = false;
  /** Whether the collapsible is disabled. */
  export let disabled = false;
  /** Trigger text, used when the `trigger` slot is not provided. */
  export let label: string | undefined = undefined;
  /** Called whenever the open state changes. */
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  const { rootAction, triggerAction, contentAction } = createCollapsible({
    open,
    disabled,
    onOpenChange,
  });
</script>

<div class="collapsible" use:rootAction>
  <button class="collapsible__trigger" use:triggerAction>
    <span class="collapsible__label"><slot name="trigger">{label ?? "Toggle"}</slot></span>
    <span class="collapsible__icon" aria-hidden="true">
      <Icon size="var(--ds-collapsible-icon-size, 1.1em)">
        <polyline points="6 9 12 15 18 9" />
      </Icon>
    </span>
  </button>
  <div class="collapsible__content" use:contentAction>
    <slot />
  </div>
</div>

<style>
  .collapsible {
    inline-size: var(--ds-collapsible-width, 18rem);
  }
  .collapsible__trigger {
    inline-size: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: var(--ds-collapsible-trigger-padding, 0.5rem 0.75rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-collapsible-radius, var(--ds-radius-control, 0.375rem));
    background: var(--ds-color-background, #fff);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
    cursor: pointer;
    text-align: start;
  }
  .collapsible__icon {
    display: inline-flex;
    flex: none;
    color: var(--ds-color-text-secondary, #64748b);
    transition: rotate 150ms ease;
  }
  .collapsible__trigger:global([data-state="open"]) .collapsible__icon {
    rotate: 180deg;
  }
  .collapsible__trigger:global(:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: 2px;
  }
  .collapsible__trigger:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .collapsible__content {
    padding: var(--ds-collapsible-content-padding, 0.625rem 0.75rem);
  }
</style>
