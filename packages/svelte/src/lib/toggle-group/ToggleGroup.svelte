<script lang="ts">
  /**
   * ToggleGroup — a purely **visual** wrapper that arranges a set of independent
   * `<ToggleButton>` children and gives them a shared look. It carries no
   * selection state of its own: each ToggleButton inside is a standalone
   * on/off control (a native checkbox) that owns its own `pressed` state,
   * label and form field. Insert the toggles via the default slot.
   *
   * Styles:
   * - `separate` (default) — each toggle keeps its own default style, spaced by
   *   a gap.
   * - `segmented` — items are joined into one control: their individual borders
   *   are dropped and the group draws a single outer border with thin dividers.
   *
   * Accessibility: the group is a `role="group"`. The optional `label` becomes
   * the group's `aria-label` — a *container* name (e.g. "Formatting") that gives
   * screen-reader context ("group, Formatting"). It is optional and different in
   * nature from a form label: it names the container, it does not label the
   * items (each toggle carries its own name). If the toggles are unrelated, omit
   * it entirely. Radius, spacing and colors are themeable via
   * `--ds-toggle-group-*`.
   */

  /** Visual style. `separate` keeps each toggle's own style; `segmented` joins them. */
  export let variant: "separate" | "segmented" = "separate";
  /** Layout axis. Purely visual — the group has no keyboard navigation of its own. */
  export let orientation: "horizontal" | "vertical" = "horizontal";
  /**
   * Let the toggles wrap onto multiple lines when they overflow the available
   * width (e.g. a row of filter chips in a narrow panel). Only meaningful on a
   * horizontal `separate` group; ignored when `segmented`, which is one control.
   */
  export let wrap = false;
  /**
   * Optional container name for screen readers (the group's `aria-label`). Names
   * the container, not the items; omit it when the toggles are unrelated.
   */
  export let label: string | undefined = undefined;
</script>

<div
  class="toggle-group toggle-group--{variant}"
  class:toggle-group--wrap={wrap && variant === "separate"}
  role="group"
  aria-label={label}
  data-orientation={orientation}
>
  <slot />
</div>

<style>
  .toggle-group {
    display: inline-flex;
    align-items: flex-start;
  }
  .toggle-group[data-orientation="vertical"] {
    flex-direction: column;
  }

  /* separate: each toggle keeps its own style, spaced by a gap. */
  .toggle-group--separate {
    gap: var(--ds-toggle-group-gap, 0.375rem);
  }
  /* Wrap a horizontal chip row onto multiple lines instead of overflowing. */
  .toggle-group--wrap {
    display: flex;
    flex-wrap: wrap;
  }

  /* segmented: join the toggles into one control — drop their individual
     borders/radius and draw a single outer border with thin dividers. Targets
     the child ToggleButton's scoped parts via :global. */
  .toggle-group--segmented {
    gap: 0;
    border: 1px solid var(--ds-toggle-border, var(--ds-color-border, #cbd5e1));
    border-radius: var(--ds-toggle-group-radius, var(--ds-radius-control, 0.5rem));
    overflow: hidden;
  }
  .toggle-group--segmented :global(.toggle__surface) {
    border: 0;
    border-radius: 0;
  }
  /* Divider between adjacent toggles (along the layout axis). */
  .toggle-group--segmented[data-orientation="horizontal"]
    :global(.toggle:not(:first-child) .toggle__surface) {
    border-inline-start: 1px solid var(--ds-toggle-border, var(--ds-color-border, #cbd5e1));
  }
  .toggle-group--segmented[data-orientation="vertical"]
    :global(.toggle:not(:first-child) .toggle__surface) {
    border-block-start: 1px solid var(--ds-toggle-border, var(--ds-color-border, #cbd5e1));
  }
</style>
