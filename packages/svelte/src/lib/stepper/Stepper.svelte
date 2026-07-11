<script module lang="ts">
  /** A step's display content. */
  export interface StepDescriptor {
    /** Short title (required). */
    label: string;
    /** Optional secondary line. */
    description?: string;
  }
</script>

<script lang="ts">
  /**
   * Stepper — the styled, batteries-included progress stepper: an ordered
   * sequence of steps showing what's complete, current, and upcoming. Behaviour
   * (status, linear gating, navigation) comes from the headless stepper in
   * `@design-system/core`; the accessible markup is a labelled `<nav>` wrapping
   * an `<ol>`, with the current step marked `aria-current="step"`.
   *
   * Pass `steps` (their labels). In linear mode (default) upcoming steps are not
   * clickable; set `linear={false}` to allow jumping to any step. Drive it as a
   * controlled component via `current` + `onStepChange`. Completed steps show a
   * check; the current/upcoming steps show their number. Themed (`--ds-step-*`).
   */
  import { createStepper, type StepperContext } from "./create-stepper";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let steps: StepDescriptor[];
  export let current = 0;
  export let linear = true;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let disabled = false;
  /** Accessible name for the progress nav (announced by screen readers). Defaults to the i18n catalog's "Progress". */
  export let label: string | undefined = undefined;
  /** Called whenever the current step changes. */
  export let onStepChange: ((current: number) => void) | undefined = undefined;

  const context: StepperContext = {
    count: steps.length,
    current,
    linear,
    orientation,
    disabled,
    onStepChange,
  };

  const stepper = createStepper(context);
  const { rootAction, listAction, stepAction, current: currentStore } = stepper;

  const statusOf = (index: number) =>
    index < $currentStore ? "complete" : index === $currentStore ? "current" : "upcoming";

  $: resolvedLabel = label ?? $t("stepper.label");
</script>

<nav class="stepper" use:rootAction aria-label={resolvedLabel}>
  <ol class="stepper__list" use:listAction>
    {#each steps as step, index (index)}
      {@const status = statusOf(index)}
      <li class="stepper__step" data-status={status}>
        {#if index > 0}
          <span class="stepper__connector" aria-hidden="true"></span>
        {/if}
        <button class="stepper__trigger" use:stepAction={index}>
          <span class="stepper__indicator" aria-hidden="true">
            {#if status === "complete"}
              <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
                <path
                  d="M3.5 8.5l3 3 6-6.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {:else}
              {index + 1}
            {/if}
          </span>
          <span class="stepper__text">
            <span class="stepper__label">{step.label}</span>
            {#if step.description}
              <span class="stepper__description">{step.description}</span>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .stepper {
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .stepper__list {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    gap: var(--ds-step-gap, 0.25rem);
  }
  .stepper__list:global([data-orientation="vertical"]) {
    flex-direction: column;
  }

  .stepper__step {
    display: flex;
    flex: 1;
    align-items: center;
    min-inline-size: 0;
  }
  .stepper__list:global([data-orientation="vertical"]) .stepper__step {
    flex: none;
    flex-direction: column;
    align-items: flex-start;
  }

  /* Short dotted divider that precedes every step but the first: a row of soft,
     round dots (rounded caps) in a light grey — denser and quieter than a solid
     bar. The dots are drawn with a repeating radial-gradient. */
  .stepper__connector {
    flex: none;
    inline-size: var(--ds-step-connector-length, 1.5rem);
    block-size: var(--ds-step-connector-thickness, 3px);
    margin-inline: 0.25rem;
    background-image: radial-gradient(
      circle,
      var(--ds-step-connector-color, var(--ds-color-neutral-300, #e7e5e4)) 0 42%,
      transparent 48%
    );
    background-size: var(--ds-step-connector-dot-gap, 5px) 100%;
    background-repeat: repeat-x;
    background-position: center;
  }
  .stepper__step[data-status="complete"] .stepper__connector,
  .stepper__step[data-status="current"] .stepper__connector {
    background-image: radial-gradient(
      circle,
      var(--ds-step-connector-active, var(--ds-color-secondary, #7b52cc)) 0 42%,
      transparent 48%
    );
  }
  .stepper__list:global([data-orientation="vertical"]) .stepper__connector {
    inline-size: var(--ds-step-connector-thickness, 3px);
    block-size: auto;
    min-block-size: 1.25rem;
    margin-block: 0.25rem;
    margin-inline: 0;
    background-size: 100% var(--ds-step-connector-dot-gap, 5px);
    background-repeat: repeat-y;
  }

  .stepper__trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-step-label-gap, 0.5rem);
    padding: var(--ds-step-padding, 0.25rem 0.4rem);
    font: inherit;
    color: inherit;
    text-align: start;
    background: none;
    border: 0;
    border-radius: var(--ds-radius-control, 0.375rem);
    cursor: pointer;
  }
  .stepper__trigger:disabled {
    cursor: default;
  }
  .stepper__trigger:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }

  .stepper__indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    inline-size: var(--ds-step-indicator-size, 1.75rem);
    block-size: var(--ds-step-indicator-size, 1.75rem);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1;
    border-radius: 50%;
    border: 2px solid var(--ds-step-indicator-border, var(--ds-color-border, #cbd5e1));
    color: var(--ds-step-indicator-text, var(--ds-color-text-secondary, #64748b));
    background: var(--ds-step-indicator-bg, var(--ds-color-surface, #fff));
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }
  /* Completed: light gray filled circle with a dark check. */
  .stepper__step[data-status="complete"] .stepper__indicator {
    background: var(--ds-step-complete-bg, var(--ds-color-neutral-200, #e7e5e4));
    border-color: var(--ds-step-complete-border, var(--ds-color-border, #d6d3d1));
    color: var(--ds-step-complete-text, var(--ds-color-text, #1c1917));
  }
  /* Current: filled with the selection color. */
  /* Current step: the shared selected look — faint selection fill, selection
     border + number (coherent with checkbox/radio/etc.). */
  .stepper__step[data-status="current"] .stepper__indicator {
    background: var(
      --ds-step-current-bg,
      color-mix(in srgb, var(--ds-color-selected, #7b52cc) 10%, transparent)
    );
    border-color: color-mix(in srgb, var(--ds-color-selected, #7b52cc) 35%, transparent);
    color: var(--ds-step-current-text, var(--ds-color-selected, #7b52cc));
  }
  /* Upcoming: no fill, dashed near-black ring. */
  .stepper__step[data-status="upcoming"] .stepper__indicator {
    background: transparent;
    border-style: dashed;
    border-color: var(--ds-step-upcoming-border, var(--ds-color-neutral-800, #292524));
    color: var(--ds-step-upcoming-text, var(--ds-color-neutral-800, #292524));
  }

  .stepper__text {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }
  .stepper__label {
    font-weight: 600;
    line-height: var(--ds-line-height-tight, 1.2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stepper__description {
    font-size: 0.8125rem;
    color: var(--ds-color-text-secondary, #64748b);
    line-height: var(--ds-line-height, 1.4);
  }
</style>
