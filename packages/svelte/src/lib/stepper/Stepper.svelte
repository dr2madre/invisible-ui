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

  export let steps: StepDescriptor[];
  export let current = 0;
  export let linear = true;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let disabled = false;
  /** Accessible name for the progress nav (announced by screen readers). */
  export let label = "Progress";
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
</script>

<nav class="stepper" use:rootAction aria-label={label}>
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

  /* Connector line that precedes every step but the first. */
  .stepper__connector {
    flex: 1;
    block-size: var(--ds-step-connector-thickness, 2px);
    margin-inline: 0.25rem;
    background: var(--ds-step-connector-color, var(--ds-color-border, #cbd5e1));
    border-radius: 999px;
  }
  .stepper__step[data-status="complete"] .stepper__connector,
  .stepper__step[data-status="current"] .stepper__connector {
    background: var(--ds-step-connector-active, var(--ds-color-primary, #2563eb));
  }
  .stepper__list:global([data-orientation="vertical"]) .stepper__connector {
    inline-size: var(--ds-step-connector-thickness, 2px);
    block-size: auto;
    min-block-size: 1.25rem;
    margin-block: 0.25rem;
    margin-inline: 0;
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
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
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
  .stepper__step[data-status="complete"] .stepper__indicator {
    background: var(--ds-step-complete-bg, var(--ds-color-primary, #2563eb));
    border-color: var(--ds-step-complete-bg, var(--ds-color-primary, #2563eb));
    color: var(--ds-color-on-primary, #fff);
  }
  .stepper__step[data-status="current"] .stepper__indicator {
    border-color: var(--ds-step-current-border, var(--ds-color-primary, #2563eb));
    color: var(--ds-step-current-text, var(--ds-color-primary, #2563eb));
  }

  .stepper__text {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }
  .stepper__label {
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stepper__step[data-status="upcoming"] .stepper__label {
    color: var(--ds-color-text-secondary, #64748b);
    font-weight: 500;
  }
  .stepper__description {
    font-size: 0.8125rem;
    color: var(--ds-color-text-secondary, #64748b);
    line-height: 1.3;
  }
</style>
