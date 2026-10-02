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
  import { untrack } from "svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { createRatingGroup } from "./create-rating-group";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import Icon from "../icon/Icon.svelte";
  import { stableId } from "../internal/stable-id";

  interface Props {
    /** Accessible name for the rating group. */
    label: string;
    /** Number of stars. */
    max?: number;
    /** Selected rating (1..max), or null. */
    value?: number | null;
    disabled?: boolean;
    /** Form field name — the rating is submitted under it. */
    name?: string;
    /** Called whenever the rating changes. */
    onValueChange?: (value: number) => void;
  }

  let {
    label,
    max = 5,
    value = $bindable(null),
    disabled = false,
    name,
    onValueChange,
  }: Props = $props();

  // Seeded once from the first props; the effect and the mirror below follow
  // later ones. A live callback reference, so a swapped callback is honoured
  // (ADR 0011).
  const rating = untrack(() =>
    createRatingGroup({
      max,
      value,
      disabled,
      name,
      onValueChange: (next) => onValueChange?.(next),
    }),
  );
  const { items, setValue, syncValue, syncMax, name: groupName, value: selected } = rating;

  // A star count changed after mount redraws the stars, reporting nothing.
  $effect.pre(() => {
    syncMax(max);
  });

  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: syncValue,
    isGiveBack: (next) => next === $selected,
  });

  // While hovering, stars up to `hovered` show a grey preview; otherwise the
  // selected stars show the selection color.
  let hovered = $state(0);

  const labelId = stableId("ds-rating");
  const { t } = getI18n();
  const starLabel = (n: number, translate: typeof $t) => translate("rating.stars", { count: n });
</script>

<div class="rating-field">
  <span class="rating__label" id={labelId}>{label}</span>
  <!-- The native radios own focus and the roving tabindex, so the group
       itself takes none. -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class={["rating", disabled && "rating--disabled"]}
    role="radiogroup"
    use:formReset={mirror.restore}
    aria-labelledby={labelId}
    aria-orientation="horizontal"
    onpointerleave={() => (hovered = 0)}
  >
    {#each $items as item (item.value)}
      <label
        class={[
          "rating__star",
          !hovered && item.position <= ($selected ?? 0) && "rating__star--filled",
          hovered > 0 && item.position <= hovered && "rating__star--preview",
        ]}
        onpointerenter={() => {
          if (!disabled) hovered = item.position;
        }}
      >
        <input
          class="rating__input"
          type="radio"
          name={groupName}
          value={item.value}
          checked={$selected === item.position}
          defaultChecked={mirror.defaultValue === item.position}
          {disabled}
          aria-label={starLabel(item.position, $t)}
          onchange={() => setValue(item.position)}
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
    color: var(--ds-color-text, #282420);
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
    /* Anchors the hidden input: unanchored, it would sit at its static
       position outside any clipping and widen the page. */
    position: relative;
    display: inline-flex;
    /* Darker outline so empty stars stay visible. */
    color: var(--ds-rating-empty-color, var(--ds-neutral-400, #757067));
    cursor: pointer;
  }
  .rating--disabled .rating__star {
    cursor: not-allowed;
  }
  .rating__star :global(svg) {
    fill: none;
  }
  /* Hover preview: a neutral grey fill (not the selection color) showing the
     stars about to be set. */
  .rating__star--preview {
    color: var(--ds-rating-preview-color, var(--ds-neutral-300, #a8a297));
  }
  .rating__star--preview :global(svg) {
    fill: currentColor;
  }
  .rating__star--filled {
    color: var(--ds-rating-color, var(--ds-color-secondary, #7a52cc));
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
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
    border-radius: 2px;
  }
  /* Forced colors: the focus sits on the hidden input, so the outline the
     theme forces there lands on something nobody can see. Draw it on the
     visible part instead. */
  @media (forced-colors: active) {
    .rating__star:has(.rating__input:focus-visible) {
      outline: var(--ds-focus-ring-width, 2px) solid Highlight;
      outline-offset: 2px;
    }
  }
</style>
