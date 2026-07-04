<script lang="ts">
  /**
   * LoadingGenerationArea — a loading **area**: a surface that signals a process in progress,
   * from two composable parts.
   *
   * 1. A backdrop: a **halftone dot field** (`field`, on by default) — a faint
   *    lattice of dots with a couple of soft, brighter *zones* that drift across
   *    it continuously (like the "image generating" dot cards), so different
   *    areas seem to render over time. The dots are a CSS `background` (no
   *    per-dot DOM), so it covers any size cheaply. Turn `field` off to use
   *    LoadingGenerationArea as a plain positioned loading area.
   * 2. A label **zone**, placed via `labelPosition` (`center` default, or
   *    `top`/`bottom`/`left`/`right`), showing any of: a live `status` message,
   *    a `value` percentage, and a `detail` line (bytes, counts).
   *
   * The dot field and an explicit indicator are **alternatives**, never stacked
   * (no loader on a loader): the field *is* the loading visual by default; turn
   * `field` off and drop a different loader — e.g. `<Loading variant="spinner"/>`
   * — into the `indicator` slot to use that instead.
   *
   * When loading finishes, flip `loading` to `false`: LoadingGenerationArea renders its
   * default slot (the real content) in place of the loading placeholder.
   *
   * Accessibility: a polite `role="status"` with an accessible name (`label`,
   * i18n default). When `status` is set it drives the announcement (the region
   * is `aria-atomic`); the percentage and detail are visible but `aria-hidden`
   * so a fast-ticking value isn't re-announced. `decorative` hides it from
   * assistive tech. The twinkle respects `prefers-reduced-motion`. Themeable via
   * `--ds-loading-generation-area-*`.
   */
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Accessible name. Defaults to the i18n catalog's "Loading…". */
  export let label: string | undefined = undefined;
  /** Hide from assistive tech (the surrounding region announces the state). */
  export let decorative = false;
  /**
   * Whether the process is still running. While `true` (default) the loading
   * placeholder is shown; set it to `false` when done and the default slot (the
   * real content) is rendered in its place.
   */
  export let loading = true;
  /** Show the dot field as the backdrop. */
  export let field = true;
  /** Where the label/indicator zone sits over the area. */
  export let labelPosition: "center" | "top" | "bottom" | "left" | "right" = "center";
  /** Live status message — announced on every change. */
  export let status: string | undefined = undefined;
  /** Percentage (0–100), shown as "N%". */
  export let value: number | null = null;
  /** Extra detail line, e.g. "48 MB of 128 MB" or "3 of 8 files". */
  export let detail: string | undefined = undefined;

  $: resolvedLabel = label ?? $t("loading.label");
  $: clamped = value == null ? null : Math.min(100, Math.max(0, value));
  $: hasStatus = status != null;
  $: hasZone = hasStatus || clamped != null || detail != null || $$slots.indicator;
</script>

{#if loading}
  <div
    class="loading-generation-area"
    class:loading-generation-area--field={field}
    data-position={labelPosition}
    role={decorative ? undefined : "status"}
    aria-label={decorative || hasStatus ? undefined : resolvedLabel}
    aria-atomic={hasStatus && !decorative ? "true" : undefined}
    aria-hidden={decorative ? "true" : undefined}
  >
    {#if hasZone}
      <div class="loading-generation-area__zone">
        <slot name="indicator" />
        {#if hasStatus}<span class="loading-generation-area__status">{status}</span>{/if}
        {#if clamped != null}<span class="loading-generation-area__value" aria-hidden="true"
            >{Math.round(clamped)}%</span
          >{/if}
        {#if detail != null}<span class="loading-generation-area__detail" aria-hidden="true"
            >{detail}</span
          >{/if}
      </div>
    {/if}
  </div>
{:else}
  <div class="loading-generation-area__content"><slot /></div>
{/if}

<style>
  .loading-generation-area {
    position: relative;
    display: grid;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: var(--ds-loading-generation-area-min-height, 6rem);
    overflow: hidden;
  }
  /* Label/indicator zone placement. */
  .loading-generation-area[data-position="center"] {
    place-items: center;
  }
  .loading-generation-area[data-position="top"] {
    place-items: start center;
  }
  .loading-generation-area[data-position="bottom"] {
    place-items: end center;
  }
  .loading-generation-area[data-position="left"] {
    place-items: center start;
  }
  .loading-generation-area[data-position="right"] {
    place-items: center end;
  }

  /* The resting lattice: tiny, faint (grey) dots covering the whole surface
     (tiles at any size, no per-dot DOM). */
  .loading-generation-area--field {
    background-image: radial-gradient(
      circle at center,
      color-mix(in srgb, currentColor 10%, transparent) 0 var(--ds-loading-generation-area-dot, 1px),
      transparent calc(var(--ds-loading-generation-area-dot, 1px) + 0.6px)
    );
    background-size: var(--ds-loading-generation-area-gap, 1.1rem)
      var(--ds-loading-generation-area-gap, 1.1rem);
    background-position: center;
  }
  /* Lit zones: the dots at their normal size and full strength (`currentColor`,
     i.e. white on a dark surface) — the resting dots are tiny, so a passing glow
     reads as them coming in. Revealed only under two soft radial "glows" that
     drift across on offset loops. Returning to the start keeps it seamless. */
  .loading-generation-area--field::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: radial-gradient(
      circle at center,
      currentColor 0 var(--ds-loading-generation-area-dot-lit, 2.5px),
      transparent calc(var(--ds-loading-generation-area-dot-lit, 2.5px) + 0.7px)
    );
    background-size: var(--ds-loading-generation-area-gap, 1.1rem)
      var(--ds-loading-generation-area-gap, 1.1rem);
    background-position: center;
    --glow: radial-gradient(circle, #000 0%, rgba(0, 0, 0, 0.45) 38%, transparent 68%);
    -webkit-mask-image: var(--glow), var(--glow);
    mask-image: var(--glow), var(--glow);
    -webkit-mask-repeat: no-repeat, no-repeat;
    mask-repeat: no-repeat, no-repeat;
    -webkit-mask-size:
      62% 62%,
      46% 46%;
    mask-size:
      62% 62%,
      46% 46%;
    -webkit-mask-composite: source-over;
    mask-composite: add;
    animation: loading-generation-area-drift var(--ds-loading-generation-area-duration, 7s)
      ease-in-out infinite;
  }
  @keyframes loading-generation-area-drift {
    0%,
    100% {
      mask-position:
        12% 16%,
        82% 72%;
      -webkit-mask-position:
        12% 16%,
        82% 72%;
    }
    25% {
      mask-position:
        84% 26%,
        24% 80%;
      -webkit-mask-position:
        84% 26%,
        24% 80%;
    }
    50% {
      mask-position:
        68% 84%,
        26% 22%;
      -webkit-mask-position:
        68% 84%,
        26% 22%;
    }
    75% {
      mask-position:
        18% 66%,
        84% 38%;
      -webkit-mask-position:
        18% 66%,
        84% 38%;
    }
  }

  /* The zone sits above the field and stays legible over the dots. */
  .loading-generation-area__zone {
    position: relative;
    z-index: 1;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    margin: var(--ds-loading-generation-area-zone-margin, 0.75rem);
    padding: var(--ds-loading-generation-area-zone-padding, 0.5rem 0.75rem);
    border-radius: var(--ds-radius-control, 0.5rem);
    background: color-mix(in srgb, var(--ds-color-background, #fff) 78%, transparent);
    color: var(--ds-color-text, #0f172a);
    text-align: center;
    font-size: var(--ds-loading-label-size, 0.8125rem);
    line-height: 1.3;
  }
  .loading-generation-area__value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .loading-generation-area__detail {
    color: var(--ds-color-text-secondary, #64748b);
    font-variant-numeric: tabular-nums;
  }

  /* Loaded content fades in where the placeholder was. */
  .loading-generation-area__content {
    animation: loading-generation-area-reveal var(--ds-loading-generation-area-reveal, 240ms)
      ease-out;
  }
  @keyframes loading-generation-area-reveal {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-generation-area--field::after {
      animation: none;
      /* Hold the glows still (a gentle static brightening) instead of drifting. */
      -webkit-mask-position:
        30% 35%,
        72% 68%;
      mask-position:
        30% 35%,
        72% 68%;
    }
    .loading-generation-area__content {
      animation: none;
    }
  }
</style>
