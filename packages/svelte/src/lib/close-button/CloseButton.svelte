<script lang="ts">
  /**
   * CloseButton — a styled "dismiss" button (the × in alerts, dialogs, notices).
   *
   * It is a thin **preset of the Button icon button**: a ghost, icon-only Button
   * with the × glyph and a comfortable, square hit area (WCAG 2.5.8 Target
   * Size). The icon is decorative; the accessible name comes from `label`
   * (default "Close"). Sizing/colors are themeable via the Button icon tokens
   * (`--ds-button-icon-*`) and `--ds-close-hit-area`.
   */
  import Button from "../button/Button.svelte";
  import Icon from "../icon/Icon.svelte";

  export let label = "Close";
  export let disabled = false;
  /** Called when the button is activated (click or Enter/Space). */
  export let onclose: (() => void) | undefined = undefined;
</script>

<div
  class="close-button"
  style:--ds-button-icon-min="var(--ds-close-hit-area, 2.5rem)"
  style:--ds-button-icon-size="var(--ds-close-icon-size, 1rem)"
>
  <Button iconOnly variant="ghost" ariaLabel={label} {disabled} onpress={() => onclose?.()}>
    <Icon>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Icon>
  </Button>
</div>

<style>
  /* Inline-level wrapper so the preset can scope the hit-area token without a
     global override; the Button inside carries all behaviour and styling. */
  .close-button {
    display: inline-flex;
    /* The dismiss button must stay color-neutral: it can sit on any (status-)
       tinted surface, so it uses the surface's own text color — never a status
       or accent color. The inner ghost Button inherits this. */
    color: var(--ds-close-color, var(--ds-color-text, #1c1917));
  }
</style>
