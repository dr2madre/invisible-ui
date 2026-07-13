<script>
  // Reusable color swatch: a color chip with its name, HEX and OKLCH. The chip
  // color is a per-instance value, so it's set via the style directive (the one
  // legitimate dynamic-color case) rather than a static class.
  export let name = "";
  export let hex = "#000000";

  const toOklch = (r, g, b) => {
    const lin = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const R = lin(r);
    const G = lin(g);
    const B = lin(b);
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.sqrt(A * A + Bb * Bb);
    let H = (Math.atan2(Bb, A) * 180) / Math.PI;
    if (H < 0) H += 360;
    return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;
  };

  $: r = parseInt(hex.slice(1, 3), 16);
  $: g = parseInt(hex.slice(3, 5), 16);
  $: b = parseInt(hex.slice(5, 7), 16);
  $: oklch = toOklch(r, g, b);
</script>

<figure class="swatch">
  <div class="swatch__chip" style:background-color={hex}></div>
  <figcaption class="swatch__meta">
    {#if name}<span class="swatch__name">{name}</span>{/if}
    <span class="swatch__val"
      ><span class="swatch__k">HEX</span> <code>{hex.toUpperCase()}</code></span
    >
    <span class="swatch__val"><span class="swatch__k">OKLCH</span> <code>{oklch}</code></span>
  </figcaption>
</figure>

<style>
  .swatch {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    align-content: start;
  }
  .swatch__chip {
    block-size: 4rem;
    border-radius: var(--ds-radius-control, 0.5rem);
    border: 1px solid var(--ds-color-border, #cbd5e1);
  }
  .swatch__meta {
    display: grid;
    gap: 0.15rem;
  }
  .swatch__name {
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .swatch__val {
    font-size: 0.7rem;
    color: var(--ds-color-text-secondary, #64748b);
  }
  .swatch__k {
    display: inline-block;
    inline-size: 3rem;
    font-weight: 600;
  }
  .swatch__val code {
    font-size: 0.7rem;
  }
</style>
