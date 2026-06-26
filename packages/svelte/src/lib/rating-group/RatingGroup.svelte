<script context="module" lang="ts">
  let _uid = 0;
</script>

<script lang="ts">
  /**
   * RatingGroup — a star rating built on **native** `<input type="radio">`
   * stars sharing a `name`. The browser provides single selection, roving
   * tabindex, arrow-key navigation, focus and form participation; this layer
   * renders the stars and adds a pointer-hover preview.
   *
   * The group needs an accessible name via `label`; each star is a radio
   * labelled "N star(s)". Themeable via `--ds-rating-*`.
   */
  import { createRatingGroup } from "./create-rating-group";
  import Icon from "../icon/Icon.svelte";

  /** Accessible name for the rating group. */
  export let label: string;
  /** Number of stars. */
  export let max = 5;
  /** Selected rating (1..max), or null. */
  export let value: number | null = null;
  export let disabled = false;
  /** Form field name — the rating is submitted under it. */
  export let name: string | undefined = undefined;
  /** Called whenever the rating changes. */
  export let onValueChange: ((value: number) => void) | undefined = undefined;

  const rating = createRatingGroup({ max, value, disabled, name, onValueChange });
  const { items, setValue, name: groupName, value: selected } = rating;

  // Stars fill up to the hovered position (pointer preview), else the selection.
  let hovered = 0;
  $: active = hovered || ($selected ?? 0);

  const labelId = `ds-rating-${++_uid}`;
  const starLabel = (n: number) => `${n} ${n === 1 ? "star" : "stars"}`;
</script>

<div class="rating-field">
  <span class="rating__label" id={labelId}>{label}</span>
  <div
    class="rating"
    class:rating--disabled={disabled}
    role="radiogroup"
    aria-labelledby={labelId}
    aria-orientation="horizontal"
    on:pointerleave={() => (hovered = 0)}
  >
    {#each items as item (item.value)}
      <label
        class="rating__star"
        class:rating__star--filled={item.position <= active}
        on:pointerenter={() => {
          if (!disabled) hovered = item.position;
        }}
      >
        <input
          class="rating__input"
          type="radio"
          name={groupName}
          value={item.value}
          checked={$selected === item.position}
          {disabled}
          aria-label={starLabel(item.position)}
          on:change={() => setValue(item.position)}
        />
        <Icon size="var(--ds-rating-size, 1.5rem)">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </Icon>
      </label>
    {/each}
  </div>
</div>

<style>
  .rating-field {
    display: grid;
    gap: var(--ds-rating-label-gap, 0.5rem);
    font: inherit;
    color: var(--ds-color-text, #0f172a);
  }
  .rating__label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .rating {
    display: inline-flex;
    gap: var(--ds-rating-gap, 0.125rem);
  }
  .rating--disabled {
    opacity: 0.5;
  }

  .rating__star {
    display: inline-flex;
    color: var(--ds-rating-empty-color, var(--ds-color-border, #cbd5e1));
    cursor: pointer;
  }
  .rating--disabled .rating__star {
    cursor: not-allowed;
  }
  .rating__star :global(svg) {
    fill: none;
  }
  .rating__star--filled {
    color: var(--ds-rating-color, #f59e0b);
  }
  .rating__star--filled :global(svg) {
    fill: currentColor;
  }

  /* The native radio is the accessible, focusable control; visually hidden, with
     the star's focus ring painted from its :focus-visible state. */
  .rating__input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .rating__star:has(.rating__input:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: 2px;
    border-radius: 2px;
  }
</style>
