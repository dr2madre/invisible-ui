<script lang="ts">
  /**
   * Collapsible — a styled, single-item disclosure (WAI-ARIA disclosure
   * pattern): one trigger button toggling one content region. Behaviour and
   * accessibility (`aria-expanded`/`aria-controls` wiring, disabled handling)
   * come from the headless collapsible (`@design-system/core`); this layer adds
   * a trigger row with a rotating chevron and a content area.
   *
   * Snippets: `trigger` (the trigger's content, falling back to the `label`
   * prop) and `children` (the collapsible content). Colors, radius and spacing
   * are themeable via `--ds-collapsible-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import { createCollapsible } from "./create-collapsible";
  import Icon from "../icon/Icon.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    /** Initial open state. */
    open?: boolean;
    /** Whether the collapsible is disabled. */
    disabled?: boolean;
    /** Trigger text, used when the `trigger` snippet is not provided. */
    label?: string;
    /** Called whenever the open state changes. */
    onOpenChange?: (open: boolean) => void;
    /** The trigger's content. Defaults to `label`, then the i18n catalog's label. */
    trigger?: Snippet;
    /** The collapsible content. */
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    disabled = false,
    label,
    onOpenChange,
    trigger,
    children,
  }: Props = $props();

  // Seeded once from the first props; the mirror and the effect below follow
  // later ones.
  const { rootAction, triggerAction, contentAction, syncOpen, syncDisabled } = untrack(() =>
    createCollapsible({
      open,
      disabled,
      // A live callback reference (ADR 0011).
      onOpenChange: (next) => onOpenChange?.(next),
    }),
  );

  // Controllable mirror, compared against the last prop value (ADR 0011): a
  // sync never reports a change.
  controllable({ get: () => open, reflect: syncOpen });
  $effect.pre(() => {
    syncDisabled(disabled);
  });
</script>

<div class="collapsible" use:rootAction>
  <button class="collapsible__trigger" use:triggerAction>
    <span class="collapsible__label"
      >{#if trigger}{@render trigger()}{:else}{label ?? $t("collapsible.toggle")}{/if}</span
    >
    <span class="collapsible__icon" aria-hidden="true">
      <Icon size="var(--ds-collapsible-icon-size, 1.1em)">
        <polyline points="6 9 12 15 18 9" />
      </Icon>
    </span>
  </button>
  <div class="collapsible__content" use:contentAction>
    {@render children?.()}
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
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-collapsible-radius, var(--ds-radius-control, 0.5rem));
    background: var(--ds-color-background, #fff);
    font: inherit;
    color: var(--ds-color-text, #282420);
    cursor: pointer;
    text-align: start;
  }
  .collapsible__icon {
    display: inline-flex;
    flex: none;
    color: var(--ds-color-text-secondary, #524c44);
    transition: rotate 150ms ease;
  }
  .collapsible__trigger:global([data-state="open"]) .collapsible__icon {
    rotate: 180deg;
  }
  .collapsible__trigger:global(:focus-visible) {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .collapsible__trigger:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .collapsible__content {
    padding: var(--ds-collapsible-content-padding, 0.625rem 0.75rem);
  }

  /* Reduced motion: state changes apply at once. */
  @media (prefers-reduced-motion: reduce) {
    .collapsible__icon {
      transition: none;
    }
  }
</style>
