<script lang="ts">
  /**
   * Count — a small notification count (the "numerino"): the number bubble that
   * sits on a bell, an avatar, or a tab to signal unread/pending items. What some
   * systems call a "badge".
   *
   * Behaviour:
   * - Clamps to `max`, rendering "N+" past the ceiling (e.g. 99 → "99+").
   * - Hides itself when the count is 0 unless `showZero` is set.
   * - `dot` mode renders a small dot with no number (presence indicator).
   *
   * Accessibility:
   * - The visible number is terse, so a fuller `label` (e.g. "3 unread messages")
   *   is exposed to assistive tech via `aria-label`; the digits are hidden from
   *   the accessibility tree to avoid a double announcement.
   * - In `dot` mode there is no text, so a `label` is the only accessible name; if
   *   omitted the dot is purely decorative (`aria-hidden`).
   *
   * Colors are themeable CSS custom properties (`--ds-count-*`), defaulting to the
   * danger status tokens (the conventional "unread" red).
   */
  type CountStatus = "danger" | "neutral" | "info" | "success" | "warning";

  /** The number to display. */
  export let count = 0;
  /** Ceiling before showing "N+". Defaults to 99. */
  export let max = 99;
  /** Render a bare dot (presence indicator) instead of a number. */
  export let dot = false;
  /** Show the bubble even when `count` is 0. Defaults to `false`. */
  export let showZero = false;
  /** Status color. Defaults to `danger` (the conventional unread red). */
  export let status: CountStatus = "danger";
  /** Fuller accessible label (e.g. "3 unread messages"). */
  export let label: string | undefined = undefined;

  $: display = count > max ? `${max}+` : `${count}`;
  $: visible = dot || showZero || count > 0;
</script>

{#if visible}
  {#if dot}
    <span
      class="count count--dot"
      data-status={status}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    ></span>
  {:else}
    <span class="count" data-status={status} role="status" aria-label={label ?? display}>
      <span aria-hidden="true">{display}</span>
    </span>
  {/if}
{/if}

<style>
  .count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-inline-size: var(--ds-count-size, 1.25rem);
    block-size: var(--ds-count-size, 1.25rem);
    padding-inline: var(--ds-count-padding-inline, 0.3rem);
    font: inherit;
    font-size: var(--ds-count-font-size, 0.6875rem);
    font-weight: 600;
    line-height: 1;
    color: var(--_fg, var(--ds-color-on-danger, #fff));
    background: var(--_bg, var(--ds-color-danger, #dc2626));
    border-radius: 999px;
  }

  .count--dot {
    min-inline-size: 0;
    inline-size: var(--ds-count-dot-size, 0.55rem);
    block-size: var(--ds-count-dot-size, 0.55rem);
    padding: 0;
  }

  /* data-status is dynamic → :global on the value to survive Svelte pruning. */
  .count:global([data-status="danger"]) {
    --_bg: var(--ds-color-danger, #dc2626);
    --_fg: var(--ds-color-on-danger, #fff);
  }
  .count:global([data-status="neutral"]) {
    --_bg: var(--ds-color-neutral, #475569);
    --_fg: var(--ds-color-on-neutral, #fff);
  }
  .count:global([data-status="info"]) {
    --_bg: var(--ds-color-info, #2563eb);
    --_fg: var(--ds-color-on-info, #fff);
  }
  .count:global([data-status="success"]) {
    --_bg: var(--ds-color-success, #16a34a);
    --_fg: var(--ds-color-on-success, #fff);
  }
  .count:global([data-status="warning"]) {
    --_bg: var(--ds-color-warning, #d97706);
    --_fg: var(--ds-color-on-warning, #fff);
  }
</style>
