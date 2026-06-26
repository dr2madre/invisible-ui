<script lang="ts">
  /**
   * Accordion — the styled, batteries-included accordion (WAI-ARIA accordion
   * pattern): single or multiple expansion, arrow-key movement between headers.
   * Behaviour and accessibility come from the headless accordion
   * (`@design-system/core`); this layer adds bordered items and a rotating
   * chevron.
   *
   * Each item supplies a header `label` (falling back to `value`) and its panel
   * `content` as text. For rich panel markup, drive the headless
   * `createAccordion` directly. Colors are themeable CSS custom properties
   * (`--ds-accordion-*`).
   */
  import { createAccordion, type AccordionItem, type AccordionType } from "./create-accordion";
  import Icon from "../icon/Icon.svelte";

  /** An item, with an optional header label and its panel text. */
  export type AccordionEntry = AccordionItem & { label?: string; content?: string };

  export let items: AccordionEntry[];
  export let value: string[] = [];
  /** `single` (default): one open at a time. `multiple`: many. */
  export let type: AccordionType = "single";
  /** For `single`: allow collapsing the open item. */
  export let collapsible = true;
  export let disabled = false;
  /** Called whenever the expanded set changes. */
  export let onValueChange: ((value: string[]) => void) | undefined = undefined;

  const { rootAction, itemAction, triggerAction, panelAction } = createAccordion({
    items,
    value,
    type,
    collapsible,
    disabled,
    onValueChange,
  });
</script>

<div class="accordion" use:rootAction>
  {#each items as item (item.value)}
    <div class="accordion__item" use:itemAction={item.value}>
      <h3 class="accordion__heading">
        <button class="accordion__trigger" use:triggerAction={item.value}>
          <span>{item.label ?? item.value}</span>
          <span class="accordion__icon" aria-hidden="true">
            <Icon size="var(--ds-accordion-icon-size, 1.1em)">
              <polyline points="9 6 15 12 9 18" />
            </Icon>
          </span>
        </button>
      </h3>
      <div class="accordion__panel" use:panelAction={item.value}>{item.content ?? ""}</div>
    </div>
  {/each}
</div>

<style>
  .accordion {
    inline-size: var(--ds-accordion-width, 16rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-accordion-radius, var(--ds-radius-control, 0.375rem));
    overflow: hidden;
  }
  .accordion__item + .accordion__item {
    border-block-start: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .accordion__heading {
    margin: 0;
    font-size: 1rem;
  }
  .accordion__trigger {
    inline-size: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--ds-accordion-trigger-padding, 0.6rem 0.8rem);
    border: none;
    background: none;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
    cursor: pointer;
    text-align: start;
  }
  .accordion__icon {
    display: inline-flex;
    flex: none;
    color: var(--ds-color-text-secondary, #64748b);
    transition: rotate 150ms ease;
  }
  .accordion__trigger:global([data-state="open"]) .accordion__icon {
    rotate: 90deg;
  }
  .accordion__trigger:global(:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: -2px;
  }
  .accordion__trigger:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .accordion__panel {
    padding: 0 0.8rem 0.8rem;
  }
</style>
