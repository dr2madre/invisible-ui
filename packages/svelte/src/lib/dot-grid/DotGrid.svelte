<script lang="ts">
  /**
   * DotGrid — a loading indicator rendered as a **tiling halftone dot field**:
   * a faint dot pattern fills the whole surface and a brighter band of dots
   * sweeps across it continuously, signalling that a process is in progress
   * (e.g. an area being generated or rendered). Unlike the inline `Loading`
   * variants, this covers a surface as a backdrop and tiles to any size — the
   * dots are a CSS `background`, not per-dot DOM, so it's cheap to cover a whole
   * panel.
   *
   * Meant to sit behind (or in place of) content that isn't ready yet. Place it
   * as a filling layer (`position: absolute; inset: 0`) or give its container a
   * height.
   *
   * Accessibility: a polite `role="status"` with an accessible name (`label`,
   * defaulting to the i18n catalog's "Loading…"), like the other loading
   * indicators. Set `decorative` when the surrounding region already announces
   * the loading state. The sweep respects `prefers-reduced-motion` (the dots
   * stay, static). Colors follow `currentColor`; density and speed are themeable
   * via `--ds-dot-grid-*`.
   */
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  /** Accessible name. Defaults to the i18n catalog's "Loading…". */
  export let label: string | undefined = undefined;
  /** Hide from assistive tech (the surrounding region announces the state). */
  export let decorative = false;

  $: resolvedLabel = label ?? $t("loading.label");
</script>

<div
  class="dot-grid"
  role={decorative ? undefined : "status"}
  aria-label={decorative ? undefined : resolvedLabel}
  aria-hidden={decorative ? "true" : undefined}
></div>

<style>
  .dot-grid {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: var(--ds-dot-grid-min-height, 6rem);
    overflow: hidden;
    /* Resting field: faint dots tiling the whole surface. */
    background-image: radial-gradient(
      circle at center,
      color-mix(in srgb, currentColor 22%, transparent) 0 var(--ds-dot-grid-dot, 1.6px),
      transparent calc(var(--ds-dot-grid-dot, 1.6px) + 0.7px)
    );
    background-size: var(--ds-dot-grid-gap, 1.15rem) var(--ds-dot-grid-gap, 1.15rem);
    background-position: center;
  }
  /* The sweep: the same dots at full strength, revealed only under a moving band
     mask. Bright bands repeat every `--ds-dot-grid-band`, so animating the mask
     by exactly one period loops seamlessly — a lit "area" renders and travels
     across continuously. */
  .dot-grid::after {
    content: "";
    position: absolute;
    inset: 0;
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
  @media (prefers-reduced-motion: reduce) {
    .dot-grid::after {
      animation: none;
      /* No moving band — show a gentle uniform lift so it doesn't read as fully
         static noise. */
      -webkit-mask-image: none;
      mask-image: none;
      opacity: 0.35;
    }
  }
</style>
