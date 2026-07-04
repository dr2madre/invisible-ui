<script lang="ts">
  /**
   * DotGrid — a loading **area**: a surface that signals a process in progress,
   * built from two composable parts.
   *
   * 1. A backdrop: the tiling **halftone dot field** (`field`, on by default) —
   *    a faint dot pattern with a brighter band sweeping across continuously. It
   *    is a CSS `background` (no per-dot DOM), so it tiles to any size cheaply.
   *    Turn `field` off to use DotGrid purely as a positioned loading area.
   * 2. A label/indicator **zone**, placed via `labelPosition`
   *    (`center` default, or `top`/`bottom`/`left`/`right`). It shows any of:
   *    a live `status` message, a `value` percentage, a `detail` line (bytes,
   *    counts), and whatever you drop in the default slot — e.g. a
   *    `<Loading variant="spinner" />` (or dots, bar, …) to add an explicit
   *    indicator on top of (or instead of) the dot field.
   *
   * Accessibility: a polite `role="status"` with an accessible name (`label`,
   * i18n default). When `status` is set it drives the announcement (the region
   * is `aria-atomic`); the percentage and detail are visible but `aria-hidden`
   * so a fast-ticking value isn't re-announced. `decorative` hides it from
   * assistive tech (the surrounding region announces the state). The sweep
   * respects `prefers-reduced-motion`. Themeable via `--ds-dot-grid-*`.
   */
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Accessible name. Defaults to the i18n catalog's "Loading…". */
  export let label: string | undefined = undefined;
  /** Hide from assistive tech (the surrounding region announces the state). */
  export let decorative = false;
  /** Show the tiling halftone dot field as the backdrop. */
  export let field = true;
  /** Where the label/indicator zone sits over the area. */
  export let labelPosition: "center" | "top" | "bottom" | "left" | "right" = "center";
  /** Live status message — announced on every change. */
  export let status: string | undefined = undefined;
  /** Percentage (0–100), shown as "N%". */
  export let value: number | null = null;
  /** Extra detail line, e.g. "48 MB of 128 MB". */
  export let detail: string | undefined = undefined;

  $: resolvedLabel = label ?? $t("loading.label");
  $: clamped = value == null ? null : Math.min(100, Math.max(0, value));
  $: hasStatus = status != null;
  $: hasZone = hasStatus || clamped != null || detail != null || $$slots.default;
</script>

<div
  class="dot-grid"
  class:dot-grid--field={field}
  data-position={labelPosition}
  role={decorative ? undefined : "status"}
  aria-label={decorative || hasStatus ? undefined : resolvedLabel}
  aria-atomic={hasStatus && !decorative ? "true" : undefined}
  aria-hidden={decorative ? "true" : undefined}
>
  {#if hasZone}
    <div class="dot-grid__zone">
      <slot />
      {#if hasStatus}<span class="dot-grid__status">{status}</span>{/if}
      {#if clamped != null}<span class="dot-grid__value" aria-hidden="true"
          >{Math.round(clamped)}%</span
        >{/if}
      {#if detail != null}<span class="dot-grid__detail" aria-hidden="true">{detail}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .dot-grid {
    position: relative;
    display: grid;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: var(--ds-dot-grid-min-height, 6rem);
    overflow: hidden;
  }
  /* Label/indicator zone placement. */
  .dot-grid[data-position="center"] {
    place-items: center;
  }
  .dot-grid[data-position="top"] {
    place-items: start center;
  }
  .dot-grid[data-position="bottom"] {
    place-items: end center;
  }
  .dot-grid[data-position="left"] {
    place-items: center start;
  }
  .dot-grid[data-position="right"] {
    place-items: center end;
  }

  /* Resting field: faint dots tiling the whole surface. */
  .dot-grid--field {
    background-image: radial-gradient(
      circle at center,
      color-mix(in srgb, currentColor 22%, transparent) 0 var(--ds-dot-grid-dot, 1.6px),
      transparent calc(var(--ds-dot-grid-dot, 1.6px) + 0.7px)
    );
    background-size: var(--ds-dot-grid-gap, 1.15rem) var(--ds-dot-grid-gap, 1.15rem);
    background-position: center;
  }
  /* The sweep: the same dots at full strength, revealed under a moving band mask
     that repeats every `--ds-dot-grid-band`, so animating by one period loops
     seamlessly — a lit "area" that renders and travels across continuously. */
  .dot-grid--field::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: radial-gradient(
      circle at center,
      currentColor 0 var(--ds-dot-grid-dot, 1.6px),
      transparent calc(var(--ds-dot-grid-dot, 1.6px) + 0.7px)
    );
    background-size: var(--ds-dot-grid-gap, 1.15rem) var(--ds-dot-grid-gap, 1.15rem);
    background-position: center;
    -webkit-mask-image: repeating-linear-gradient(
      90deg,
      #000 0,
      transparent 22px,
      transparent calc(var(--ds-dot-grid-band, 150px) - 22px),
      #000 var(--ds-dot-grid-band, 150px)
    );
    mask-image: repeating-linear-gradient(
      90deg,
      #000 0,
      transparent 22px,
      transparent calc(var(--ds-dot-grid-band, 150px) - 22px),
      #000 var(--ds-dot-grid-band, 150px)
    );
    animation: dot-grid-sweep var(--ds-dot-grid-duration, 2.6s) linear infinite;
  }
  @keyframes dot-grid-sweep {
    to {
      -webkit-mask-position: var(--ds-dot-grid-band, 150px) 0;
      mask-position: var(--ds-dot-grid-band, 150px) 0;
    }
  }

  /* The zone sits above the sweep and stays legible over the dots. */
  .dot-grid__zone {
    position: relative;
    z-index: 1;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    margin: var(--ds-dot-grid-zone-margin, 0.75rem);
    padding: var(--ds-dot-grid-zone-padding, 0.5rem 0.75rem);
    border-radius: var(--ds-radius-control, 0.5rem);
    background: color-mix(in srgb, var(--ds-color-background, #fff) 78%, transparent);
    color: var(--ds-color-text, #0f172a);
    text-align: center;
    font-size: var(--ds-loading-label-size, 0.8125rem);
    line-height: 1.3;
  }
  .dot-grid__value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .dot-grid__detail {
    color: var(--ds-color-text-secondary, #64748b);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot-grid--field::after {
      animation: none;
      -webkit-mask-image: none;
      mask-image: none;
      opacity: 0.35;
    }
  }
</style>
